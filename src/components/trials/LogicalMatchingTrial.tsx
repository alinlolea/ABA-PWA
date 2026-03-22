/**
 * Logical Image Matching – "Asociere logică imagini"
 * UI + drag-and-drop; pair data and selection come from logicalMatchingEngine.
 * Layout mirrors PatternReproductionTrial: top pool, gradient divider, bottom targets + drop zones.
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
import { LinearGradient } from "expo-linear-gradient";
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
import { useResponsive } from "@/utils/responsive";

const ITEM_RADIUS = 16;
const SNAP_DURATION = 200;
const RETURN_DURATION = 200;
const DROP_DISTANCE_MULT = 1.25;
const MAX_PAIRS = 5;
/** Match PatternReproductionTrial feedback timing */
const SHAKE_DURATION = 300;
const BORDER_SUCCESS = "#2ecc71";
const BORDER_ERROR = "#e74c3c";
const FEEDBACK_LOCK_CORRECT_MS = 450;

function LogicalImageView({
  image,
  size,
  borderRadius,
}: {
  image: LogicalTrialImage["image"];
  size: number;
  borderRadius: number;
}) {
  return (
    <Image
      source={image}
      resizeMode="contain"
      style={{
        width: size,
        height: size,
        borderRadius,
      }}
      accessibilityIgnoresInvertColors
    />
  );
}

function ImageCard({ item, size }: { item: LogicalTrialImage; size: number }) {
  const innerPad = Math.max(4, size * 0.06);
  const innerSize = size - innerPad * 2;
  const innerRadius = Math.max(8, ITEM_RADIUS - 4);

  return (
    <View
      style={[
        styles.cardOuter,
        {
          width: size,
          height: size,
          borderRadius: ITEM_RADIUS,
          backgroundColor: Theme.colors.card,
        },
      ]}
    >
      <View
        style={[
          styles.cardInnerClip,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerRadius,
            margin: innerPad,
          },
        ]}
      >
        <LogicalImageView image={item.image} size={innerSize} borderRadius={innerRadius} />
      </View>
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
  /** Optional progress text (e.g. "1 / 10"). */
  progressLabel?: string;
  /**
   * Increment when a trial round ends to append `selectedPairIds` to the session “used” pool
   * and draw the next trial (no UI change — parent/session drives this).
   */
  completionSignal?: number;
};

export default function LogicalMatchingTrial({
  pairCount,
  progressLabel,
  completionSignal = 0,
}: LogicalMatchingTrialProps) {
  const { width: screenWidth, height: screenHeight, rs } = useResponsive();
  const topZoneHeight = screenHeight * 0.6;

  const n = Math.min(MAX_PAIRS, Math.max(1, Math.floor(pairCount)));

  const [completedPairIds, setCompletedPairIds] = useState<string[]>([]);

  const effectiveCompleted = useMemo(
    () => effectiveCompletedPairSet(completedPairIds, n),
    [completedPairIds, n]
  );

  const trial = useMemo(
    () => generateLogicalMatchingTrial(n, effectiveCompleted),
    [n, effectiveCompleted]
  );

  useEffect(() => {
    if (shouldClearPersistedCompletedPairIds(completedPairIds, n)) {
      setCompletedPairIds([]);
    }
  }, [completedPairIds, n]);

  const lastTrialSelectedRef = useRef<string[]>(trial.selectedPairIds);
  lastTrialSelectedRef.current = trial.selectedPairIds;
  const prevCompletionRef = useRef(completionSignal);

  useEffect(() => {
    if (completionSignal > prevCompletionRef.current) {
      setCompletedPairIds((c) => [...new Set([...c, ...lastTrialSelectedRef.current])]);
    }
    prevCompletionRef.current = completionSignal;
  }, [completionSignal]);

  const totalItems = Math.max(1, trial.topImages.length || 1);
  const availableWidth = screenWidth * 0.9;
  const sizeFromWidth = availableWidth / Math.max(totalItems, 3);
  const maxItemSize = rs(100);
  const itemSize = Math.min(maxItemSize, sizeFromWidth, topZoneHeight * 0.28);

  const innerKey = `${completedPairIds.join(",")}|${trial.selectedPairIds.slice().sort().join(",")}`;

  return (
    <LogicalMatchingTrialInner
      key={innerKey}
      trial={trial}
      screenWidth={screenWidth}
      topZoneHeight={topZoneHeight}
      itemSize={itemSize}
      progressLabel={progressLabel}
    />
  );
}

type InnerProps = {
  trial: LogicalTrialGenerationResult;
  screenWidth: number;
  topZoneHeight: number;
  itemSize: number;
  progressLabel?: string;
};

function LogicalMatchingTrialInner({
  trial,
  screenWidth,
  topZoneHeight,
  itemSize,
  progressLabel,
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

  const slotBorderAnims = useRef(
    Array.from({ length: MAX_PAIRS }, () => new Animated.Value(0))
  );
  const slotShakeX = useRef(
    Array.from({ length: MAX_PAIRS }, () => new Animated.Value(0))
  );

  const pans = useRef(topImages.map(() => new Animated.ValueXY())).current;

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
    [pans]
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
    ]
  );

  const panResponders = useMemo(
    () =>
      topImages.map((item, i) => {
        const used = placedPoolIndices.includes(i);
        const canDrag = !used && activeDragIndex === null && !interactionLocked;
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
    [topImages, placedPoolIndices, activeDragIndex, interactionLocked, handleRelease, pans]
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
                      padding: Math.max(4, itemSize * 0.06),
                    },
                  ]}
                >
                  <LogicalImageView
                    image={item.image}
                    size={itemSize - Math.max(8, itemSize * 0.12) * 2}
                    borderRadius={Math.max(8, ITEM_RADIUS - 4)}
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
          <View style={[styles.targetsRow, { width: bottomRowWidth, gap }]}>
            {bottomTargets.map((item) => (
              <View key={item.id} style={styles.targetCell}>
                <ImageCard item={item} size={itemSize} />
              </View>
            ))}
          </View>

          <View style={[styles.dropRow, { width: bottomRowWidth, gap, marginTop: gap }]}>
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
                      size={itemSize - Math.max(8, itemSize * 0.12) * 2}
                      borderRadius={Math.max(8, ITEM_RADIUS - 4)}
                    />
                  </View>
                ) : null}
              </AnimatedDropSlot>
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
    padding: 4,
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
