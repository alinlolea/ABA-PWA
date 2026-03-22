import { db } from "@/config/firebase";
import type { ReceptiveCategory } from "@/features/receptive-language/categories";
import {
  getReceptiveItemPool,
  isReceptiveCategory,
  type ReceptiveItemAsset,
} from "@/features/receptive-language/receptiveItemAssets";
import { playAudioModule } from "@/features/receptive-language/playReceptiveAsset";
import { playAudio } from "@/utils/audio";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const TRIAL_TOTAL = 10;

type FeedbackState = "neutral" | "correct" | "incorrect";

type PlacedItem = ReceptiveItemAsset & {
  isTarget: boolean;
  left: number;
  top: number;
};

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

function buildRound(
  pool: ReceptiveItemAsset[],
  itemCount: number,
  distractorCount: number,
  width: number,
  height: number,
  imageOuter: number
): PlacedItem[] | null {
  if (pool.length === 0) return null;
  const n = Math.min(itemCount, pool.length);
  const maxD = Math.min(distractorCount, Math.max(0, pool.length - n));
  const shuffled = shuffle([...pool]);
  const targetAssets = shuffled.slice(0, n);
  const distractorAssets = shuffled.slice(n, n + maxD);
  const combined: (ReceptiveItemAsset & { isTarget: boolean })[] = shuffle([
    ...targetAssets.map((t) => ({ ...t, isTarget: true })),
    ...distractorAssets.map((d) => ({ ...d, isTarget: false })),
  ]);
  const positions = buildPlacements(combined.length, width, height, imageOuter);
  return combined.map((c, i) => ({
    ...c,
    left: positions[i]!.left,
    top: positions[i]!.top,
  }));
}

export type ReceptiveShowCommonObjectsTrialProps = {
  sessionId: string;
  category: string;
  itemCount: number;
  distractorCount: number;
  voiceEnabled?: boolean;
};

export default function ReceptiveShowCommonObjectsTrial({
  sessionId,
  category,
  itemCount: itemCountProp,
  distractorCount: distractorCountProp,
  voiceEnabled = true,
}: ReceptiveShowCommonObjectsTrialProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const itemCount = Math.min(5, Math.max(1, itemCountProp));
  const distractorCount = Math.min(3, Math.max(0, distractorCountProp));

  const receptiveCategory: ReceptiveCategory | null = useMemo(
    () => (isReceptiveCategory(category) ? category : null),
    [category]
  );

  const pool = useMemo(
    () => (receptiveCategory ? getReceptiveItemPool(receptiveCategory) : []),
    [receptiveCategory]
  );

  const imageOuter = Math.min(112, Math.max(72, width * 0.11));

  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackState>>({});
  const [instructionBlocking, setInstructionBlocking] = useState(true);

  const wrongAlternateRef = useRef(false);
  const audioChainRef = useRef(Promise.resolve());
  const mountedRef = useRef(true);
  const selectedCorrectRef = useRef<string[]>([]);
  const instructionBlockingRef = useRef(true);
  const sessionFinishedRef = useRef(false);

  useEffect(() => {
    instructionBlockingRef.current = instructionBlocking;
  }, [instructionBlocking]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enqueueAudio = useCallback((fn: () => Promise<void>) => {
    audioChainRef.current = audioChainRef.current.then(fn).catch(() => {});
  }, []);

  useEffect(() => {
    const poolNow = receptiveCategory ? getReceptiveItemPool(receptiveCategory) : [];
    if (!receptiveCategory || poolNow.length === 0) {
      setPlacedItems([]);
      return;
    }
    const round = buildRound(
      poolNow,
      itemCount,
      distractorCount,
      width,
      height,
      imageOuter
    );
    if (!round) {
      setPlacedItems([]);
      return;
    }

    selectedCorrectRef.current = [];
    setPlacedItems(round);
    setFeedbackById({});
    setInstructionBlocking(true);
    instructionBlockingRef.current = true;

    if (!voiceEnabled) {
      setInstructionBlocking(false);
      instructionBlockingRef.current = false;
      return;
    }

    const targets = shuffle(round.filter((p) => p.isTarget));
    let cancelled = false;

    (async () => {
      for (const t of targets) {
        if (cancelled || !mountedRef.current) return;
        await playAudioModule(t.audio);
      }
      if (!cancelled && mountedRef.current) {
        setInstructionBlocking(false);
        instructionBlockingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentTrialIndex,
    width,
    height,
    itemCount,
    distractorCount,
    receptiveCategory,
    voiceEnabled,
    imageOuter,
  ]);

  const completeSession = useCallback(async () => {
    if (sessionFinishedRef.current) return;
    sessionFinishedRef.current = true;
    await updateDoc(doc(db, "sessions", sessionId), {
      completedAt: serverTimestamp(),
      totalTrials: TRIAL_TOTAL,
      correctTrials: TRIAL_TOTAL,
    }).catch(() => {});
    router.back();
  }, [sessionId, router]);

  const handlePress = useCallback(
    (item: PlacedItem) => {
      if (sessionFinishedRef.current) return;
      if (instructionBlockingRef.current) return;

      enqueueAudio(async () => {
        if (sessionFinishedRef.current) return;
        if (instructionBlockingRef.current) return;

        if (!item.isTarget) {
          wrongAlternateRef.current = !wrongAlternateRef.current;
          if (voiceEnabled) {
            if (wrongAlternateRef.current) {
              await playAudio("gresit");
            } else {
              await playAudio("mai-incearca");
            }
          }
          if (mountedRef.current) {
            setFeedbackById((prev) => ({ ...prev, [item.id]: "incorrect" }));
          }
          return;
        }

        if (selectedCorrectRef.current.includes(item.id)) return;

        const nextCorrect = [...selectedCorrectRef.current, item.id];
        selectedCorrectRef.current = nextCorrect;
        if (mountedRef.current) {
          setFeedbackById((prev) => ({ ...prev, [item.id]: "correct" }));
        }

        if (voiceEnabled) {
          await playAudio("bravo");
        }

        if (nextCorrect.length >= itemCount) {
          if (currentTrialIndex >= TRIAL_TOTAL - 1) {
            await completeSession();
          } else if (mountedRef.current) {
            setCurrentTrialIndex((i) => i + 1);
          }
        }
      });
    },
    [enqueueAudio, itemCount, currentTrialIndex, completeSession, voiceEnabled]
  );

  if (!receptiveCategory || pool.length === 0 || placedItems.length === 0) {
    return <View style={[styles.screen, { width, height }]} />;
  }

  return (
    <View style={[styles.screen, { width, height }]}>
      {placedItems.map((item) => {
        const fb = feedbackById[item.id] ?? "neutral";
        const borderColor =
          fb === "correct" ? "#22C55E" : fb === "incorrect" ? "#EF4444" : "#64748B";
        return (
          <Pressable
            key={`${currentTrialIndex}-${item.id}-${item.left}-${item.top}`}
            accessibilityLabel=""
            style={[
              styles.tile,
              {
                left: item.left,
                top: item.top,
                width: imageOuter,
                height: imageOuter,
                borderColor,
              },
            ]}
            onPress={() => handlePress(item)}
          >
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
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
