import { db } from "@/config/firebase";
import { Colors } from "@/design/colors";
import { Typography } from "@/design/typography";
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
  Text,
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

/** Placed row used as the active target queue (same shape as on-screen targets). */
type ItemType = PlacedItem;

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
  const [remainingTargets, setRemainingTargets] = useState<ItemType[]>([]);
  const [currentTarget, setCurrentTarget] = useState<ItemType | null>(null);

  const wrongAlternateRef = useRef(false);
  const audioChainRef = useRef(Promise.resolve());
  const mountedRef = useRef(true);
  const sessionFinishedRef = useRef(false);
  const remainingTargetsRef = useRef<ItemType[]>([]);
  const currentTargetRef = useRef<ItemType | null>(null);
  const currentTrialIndexRef = useRef(0);

  useEffect(() => {
    currentTrialIndexRef.current = currentTrialIndex;
  }, [currentTrialIndex]);

  useEffect(() => {
    remainingTargetsRef.current = remainingTargets;
  }, [remainingTargets]);

  useEffect(() => {
    currentTargetRef.current = currentTarget;
  }, [currentTarget]);

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
      setRemainingTargets([]);
      setCurrentTarget(null);
      remainingTargetsRef.current = [];
      currentTargetRef.current = null;
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
      setRemainingTargets([]);
      setCurrentTarget(null);
      remainingTargetsRef.current = [];
      currentTargetRef.current = null;
      return;
    }

    setPlacedItems(round);
    setFeedbackById({});

    const shuffledTargets = shuffle(round.filter((p) => p.isTarget));
    remainingTargetsRef.current = shuffledTargets;
    setRemainingTargets(shuffledTargets);
    const first = shuffledTargets[0] ?? null;
    currentTargetRef.current = first;
    setCurrentTarget(first);

    if (voiceEnabled && first) {
      enqueueAudio(async () => {
        if (!mountedRef.current || sessionFinishedRef.current) return;
        await playAudioModule(first.audio);
      });
    }
  }, [
    currentTrialIndex,
    width,
    height,
    itemCount,
    distractorCount,
    receptiveCategory,
    voiceEnabled,
    imageOuter,
    enqueueAudio,
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

      enqueueAudio(async () => {
        if (sessionFinishedRef.current) return;

        const ct = currentTargetRef.current;
        if (!ct) return;

        const stillToFind = remainingTargetsRef.current.some((r) => r.id === item.id);
        if (item.isTarget && !stillToFind && item.id !== ct.id) {
          return;
        }

        if (item.id !== ct.id) {
          wrongAlternateRef.current = !wrongAlternateRef.current;
          if (mountedRef.current) {
            setFeedbackById((prev) => ({ ...prev, [item.id]: "incorrect" }));
          }
          if (voiceEnabled) {
            if (wrongAlternateRef.current) {
              await playAudio("gresit");
            } else {
              await playAudio("mai-incearca");
            }
            const replay = currentTargetRef.current;
            if (replay && mountedRef.current && !sessionFinishedRef.current) {
              await playAudioModule(replay.audio);
            }
          }
          return;
        }

        const updated = remainingTargetsRef.current.filter((i) => i.id !== ct.id);
        remainingTargetsRef.current = updated;
        if (mountedRef.current) {
          setRemainingTargets(updated);
          setFeedbackById((prev) => {
            const next: Record<string, FeedbackState> = {};
            for (const [k, v] of Object.entries(prev)) {
              if (v === "correct") next[k] = "correct";
            }
            next[item.id] = "correct";
            return next;
          });
        }

        if (voiceEnabled) {
          await playAudio("bravo");
        }

        if (updated.length === 0) {
          const ti = currentTrialIndexRef.current;
          if (ti >= TRIAL_TOTAL - 1) {
            await completeSession();
          } else if (mountedRef.current) {
            setCurrentTrialIndex((i) => i + 1);
          }
        } else {
          const nextTarget = updated[0]!;
          currentTargetRef.current = nextTarget;
          if (mountedRef.current) {
            setCurrentTarget(nextTarget);
          }
          if (voiceEnabled && mountedRef.current && !sessionFinishedRef.current) {
            await playAudioModule(nextTarget.audio);
          }
        }
      });
    },
    [enqueueAudio, completeSession, voiceEnabled]
  );

  if (!receptiveCategory || pool.length === 0 || placedItems.length === 0) {
    return <View style={[styles.screen, { width, height }]} />;
  }

  const progressLabel = `${currentTrialIndex + 1} / ${TRIAL_TOTAL}`;

  return (
    <View style={[styles.screen, { width, height }]}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{progressLabel}</Text>
      </View>
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
  /** Same as PatternReproductionTrial / PatternContinuationTrial / TowerConstructionTrial `progressContainer`. */
  progressContainer: {
    position: "absolute",
    top: 20,
    left: 24,
    zIndex: 10,
  },
  /** Same as `trial.tsx` (B1) `styles.progressText`: Typography.small + Colors.textSecondary. */
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
