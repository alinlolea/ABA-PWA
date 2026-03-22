/**
 * Logical Image Matching – "Asociere logică imagini"
 * UI + drag-and-drop; pair data and selection come from logicalMatchingEngine.
 * Layout: top pool, gradient divider; bottom = drop row then static target row (aligned columns).
 */

import { Spacing } from "@/design/spacing";
import { Theme } from "@/design/theme";
import {
  effectiveCompletedPairSet,
  generateLogicalMatchingTrial,
  shouldClearPersistedCompletedPairIds,
  type LogicalTrialGenerationResult,
  type LogicalTrialImage,
} from "@/utils/logicalMatchingEngine";
import { db } from "@/config/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { playAudio } from "@/utils/audio";
import { stopSpeech } from "@/utils/speech";
import { useResponsive } from "@/utils/responsive";

const ITEM_RADIUS = 16;
const SNAP_DURATION = 200;
const RETURN_DURATION = 200;
const DROP_DISTANCE_MULT = 1.25;
const MAX_PAIRS = 5;
const TOTAL_TRIALS = 10;
/** After last correct placement, delay before advancing (PatternReproductionTrial-style). */
const TRIAL_ADVANCE_DELAY_MS = 1200;
/** Image fills ~96% of square; keeps aspect ratio via contain (Pattern-style proportions). */
const IMAGE_FILL_RATIO = 0.96;
/** Match PatternReproductionTrial feedback timing */
const SHAKE_DURATION = 300;
const BORDER_SUCCESS = "#2ecc71";
const BORDER_ERROR = "#e74c3c";
const FEEDBACK_LOCK_CORRECT_MS = 450;

function LogicalImageView({
  image,
  containerSize,
  borderRadius,
}: {
  image: LogicalTrialImage["image"];
  containerSize: number;
  borderRadius: number;
}) {
  const dim = Math.max(1, containerSize * IMAGE_FILL_RATIO);
  return (
    <Image
      source={image}
      resizeMode="contain"
      style={{
        width: dim,
        height: dim,
        borderRadius,
      }}
      accessibilityIgnoresInvertColors
    />
  );
}

function ImageCard({ item, size }: { item: LogicalTrialImage; size: number }) {
  const innerRadius = Math.max(6, ITEM_RADIUS - 4);
  return (
    <View
      style={[
        styles.cardOuter,
        {
          width: size,
          height: size,
          borderRadius: ITEM_RADIUS,
          backgroundColor: Theme.colors.card,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
      ]}
    >
      <LogicalImageView image={item.image} containerSize={size} borderRadius={innerRadius} />
    </View>
  );
}

function rectsOverlap(
  x1: number,
  y1: number,
  size1: number,
  x2: number,
  y2: number,
  size2: number
): boolean {
  return (
    x1 < x2 + size2 &&
    x2 < x1 + size1 &&
    y1 < y2 + size2 &&
    y2 < y1 + size1
  );
}

/** Drop zone with Pattern-style border (0=idle, 1=correct green, 2=incorrect red) + horizontal shake. */
function AnimatedDropSlot({
  itemSize,
  slotRef,
  onMeasureLayout,
  shakeAnim,
  borderAnim,
  children,
}: {
  itemSize: number;
  slotRef: (el: View | null) => void;
  onMeasureLayout: () => void;
  shakeAnim: Animated.Value;
  borderAnim: Animated.Value;
  children: React.ReactNode;
}) {
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["rgba(0,0,0,0)", BORDER_SUCCESS, BORDER_ERROR],
  });
  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 3, 3],
  });
  return (
    <Animated.View
      ref={(el) => slotRef(el as unknown as View)}
      collapsable={false}
      onLayout={onMeasureLayout}
      style={[
        styles.dropCell,
        { width: itemSize, height: itemSize },
        {
          transform: [{ translateX: shakeAnim }],
          borderWidth,
          borderColor,
          borderRadius: ITEM_RADIUS,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export type LogicalMatchingTrialProps = {
  /** Number of pairs (1–5). */
  pairCount: number;
  /** Optional: Firestore session doc id (same pattern as PatternReproductionTrial). */
  sessionId?: string;
  onComplete?: () => void;
  /** Play trial-start prompt (same pattern as PatternReproductionTrial). */
  voiceEnabled?: boolean;
};

export default function LogicalMatchingTrial({
  pairCount,
  sessionId,
  onComplete,
  voiceEnabled = true,
}: LogicalMatchingTrialProps) {
  const { width: screenWidth, height: screenHeight, rs } = useResponsive();
  const topZoneHeight = screenHeight * 0.6;

  const n = Math.min(MAX_PAIRS, Math.max(1, Math.floor(pairCount)));

  const [completedPairIds, setCompletedPairIds] = useState<string[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [trialsCompletedScore, setTrialsCompletedScore] = useState(0);
  const [correctDropCount, setCorrectDropCount] = useState(0);
  const [incorrectAttemptCount, setIncorrectAttemptCount] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const effectiveCompleted = useMemo(
    () => effectiveCompletedPairSet(completedPairIds, n),
    [completedPairIds, n]
  );

  const trial = useMemo(
    () => generateLogicalMatchingTrial(n, effectiveCompleted),
    [n, effectiveCompleted, currentTrialIndex]
  );

  const trialRef = useRef(trial);
  trialRef.current = trial;

  useEffect(() => {
    if (shouldClearPersistedCompletedPairIds(completedPairIds, n)) {
      setCompletedPairIds([]);
    }
  }, [completedPairIds, n]);

  const handleTrialFullyComplete = useCallback(() => {
    const ids = trialRef.current.selectedPairIds;
    setCompletedPairIds((prev) => [...new Set([...prev, ...ids])]);
    setTrialsCompletedScore((s) => s + 1);
    setCurrentTrialIndex((prev) => {
      if (prev >= TOTAL_TRIALS - 1) {
        setSessionCompleted(true);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const firestoreSessionSyncedRef = useRef(false);
  useEffect(() => {
    if (!sessionCompleted || !sessionId || firestoreSessionSyncedRef.current) return;
    firestoreSessionSyncedRef.current = true;
    updateDoc(doc(db, "sessions", sessionId), {
      completedAt: serverTimestamp(),
      correctTrials: trialsCompletedScore,
      totalTrials: TOTAL_TRIALS,
    });
    onComplete?.();
  }, [sessionCompleted, sessionId, trialsCompletedScore, onComplete]);

  const totalItems = Math.max(1, trial.topImages.length || 1);
  const availableWidth = screenWidth * 0.9;
  const sizeFromWidth = availableWidth / totalItems;
  const maxItemSize = rs(90);
  const itemSize = Math.min(maxItemSize, sizeFromWidth, topZoneHeight * 0.32);

  const progressLabel = `${currentTrialIndex + 1} / ${TOTAL_TRIALS}`;
  /** Remount inner when trial index or drawn pair set changes (avoid tying to completedPairIds to prevent clearing advance timeout). */
  const innerKey = `${currentTrialIndex}-${trial.selectedPairIds.slice().sort().join("|")}`;

  if (sessionCompleted) {
    return (
      <View style={styles.root}>
        <View style={styles.completedRoot}>
          <Text style={styles.completedTitle}>Sesiune finalizată</Text>
          <Text style={styles.completedScore}>
            Probe reușite: {trialsCompletedScore} / {TOTAL_TRIALS}
          </Text>
          <Text style={styles.completedSubScore}>
            Plasări corecte: {correctDropCount} · Încercări greșite: {incorrectAttemptCount}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <LogicalMatchingTrialInner
      key={innerKey}
      trial={trial}
      screenWidth={screenWidth}
      topZoneHeight={topZoneHeight}
      itemSize={itemSize}
      progressLabel={progressLabel}
      voiceEnabled={voiceEnabled}
      onTrialFullyComplete={handleTrialFullyComplete}
      onCorrectPlacement={() => setCorrectDropCount((c) => c + 1)}
      onIncorrectAttempt={() => setIncorrectAttemptCount((c) => c + 1)}
    />
  );
}

type InnerProps = {
  trial: LogicalTrialGenerationResult;
  screenWidth: number;
  topZoneHeight: number;
  itemSize: number;
  progressLabel?: string;
  voiceEnabled?: boolean;
  onTrialFullyComplete: () => void;
  onCorrectPlacement: () => void;
  onIncorrectAttempt: () => void;
};

function LogicalMatchingTrialInner({
  trial,
  screenWidth,
  topZoneHeight,
  itemSize,
  progressLabel,
  voiceEnabled = true,
  onTrialFullyComplete,
  onCorrectPlacement,
  onIncorrectAttempt,
}: InnerProps) {
  const { rs } = useResponsive();
  const topImages = trial.topImages;
  const bottomTargets = trial.bottomTargets;
  const n = topImages.length;

  const [slotContents, setSlotContents] = useState<(LogicalTrialImage | null)[]>(() =>
    Array(n).fill(null)
  );
  const slotContentsRef = useRef(slotContents);
  slotContentsRef.current = slotContents;
  const [placedPoolIndices, setPlacedPoolIndices] = useState<number[]>([]);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [cubePositions, setCubePositions] = useState<{ x: number; y: number }[]>([]);
  const [interactionLocked, setInteractionLocked] = useState(false);
  /** False until trial-start audio finishes (or skipped when voice off) — blocks drag like other trials. */
  const [trialPromptReady, setTrialPromptReady] = useState(!voiceEnabled);

  const topZoneWidth = screenWidth;

  const poolRef = useRef<View | null>(null);
  const poolLayout = useRef({ x: 0, y: 0 });
  const dropSlotRefs = useRef<(View | null)[]>([]);
  const dropLayouts = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const feedbackBusyRef = useRef(false);
  const correctFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (correctFeedbackTimeoutRef.current != null) {
        clearTimeout(correctFeedbackTimeoutRef.current);
      }
    },
    []
  );

  /** Once per inner mount (= per trial): delay → stop TTS → prompt audio → enable drag. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!voiceEnabled) {
        setTrialPromptReady(true);
        return;
      }
      await new Promise<void>((r) => setTimeout(r, 200));
      if (cancelled) return;
      stopSpeech();
      await playAudio("potriveste_perechea");
      if (!cancelled) setTrialPromptReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [voiceEnabled]);

  const slotBorderAnims = useRef(
    Array.from({ length: MAX_PAIRS }, () => new Animated.Value(0))
  );
  const slotShakeX = useRef(
    Array.from({ length: MAX_PAIRS }, () => new Animated.Value(0))
  );

  const pans = useRef(topImages.map(() => new Animated.ValueXY())).current;

  const onTrialFullyCompleteRef = useRef(onTrialFullyComplete);
  onTrialFullyCompleteRef.current = onTrialFullyComplete;

  useEffect(() => {
    if (placedPoolIndices.length !== n || n === 0) return;
    const t = setTimeout(() => {
      onTrialFullyCompleteRef.current();
    }, TRIAL_ADVANCE_DELAY_MS);
    return () => clearTimeout(t);
  }, [placedPoolIndices.length, n]);

  const initPositions = useCallback(() => {
    const count = topImages.length;
    const maxX = Math.max(0, topZoneWidth - itemSize);
    const maxY = Math.max(0, topZoneHeight - itemSize);
    const positions: { x: number; y: number }[] = [];
    const maxTries = 50;

    for (let i = 0; i < count; i++) {
      let placed = false;
      for (let t = 0; t < maxTries && !placed; t++) {
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;
        const overlaps = positions.some((p) =>
          rectsOverlap(x, y, itemSize, p.x, p.y, itemSize)
        );
        if (!overlaps) {
          positions.push({ x, y });
          placed = true;
        }
      }
      if (!placed) {
        const fallbackX = (i % 4) * (itemSize + 8);
        const fallbackY = Math.floor(i / 4) * (itemSize + 8);
        positions.push({
          x: Math.min(fallbackX, maxX),
          y: Math.min(fallbackY, maxY),
        });
      }
    }
    setCubePositions(positions);
  }, [topImages.length, topZoneWidth, topZoneHeight, itemSize]);

  useEffect(() => {
    const t = setTimeout(initPositions, 100);
    return () => clearTimeout(t);
  }, [initPositions]);

  const animateReturn = useCallback(
    (index: number) => {
      Animated.parallel([
        Animated.timing(pans[index].x, {
          toValue: 0,
          duration: RETURN_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(pans[index].y, {
          toValue: 0,
          duration: RETURN_DURATION,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [pans]
  );

  const runIncorrectFeedback = useCallback(
    (poolIndex: number, slotIndex: number) => {
      onIncorrectAttempt();
      const border = slotBorderAnims.current[slotIndex];
      const shake = slotShakeX.current[slotIndex];
      border.setValue(2);
      void playAudio("mai_incearca");
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shake, {
            toValue: 10,
            duration: SHAKE_DURATION / 4,
            useNativeDriver: false,
          }),
          Animated.timing(shake, {
            toValue: -10,
            duration: SHAKE_DURATION / 4,
            useNativeDriver: false,
          }),
          Animated.timing(shake, {
            toValue: 8,
            duration: SHAKE_DURATION / 4,
            useNativeDriver: false,
          }),
          Animated.timing(shake, {
            toValue: 0,
            duration: SHAKE_DURATION / 4,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pans[poolIndex].x, {
            toValue: 0,
            duration: RETURN_DURATION,
            useNativeDriver: false,
          }),
          Animated.timing(pans[poolIndex].y, {
            toValue: 0,
            duration: RETURN_DURATION,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        border.setValue(0);
        setInteractionLocked(false);
        feedbackBusyRef.current = false;
      });
    },
    [pans, onIncorrectAttempt]
  );

  const handleRelease = useCallback(
    (poolIndex: number, item: LogicalTrialImage) =>
      (_: unknown, gestureState: { dx: number; dy: number }) => {
        setActiveDragIndex(null);
        const dx = gestureState.dx;
        const dy = gestureState.dy;

        const resolveDrop = (slotIndex: number) => {
          const layout = dropLayouts.current[slotIndex];
          if (!layout) return;
          const cx = layout.x + layout.w / 2;
          const cy = layout.y + layout.h / 2;
          const pos = cubePositions[poolIndex];
          if (!pos) return;
          const pool = poolLayout.current;
          const cubeScreenX = pool.x + pos.x + itemSize / 2 + dx;
          const cubeScreenY = pool.y + pos.y + itemSize / 2 + dy;
          const dist = Math.hypot(cx - cubeScreenX, cy - cubeScreenY);
          return { slotIndex, dist };
        };

        const slots = slotContentsRef.current;
        let best: { slotIndex: number; dist: number } | null = null;
        for (let s = 0; s < n; s++) {
          if (slots[s] !== null) continue;
          const r = resolveDrop(s);
          if (r && (!best || r.dist < best.dist)) best = r;
        }

        const threshold = itemSize * DROP_DISTANCE_MULT;
        if (!best || best.dist > threshold) {
          animateReturn(poolIndex);
          return;
        }

        const slotIndex = best.slotIndex;
        const layout = dropLayouts.current[slotIndex];
        if (!layout) {
          animateReturn(poolIndex);
          return;
        }

        if (interactionLocked || feedbackBusyRef.current) {
          animateReturn(poolIndex);
          return;
        }

        const targetPairId = bottomTargets[slotIndex]?.pairId;
        const isCorrect = item.pairId === targetPairId;

        if (!isCorrect) {
          feedbackBusyRef.current = true;
          setInteractionLocked(true);
          runIncorrectFeedback(poolIndex, slotIndex);
          return;
        }

        const pool = poolLayout.current;
        const originX = cubePositions[poolIndex]?.x ?? 0;
        const originY = cubePositions[poolIndex]?.y ?? 0;
        const toX = layout.x - pool.x - originX;
        const toY = layout.y - pool.y - originY;

        feedbackBusyRef.current = true;
        setInteractionLocked(true);

        Animated.parallel([
          Animated.timing(pans[poolIndex].x, {
            toValue: toX,
            duration: SNAP_DURATION,
            useNativeDriver: false,
          }),
          Animated.timing(pans[poolIndex].y, {
            toValue: toY,
            duration: SNAP_DURATION,
            useNativeDriver: false,
          }),
        ]).start(() => {
          onCorrectPlacement();
          setSlotContents((prev) => {
            const next = [...prev];
            next[slotIndex] = item;
            return next;
          });
          setPlacedPoolIndices((prev) =>
            prev.includes(poolIndex) ? prev : [...prev, poolIndex]
          );
          slotBorderAnims.current[slotIndex].setValue(1);
          void playAudio("bravo");
          if (correctFeedbackTimeoutRef.current != null) {
            clearTimeout(correctFeedbackTimeoutRef.current);
          }
          correctFeedbackTimeoutRef.current = setTimeout(() => {
            correctFeedbackTimeoutRef.current = null;
            setInteractionLocked(false);
            feedbackBusyRef.current = false;
          }, FEEDBACK_LOCK_CORRECT_MS);
        });
      },
    [
      n,
      itemSize,
      cubePositions,
      pans,
      animateReturn,
      bottomTargets,
      interactionLocked,
      runIncorrectFeedback,
      onCorrectPlacement,
    ]
  );

  const panResponders = useMemo(
    () =>
      topImages.map((item, i) => {
        const used = placedPoolIndices.includes(i);
        const canDrag =
          trialPromptReady && !used && activeDragIndex === null && !interactionLocked;
        return PanResponder.create({
          onStartShouldSetPanResponder: () => canDrag,
          onMoveShouldSetPanResponder: () => activeDragIndex === i,
          onPanResponderGrant: () => setActiveDragIndex(i),
          onPanResponderMove: (_, g) => {
            pans[i].setValue({ x: g.dx, y: g.dy });
          },
          onPanResponderRelease: handleRelease(i, item),
        });
      }),
    [topImages, placedPoolIndices, activeDragIndex, interactionLocked, trialPromptReady, handleRelease, pans]
  );

  const gap = Math.max(8, rs(12));
  const bottomRowWidth = n * itemSize + Math.max(0, n - 1) * gap;

  if (n === 0) {
    return (
      <View style={styles.root}>
        <Text style={styles.emptyText}>Nicio pereche disponibilă.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {progressLabel ? (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{progressLabel}</Text>
        </View>
      ) : null}

      <View
        style={styles.topZone}
        ref={poolRef}
        onLayout={() => {
          poolRef.current?.measureInWindow((x, y) => {
            poolLayout.current = { x, y };
          });
        }}
      >
        {topImages.map((item, i) => {
          if (placedPoolIndices.includes(i)) return null;
          const pos = cubePositions[i] ?? { x: 0, y: 0 };
          const dragging = activeDragIndex === i;
          return (
            <Animated.View
              key={item.id}
              {...panResponders[i].panHandlers}
              style={[
                styles.draggableWrap,
                {
                  left: pos.x,
                  top: pos.y,
                  width: itemSize,
                  height: itemSize,
                  zIndex: dragging ? 20 : 10,
                  elevation: dragging ? 18 : 6,
                  transform: [{ translateX: pans[i].x }, { translateY: pans[i].y }],
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: dragging ? 6 : 2 },
                  shadowOpacity: dragging ? 0.28 : 0.12,
                  shadowRadius: dragging ? 12 : 4,
                },
              ]}
            >
              <View
                style={{
                  transform: [{ scale: dragging ? 1.06 : 1 }],
                  width: itemSize,
                  height: itemSize,
                }}
              >
                <View
                  style={[
                    styles.cardOuter,
                    styles.draggableCard,
                    {
                      width: itemSize,
                      height: itemSize,
                      borderRadius: ITEM_RADIUS,
                      backgroundColor: Theme.colors.card,
                      padding: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <LogicalImageView
                    image={item.image}
                    containerSize={itemSize - 4}
                    borderRadius={Math.max(6, ITEM_RADIUS - 4)}
                  />
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <LinearGradient
        colors={[
          "rgba(44,100,104,0)",
          "rgba(44,100,104,0.9)",
          "rgba(44,100,104,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.horizontalDivider}
      />

      <View style={styles.bottomZone}>
        <View style={[styles.bottomInner, { maxWidth: screenWidth * 0.95 }]}>
          <View style={[styles.dropRow, { width: bottomRowWidth, gap }]}>
            {bottomTargets.map((item, slotIndex) => (
              <AnimatedDropSlot
                key={`drop-${item.id}`}
                itemSize={itemSize}
                slotRef={(el) => {
                  dropSlotRefs.current[slotIndex] = el;
                }}
                onMeasureLayout={() => {
                  dropSlotRefs.current[slotIndex]?.measureInWindow((x, y, w, h) => {
                    dropLayouts.current[slotIndex] = { x, y, w, h };
                  });
                }}
                shakeAnim={slotShakeX.current[slotIndex]}
                borderAnim={slotBorderAnims.current[slotIndex]}
              >
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      borderRadius: ITEM_RADIUS,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "rgba(148, 163, 184, 0.7)",
                      backgroundColor: Theme.colors.activeBg,
                    },
                  ]}
                />
                {slotContents[slotIndex] ? (
                  <View style={styles.dropFilled}>
                    <LogicalImageView
                      image={slotContents[slotIndex]!.image}
                      containerSize={itemSize}
                      borderRadius={Math.max(6, ITEM_RADIUS - 4)}
                    />
                  </View>
                ) : null}
              </AnimatedDropSlot>
            ))}
          </View>

          <View style={[styles.targetsRow, { width: bottomRowWidth, gap, marginTop: gap }]}>
            {bottomTargets.map((item) => (
              <View key={item.id} style={styles.targetCell}>
                <ImageCard item={item} size={itemSize} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  progressContainer: {
    position: "absolute",
    top: 20,
    left: 24,
    zIndex: 10,
  },
  progressText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  topZone: {
    flex: 0.6,
    position: "relative",
  },
  bottomZone: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  bottomInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  targetsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dropRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  targetCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  dropCell: {
    width: "auto",
    height: "auto",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dropFilled: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  completedRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Theme.colors.textPrimary,
    marginBottom: 12,
    fontFamily: Theme.fontFamily.semiBold,
  },
  completedScore: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
    marginBottom: 8,
  },
  completedSubScore: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.regular,
    textAlign: "center",
  },
  horizontalDivider: {
    height: 2,
    width: "100%",
  },
  draggableWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  draggableCard: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cardOuter: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardInnerClip: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 48,
    color: Theme.colors.textSecondary,
    fontSize: 16,
  },
});
