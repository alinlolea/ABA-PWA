import { db } from "@/config/firebase";
import { Colors } from "@/design/colors";
import { Typography } from "@/design/typography";
import {
  getIdentifyByCategoryPool,
  getIdentifyByCategoryPromptAudio,
  type IdentifyByCategoryId,
  type IdentifyByCategoryItem,
} from "@/features/receptive-language/identifyByCategoryAssets";
import { playAudioModule } from "@/features/receptive-language/playReceptiveAsset";
import { playErrorAudio, playSuccessAudio } from "@/utils/audio";
import { getUnifiedTrialStimulusSize } from "@/utils/trialStimulusSize";
import { trialUiRootShellStyle } from "@/utils/trialUiShell";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const TRIAL_TOTAL = 10;
const POST_RESPONSE_MS = 800;
const BETWEEN_PROMPT_MS = 400;

type FeedbackState = "neutral" | "incorrect";

type PlacedIdentifyItem = IdentifyByCategoryItem & {
  left: number;
  top: number;
};

function itemKey(it: IdentifyByCategoryItem): string {
  return `${it.categoryId}:${it.id}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPlacements(
  count: number,
  width: number,
  height: number,
  imageOuter: number
): { left: number; top: number }[] {
  const padX = width * 0.05;
  const padY = height * 0.05;
  const UW = width * 0.9;
  const UH = height * 0.9;
  const cols = Math.max(2, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / cols);
  const cellW = UW / cols;
  const cellH = UH / rows;
  const cellOrder = shuffle([...Array(count).keys()]);
  const out: { left: number; top: number }[] = [];
  for (let i = 0; i < count; i++) {
    const cellIdx = cellOrder[i]!;
    const col = cellIdx % cols;
    const row = Math.floor(cellIdx / cols);
    const maxJitterX = Math.max(0, cellW - imageOuter - 6);
    const maxJitterY = Math.max(0, cellH - imageOuter - 6);
    const jitterX = maxJitterX > 0 ? Math.random() * maxJitterX : 0;
    const jitterY = maxJitterY > 0 ? Math.random() * maxJitterY : 0;
    out.push({
      left: padX + col * cellW + jitterX,
      top: padY + row * cellH + jitterY,
    });
  }
  return out;
}

function layoutSignatureFromPlaced(placed: PlacedIdentifyItem[]): string {
  const keys = [...placed].map((p) => itemKey(p)).sort().join("|");
  const pos = [...placed]
    .map((p) => `${Math.round(p.left)},${Math.round(p.top)}`)
    .sort()
    .join(";");
  return `${keys}|${pos}`;
}

function sampleItemsForCategories(
  categories: IdentifyByCategoryId[],
  perCategory: number
): IdentifyByCategoryItem[] {
  const seen = new Set<string>();
  const out: IdentifyByCategoryItem[] = [];
  for (const cat of categories) {
    const pool = getIdentifyByCategoryPool(cat);
    const shuffled = shuffle([...pool]);
    const take = Math.min(perCategory, shuffled.length);
    for (let i = 0; i < take; i++) {
      const it = shuffled[i]!;
      const k = itemKey(it);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(it);
      }
    }
  }
  return out;
}

/** Prefer a different category than the last prompt when more than one still has unidentified items. */
function pickNextPromptCategory(
  placed: PlacedIdentifyItem[],
  unidentified: Set<string>,
  lastPromptedCategory: IdentifyByCategoryId | null
): IdentifyByCategoryId | null {
  const eligible = new Set<IdentifyByCategoryId>();
  for (const p of placed) {
    if (unidentified.has(itemKey(p))) eligible.add(p.categoryId);
  }
  const list = [...eligible];
  if (list.length === 0) return null;
  if (list.length === 1) return list[0]!;
  const others = list.filter((c) => c !== lastPromptedCategory);
  const pool = others.length > 0 ? others : list;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function buildRound(
  categories: IdentifyByCategoryId[],
  perCategory: number,
  width: number,
  height: number,
  imageOuter: number,
  lastSignature: string | null
): { placed: PlacedIdentifyItem[] } | null {
  if (categories.length < 2) return null;

  const maxAttempts = 24;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const items = sampleItemsForCategories(categories, perCategory);
    if (items.length === 0) continue;

    const catsOnScreen = new Set(items.map((i) => i.categoryId));
    if (catsOnScreen.size < 2) continue;

    const shuffledItems = shuffle(items);
    const positions = buildPlacements(shuffledItems.length, width, height, imageOuter);
    const placed: PlacedIdentifyItem[] = shuffledItems.map((it, i) => ({
      ...it,
      left: positions[i]!.left,
      top: positions[i]!.top,
    }));

    const sig = layoutSignatureFromPlaced(placed);
    if (lastSignature != null && sig === lastSignature && attempt < maxAttempts - 1) {
      continue;
    }

    return { placed };
  }

  return null;
}

export type ReceptiveIdentifyByCategoryTrialProps = {
  sessionId: string;
  selectedCategories: IdentifyByCategoryId[];
  itemsPerCategory: number;
  voiceEnabled?: boolean;
};

export default function ReceptiveIdentifyByCategoryTrial({
  sessionId,
  selectedCategories,
  itemsPerCategory: itemsPerCategoryProp,
  voiceEnabled = true,
}: ReceptiveIdentifyByCategoryTrialProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const perCat = Math.min(4, Math.max(1, itemsPerCategoryProp));

  const imageOuter = getUnifiedTrialStimulusSize(width, height);

  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [placedItems, setPlacedItems] = useState<PlacedIdentifyItem[]>([]);
  /** Correctly identified items are removed from the screen for the rest of this trial. */
  const [eliminatedKeys, setEliminatedKeys] = useState<Set<string>>(() => new Set());
  const [feedbackByKey, setFeedbackByKey] = useState<Record<string, FeedbackState>>({});
  const [promptReady, setPromptReady] = useState(false);
  const [interactionLocked, setInteractionLocked] = useState(false);

  const mountedRef = useRef(true);
  const sessionFinishedRef = useRef(false);
  const placedItemsRef = useRef<PlacedIdentifyItem[]>([]);
  /** Items not yet correctly identified for the current prompt sequence. */
  const unidentifiedKeysRef = useRef<Set<string>>(new Set());
  /** Category spoken in the current instruction (must match tap). */
  const currentPromptCategoryRef = useRef<IdentifyByCategoryId | null>(null);
  const lastLayoutSigRef = useRef<string | null>(null);
  const correctTrialsRef = useRef(0);
  const audioChainRef = useRef(Promise.resolve());

  useEffect(() => {
    placedItemsRef.current = placedItems;
  }, [placedItems]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enqueueAudio = useCallback((fn: () => Promise<void>) => {
    audioChainRef.current = audioChainRef.current.then(fn).catch(() => {});
  }, []);

  const completeSession = useCallback(async () => {
    if (sessionFinishedRef.current) return;
    sessionFinishedRef.current = true;
    await updateDoc(doc(db, "sessions", sessionId), {
      completedAt: serverTimestamp(),
      totalTrials: TRIAL_TOTAL,
      correctTrials: correctTrialsRef.current,
    }).catch(() => {});
    router.back();
  }, [sessionId, router]);

  const advanceAfterResponse = useCallback(() => {
    if (sessionFinishedRef.current) return;
    const ti = currentTrialIndex;
    if (ti >= TRIAL_TOTAL - 1) {
      void completeSession();
    } else {
      setCurrentTrialIndex((i) => i + 1);
    }
  }, [currentTrialIndex, completeSession]);

  useEffect(() => {
    if (selectedCategories.length < 2) {
      setPlacedItems([]);
      setEliminatedKeys(new Set());
      unidentifiedKeysRef.current = new Set();
      currentPromptCategoryRef.current = null;
      setPromptReady(false);
      return;
    }

    setPromptReady(false);
    setInteractionLocked(false);
    setFeedbackByKey({});
    setEliminatedKeys(new Set());

    const round = buildRound(
      selectedCategories,
      perCat,
      width,
      height,
      imageOuter,
      lastLayoutSigRef.current
    );

    if (!round) {
      setPlacedItems([]);
      setEliminatedKeys(new Set());
      unidentifiedKeysRef.current = new Set();
      currentPromptCategoryRef.current = null;
      setPromptReady(false);
      return;
    }

    lastLayoutSigRef.current = layoutSignatureFromPlaced(round.placed);
    setPlacedItems(round.placed);
    placedItemsRef.current = round.placed;

    unidentifiedKeysRef.current = new Set(round.placed.map(itemKey));
    const firstPrompt = pickNextPromptCategory(
      round.placed,
      unidentifiedKeysRef.current,
      null
    );
    currentPromptCategoryRef.current = firstPrompt;

    if (firstPrompt == null) {
      setPromptReady(false);
      return;
    }

    if (!voiceEnabled) {
      setPromptReady(true);
      return;
    }

    enqueueAudio(async () => {
      if (!mountedRef.current || sessionFinishedRef.current) return;
      const cat = currentPromptCategoryRef.current;
      if (cat == null) return;
      if (mountedRef.current) setPromptReady(false);
      await playAudioModule(getIdentifyByCategoryPromptAudio(cat));
      if (mountedRef.current && !sessionFinishedRef.current) {
        setPromptReady(true);
      }
    });
  }, [
    currentTrialIndex,
    selectedCategories,
    perCat,
    width,
    height,
    imageOuter,
    voiceEnabled,
    enqueueAudio,
  ]);

  const handlePress = useCallback(
    (item: PlacedIdentifyItem) => {
      if (sessionFinishedRef.current || !promptReady || interactionLocked) return;
      const promptCat = currentPromptCategoryRef.current;
      if (promptCat == null) return;

      const k = itemKey(item);
      const unidentified = unidentifiedKeysRef.current;
      const stillUnidentified = unidentified.has(k);
      const matchesPrompt = item.categoryId === promptCat;

      if (matchesPrompt && !stillUnidentified) {
        return;
      }

      const isCorrect = matchesPrompt && stillUnidentified;

      setInteractionLocked(true);
      if (voiceEnabled) {
        setPromptReady(false);
      }

      enqueueAudio(async () => {
        if (sessionFinishedRef.current) return;

        if (isCorrect) {
          const promptedCategory = promptCat;
          unidentified.delete(k);
          const trialComplete = unidentified.size === 0;

          if (mountedRef.current) {
            setEliminatedKeys((prev) => new Set([...prev, k]));
          }

          if (voiceEnabled) {
            await playSuccessAudio();
            await new Promise<void>((r) => setTimeout(r, BETWEEN_PROMPT_MS));
          } else {
            await new Promise<void>((r) => setTimeout(r, POST_RESPONSE_MS));
          }

          if (!mountedRef.current || sessionFinishedRef.current) return;

          if (trialComplete) {
            correctTrialsRef.current += 1;
            if (voiceEnabled) setPromptReady(false);
            advanceAfterResponse();
            return;
          }

          const nextCat = pickNextPromptCategory(
            placedItemsRef.current,
            unidentified,
            promptedCategory
          );
          currentPromptCategoryRef.current = nextCat;

          if (voiceEnabled && nextCat != null) {
            await playAudioModule(getIdentifyByCategoryPromptAudio(nextCat));
          }

          if (mountedRef.current && !sessionFinishedRef.current) {
            setPromptReady(true);
            setInteractionLocked(false);
          }
          return;
        }

        if (mountedRef.current) {
          setFeedbackByKey((prev) => ({ ...prev, [k]: "incorrect" }));
        }
        if (voiceEnabled) {
          await playErrorAudio();
          await new Promise<void>((r) => setTimeout(r, BETWEEN_PROMPT_MS));
          const repeatCat = currentPromptCategoryRef.current;
          if (repeatCat != null) {
            await playAudioModule(getIdentifyByCategoryPromptAudio(repeatCat));
          }
        } else {
          await new Promise<void>((r) => setTimeout(r, POST_RESPONSE_MS));
        }

        if (mountedRef.current && !sessionFinishedRef.current) {
          setFeedbackByKey((prev) => {
            const next = { ...prev };
            delete next[k];
            return next;
          });
          setPromptReady(true);
          setInteractionLocked(false);
        }
      });
    },
    [promptReady, interactionLocked, voiceEnabled, enqueueAudio, advanceAfterResponse]
  );

  if (selectedCategories.length < 2 || placedItems.length === 0) {
    return <View style={[styles.screen, { width, height }, trialUiRootShellStyle]} />;
  }

  const progressLabel = `${currentTrialIndex + 1} / ${TRIAL_TOTAL}`;
  const tapsEnabled = promptReady && !interactionLocked;
  const visiblePlacedItems = placedItems.filter((p) => !eliminatedKeys.has(itemKey(p)));

  return (
    <View style={[styles.screen, { width, height }, trialUiRootShellStyle]}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{progressLabel}</Text>
      </View>
      {visiblePlacedItems.map((item) => {
        const k = itemKey(item);
        const fb = feedbackByKey[k] ?? "neutral";
        const borderColor = fb === "incorrect" ? "#EF4444" : "#64748B";
        return (
          <Pressable
            key={`${currentTrialIndex}-${k}-${item.left}-${item.top}`}
            accessibilityLabel=""
            disabled={!tapsEnabled}
            style={[
              styles.tile,
              {
                left: item.left,
                top: item.top,
                width: imageOuter,
                height: imageOuter,
                borderColor,
                opacity: tapsEnabled || fb !== "neutral" ? 1 : 0.92,
              },
            ]}
            onPress={() => handlePress(item)}
          >
            <Image
              source={item.image}
              style={styles.image}
              contentFit="contain"
              accessibilityIgnoresInvertColors
              recyclingKey={`${currentTrialIndex}-${k}`}
              {...(Platform.OS === "web" ? { draggable: false } : {})}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F2F5F7",
    position: "relative",
  },
  progressContainer: {
    position: "absolute",
    top: 20,
    left: 24,
    zIndex: 10,
  },
  progressText: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
  tile: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 10,
    padding: 6,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
