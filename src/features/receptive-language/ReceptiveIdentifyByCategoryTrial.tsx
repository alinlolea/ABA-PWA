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

type FeedbackState = "neutral" | "correct" | "incorrect";

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

function layoutSignature(targetCategory: IdentifyByCategoryId, placed: PlacedIdentifyItem[]): string {
  const keys = [...placed].map((p) => itemKey(p)).sort().join("|");
  const pos = [...placed]
    .map((p) => `${Math.round(p.left)},${Math.round(p.top)}`)
    .sort()
    .join(";");
  return `${targetCategory}|${keys}|${pos}`;
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

function buildRound(
  categories: IdentifyByCategoryId[],
  perCategory: number,
  width: number,
  height: number,
  imageOuter: number,
  lastSignature: string | null
): { placed: PlacedIdentifyItem[]; targetCategory: IdentifyByCategoryId } | null {
  if (categories.length < 2) return null;

  const maxAttempts = 24;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const targetCategory = categories[Math.floor(Math.random() * categories.length)]!;
    const items = sampleItemsForCategories(categories, perCategory);
    const correctPool = items.filter((it) => it.categoryId === targetCategory);
    if (correctPool.length === 0) continue;

    const shuffledItems = shuffle(items);
    const positions = buildPlacements(shuffledItems.length, width, height, imageOuter);
    const placed: PlacedIdentifyItem[] = shuffledItems.map((it, i) => ({
      ...it,
      left: positions[i]!.left,
      top: positions[i]!.top,
    }));

    const sig = layoutSignature(targetCategory, placed);
    if (lastSignature != null && sig === lastSignature && attempt < maxAttempts - 1) {
      continue;
    }

    return { placed, targetCategory };
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
  const [feedbackByKey, setFeedbackByKey] = useState<Record<string, FeedbackState>>({});
  const [promptReady, setPromptReady] = useState(false);
  const [interactionLocked, setInteractionLocked] = useState(false);

  const mountedRef = useRef(true);
  const sessionFinishedRef = useRef(false);
  /** Category named in the prompt; every on-screen item in this category must be tapped. */
  const targetCategoryRef = useRef<IdentifyByCategoryId | null>(null);
  const remainingTargetKeysRef = useRef<Set<string>>(new Set());
  const lastLayoutSigRef = useRef<string | null>(null);
  const correctTrialsRef = useRef(0);
  const audioChainRef = useRef(Promise.resolve());

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

  useEffect(() => {
    if (selectedCategories.length < 2) {
      setPlacedItems([]);
      targetCategoryRef.current = null;
      remainingTargetKeysRef.current = new Set();
      setPromptReady(false);
      return;
    }

    setPromptReady(false);
    setInteractionLocked(false);
    setFeedbackByKey({});

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
      targetCategoryRef.current = null;
      remainingTargetKeysRef.current = new Set();
      setPromptReady(false);
      return;
    }

    lastLayoutSigRef.current = layoutSignature(round.targetCategory, round.placed);
    targetCategoryRef.current = round.targetCategory;
    remainingTargetKeysRef.current = new Set(
      round.placed.filter((p) => p.categoryId === round.targetCategory).map(itemKey)
    );
    setPlacedItems(round.placed);

    if (!voiceEnabled) {
      setPromptReady(true);
      return;
    }

    enqueueAudio(async () => {
      if (!mountedRef.current || sessionFinishedRef.current) return;
      await playAudioModule(getIdentifyByCategoryPromptAudio(round.targetCategory));
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

  const advanceAfterResponse = useCallback(() => {
    if (sessionFinishedRef.current) return;
    const ti = currentTrialIndex;
    if (ti >= TRIAL_TOTAL - 1) {
      void completeSession();
    } else {
      setCurrentTrialIndex((i) => i + 1);
    }
  }, [currentTrialIndex, completeSession]);

  const handlePress = useCallback(
    (item: PlacedIdentifyItem) => {
      if (sessionFinishedRef.current || !promptReady || interactionLocked) return;
      const targetCat = targetCategoryRef.current;
      if (targetCat == null) return;

      const k = itemKey(item);
      const inTargetCategory = item.categoryId === targetCat;
      const stillNeeded = remainingTargetKeysRef.current.has(k);

      if (inTargetCategory && !stillNeeded) {
        return;
      }

      const isCorrect = inTargetCategory && stillNeeded;

      setInteractionLocked(true);

      enqueueAudio(async () => {
        if (sessionFinishedRef.current) return;

        if (isCorrect) {
          remainingTargetKeysRef.current.delete(k);
          const trialComplete = remainingTargetKeysRef.current.size === 0;

          if (mountedRef.current) {
            setFeedbackByKey((prev) => ({ ...prev, [k]: "correct" }));
          }
          if (voiceEnabled) {
            await playSuccessAudio();
          }

          await new Promise<void>((r) => setTimeout(r, POST_RESPONSE_MS));

          if (!mountedRef.current || sessionFinishedRef.current) return;

          if (trialComplete) {
            correctTrialsRef.current += 1;
            advanceAfterResponse();
          } else if (mountedRef.current) {
            setInteractionLocked(false);
          }
          return;
        }

        if (mountedRef.current) {
          setFeedbackByKey((prev) => ({ ...prev, [k]: "incorrect" }));
        }
        if (voiceEnabled) {
          await playErrorAudio();
        }

        await new Promise<void>((r) => setTimeout(r, POST_RESPONSE_MS));

        if (mountedRef.current && !sessionFinishedRef.current) {
          setFeedbackByKey((prev) => {
            const next = { ...prev };
            delete next[k];
            return next;
          });
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

  return (
    <View style={[styles.screen, { width, height }, trialUiRootShellStyle]}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{progressLabel}</Text>
      </View>
      {placedItems.map((item) => {
        const k = itemKey(item);
        const fb = feedbackByKey[k] ?? "neutral";
        const borderColor =
          fb === "correct" ? "#22C55E" : fb === "incorrect" ? "#EF4444" : "#64748B";
        return (
          <Pressable
            key={`${currentTrialIndex}-${k}-${item.left}-${item.top}`}
            accessibilityLabel=""
            disabled={!tapsEnabled || fb === "correct"}
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
