import ScreenContainer from "@/components/layout/ScreenContainer";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import { generateTrials } from "@/features/b1-2d-matching/logic/generateTrials";
import { MOCK_STIMULI } from "@/features/b1-2d-matching/mockStimuli";
import type { B1Config, SessionState, Stimulus, Trial } from "@/features/b1-2d-matching/types";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

const TRIAL_COUNT = 10;
const CORRECT_FEEDBACK_MS = 600;
const SHAKE_DURATION_MS = 300;
const SNAP_ANIM_DURATION = 200;
const MAX_TOP_TARGETS = 3;
const MAX_BOTTOM_OPTIONS = 6;
const DEFAULT_DISTRACTOR_COUNT = 0;
const MIN_ITEM_SIZE = 70;
const MAX_ITEM_SIZE = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function StimulusPlaceholder({
  stimulus,
  size,
  borderWidth,
  borderColor,
}: {
  stimulus: Stimulus;
  size: number;
  borderWidth?: number;
  borderColor?: string;
}) {
  const color = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
  return (
    <View
      style={[
        styles.stimulusBox,
        { width: size, height: size, backgroundColor: color },
        borderWidth !== undefined && { borderWidth, borderColor },
      ]}
    />
  );
}

function OptionSlot({
  stimulus,
  isHighlighted,
  optionRef,
  itemSize,
}: {
  stimulus: Stimulus;
  isHighlighted: boolean;
  optionRef: (el: View | null) => void;
  itemSize: number;
}) {
  const color = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
  const borderColor = isHighlighted ? Colors.correct : Colors.divider;
  const borderWidth = isHighlighted ? 4 : 1;

  return (
    <View
      ref={optionRef}
      collapsable={false}
      style={[styles.optionSlot, { width: itemSize, height: itemSize }]}
    >
      <View
        style={[
          styles.optionInner,
          {
            width: itemSize,
            height: itemSize,
            backgroundColor: color,
            borderWidth,
            borderColor,
          },
        ]}
      />
    </View>
  );
}

type TrialParams = { category?: string; targets?: string; distractorCount?: string };

function buildB1Config(params: TrialParams): B1Config {
  const category = (params.category === "shapes" || params.category === "objects"
    ? params.category
    : "colors") as B1Config["category"];
  const targetIds: string[] = (() => {
    try {
      const raw = params.targets ?? "[]";
      return typeof raw === "string" ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  })();
  const targets = targetIds
    .map((id) => MOCK_STIMULI.find((s) => s.id === id))
    .filter((s): s is Stimulus => s != null);
  const distractorCount = Number(params.distractorCount ?? DEFAULT_DISTRACTOR_COUNT);
  const resolvedDistractorCount = Number.isNaN(distractorCount) || distractorCount < 0
    ? DEFAULT_DISTRACTOR_COUNT
    : distractorCount;
  return {
    category,
    targets: targets.length > 0 ? targets : MOCK_STIMULI.slice(0, MAX_TOP_TARGETS),
    distractorCount: resolvedDistractorCount,
    pool: MOCK_STIMULI,
  };
}

export default function TrialScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<TrialParams>();
  const configRef = useRef<B1Config | null>(null);
  if (configRef.current === null) {
    configRef.current = buildB1Config(params);
  }
  const config = configRef.current;

  const [session, setSession] = useState<SessionState>(() => ({
    trials: [] as Trial[],
    currentTrialIndex: 0,
    score: 0,
    completed: false,
  }));

  const trialsInitializedRef = useRef(false);
  useEffect(() => {
    if (!config || trialsInitializedRef.current) return;
    trialsInitializedRef.current = true;
    setSession((prev) => ({
      ...prev,
      trials: generateTrials(config),
    }));
  }, [config]);

  const [matchedTargetIds, setMatchedTargetIds] = useState<Set<string>>(new Set());
  const [matchedOptionIndices, setMatchedOptionIndices] = useState<Set<number>>(new Set());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDragIdRef = useRef<string | null>(null);
  const matchedTargetIdsRef = useRef<Set<string>>(new Set());
  activeDragIdRef.current = activeDragId;
  matchedTargetIdsRef.current = matchedTargetIds;

  const pans = useRef(
    Array.from({ length: MAX_TOP_TARGETS }, () => new Animated.ValueXY())
  ).current;
  const shakes = useRef(
    Array.from({ length: MAX_TOP_TARGETS }, () => new Animated.Value(0))
  ).current;
  const targetRefs = useRef<(View | null)[]>([null, null, null]);
  const optionRefs = useRef<(View | null)[]>(
    Array.from({ length: MAX_BOTTOM_OPTIONS }, () => null)
  );

  const trials = session.trials ?? [];
  const currentTrial = session.completed
    ? null
    : (trials[session.currentTrialIndex] ?? null);

  const currentTrialRef = useRef<Trial | null>(null);
  currentTrialRef.current = currentTrial;

  const topTargets = currentTrial?.topTargets ?? [];
  const bottomOptions = currentTrial?.bottomOptions ?? [];
  const bottomCount = bottomOptions.length > 0 ? bottomOptions.length : 1;
  const usableWidth = screenWidth * 0.9;
  const gap = usableWidth * 0.02;
  const itemSize = clamp(
    (usableWidth - gap * (bottomCount - 1)) / bottomCount,
    MIN_ITEM_SIZE,
    MAX_ITEM_SIZE
  );
  const snapRadius = itemSize * 0.6;
  const optionGap = bottomCount > 1 ? (usableWidth - itemSize * bottomCount) / (bottomCount - 1) : 0;
  const topCount = topTargets.length;
  const topGap = topCount > 1 ? (usableWidth - itemSize * topCount) / (topCount - 1) : 0;

  const snapRadiusRef = useRef(snapRadius);
  snapRadiusRef.current = snapRadius;

  const allMatched =
    currentTrial &&
    topTargets.length > 0 &&
    matchedTargetIds.size === topTargets.length;

  const advanceToNext = useCallback(() => {
    pans.forEach((p) => p.setValue({ x: 0, y: 0 }));
    shakes.forEach((s) => s.setValue(0));
    setMatchedTargetIds(new Set());
    setMatchedOptionIndices(new Set());
    setActiveDragId(null);
    setSession((prev) => {
      if (prev.currentTrialIndex >= TRIAL_COUNT - 1) {
        return {
          ...prev,
          currentTrialIndex: prev.currentTrialIndex,
          score: prev.score + 1,
          completed: true,
        };
      }
      return {
        ...prev,
        currentTrialIndex: prev.currentTrialIndex + 1,
        score: prev.score + 1,
      };
    });
  }, [pans, shakes]);

  useEffect(() => {
    if (!allMatched) return;
    advanceTimeoutRef.current = setTimeout(() => {
      advanceToNext();
    }, CORRECT_FEEDBACK_MS);
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, [allMatched, advanceToNext]);

  const animateBackToOrigin = useCallback(
    (index: number) => {
      Animated.parallel([
        Animated.timing(pans[index].x, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(pans[index].y, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [pans]
  );

  const runShakeThenBack = useCallback(
    (index: number) => {
      shakes[index].setValue(0);
      Animated.sequence([
        Animated.timing(shakes[index], {
          toValue: 10,
          duration: SHAKE_DURATION_MS / 4,
          useNativeDriver: false,
        }),
        Animated.timing(shakes[index], {
          toValue: -10,
          duration: SHAKE_DURATION_MS / 4,
          useNativeDriver: false,
        }),
        Animated.timing(shakes[index], {
          toValue: 8,
          duration: SHAKE_DURATION_MS / 4,
          useNativeDriver: false,
        }),
        Animated.timing(shakes[index], {
          toValue: 0,
          duration: SHAKE_DURATION_MS / 4,
          useNativeDriver: false,
        }),
      ]).start(() => animateBackToOrigin(index));
    },
    [shakes, pans]
  );

  const animateSnapTo = useCallback(
    (index: number, toX: number, toY: number, onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(pans[index].x, {
          toValue: toX,
          duration: SNAP_ANIM_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(pans[index].y, {
          toValue: toY,
          duration: SNAP_ANIM_DURATION,
          useNativeDriver: false,
        }),
      ]).start(onDone);
    },
    [pans]
  );

  const createHandleRelease = useCallback(
    (targetIndex: number, targetId: string) =>
      (_: unknown, gestureState: { dx: number; dy: number }) => {
        setActiveDragId(null);
        const trial = currentTrialRef.current;
        if (!trial || !trial.topTargets?.length || !trial.bottomOptions?.length) {
          animateBackToOrigin(targetIndex);
          return;
        }

        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const radius = snapRadiusRef.current;

        const targetNode = targetRefs.current[targetIndex] as (View & {
          measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void;
        }) | null;
        if (!targetNode?.measureInWindow) {
          animateBackToOrigin(targetIndex);
          return;
        }

        targetNode.measureInWindow((tx, ty, tw, th) => {
          const targetCenterX = tx + tw / 2;
          const targetCenterY = ty + th / 2;

          let resolved = 0;
          const bounds: Array<{ x: number; y: number; w: number; h: number }> = [];

          const tryResolve = () => {
            resolved++;
            if (resolved < trial.bottomOptions.length) return;

            const optionCenters = bounds.map((b) => ({
              x: b.x + b.w / 2,
              y: b.y + b.h / 2,
            }));

            let bestIndex = -1;
            let bestDist = Infinity;
            for (let j = 0; j < trial.bottomOptions.length; j++) {
              const d = distance(
                targetCenterX,
                targetCenterY,
                optionCenters[j].x,
                optionCenters[j].y
              );
              if (d < bestDist) {
                bestDist = d;
                bestIndex = j;
              }
            }

            if (bestIndex === -1 || bestDist >= radius) {
              animateBackToOrigin(targetIndex);
              return;
            }

            const ocx = optionCenters[bestIndex].x;
            const ocy = optionCenters[bestIndex].y;
            const snapPanX = dx + (ocx - targetCenterX);
            const snapPanY = dy + (ocy - targetCenterY);

            const targetStimulus = trial.topTargets[targetIndex];
            const optionStimulus = trial.bottomOptions[bestIndex];
            const isCorrect = targetStimulus?.id === optionStimulus?.id;

            animateSnapTo(targetIndex, snapPanX, snapPanY, () => {
              if (isCorrect) {
                setMatchedTargetIds((prev) => new Set(prev).add(targetId));
                setMatchedOptionIndices((prev) => new Set(prev).add(bestIndex));
              } else {
                runShakeThenBack(targetIndex);
              }
            });
          };

          for (let i = 0; i < trial.bottomOptions.length; i++) {
            const ref = optionRefs.current[i];
            const done = (ox: number, oy: number, ow: number, oh: number) => {
              bounds[i] = { x: ox, y: oy, w: ow, h: oh };
              tryResolve();
            };
            if (
              ref &&
              typeof (ref as View & { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void })
                .measureInWindow === "function"
            ) {
              (
                ref as View & {
                  measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void;
                }
              ).measureInWindow(done);
            } else {
              done(0, 0, 0, 0);
            }
          }
        });
      },
    [
      animateBackToOrigin,
      animateSnapTo,
      runShakeThenBack,
    ]
  );

  const createHandleMove = useCallback(
    (index: number) => (_: unknown, gestureState: { dx: number; dy: number }) => {
      pans[index].x.setValue(gestureState.dx);
      pans[index].y.setValue(gestureState.dy);
    },
    [pans]
  );

  const createHandleMoveFor = useCallback(
    (index: number) => (_: unknown, gestureState: { dx: number; dy: number }) => {
      pans[index].x.setValue(gestureState.dx);
      pans[index].y.setValue(gestureState.dy);
    },
    [pans]
  );

  const createPanResponder = useCallback(
    (targetIndex: number, targetId: string) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          if (activeDragIdRef.current !== null) return false;
          if (matchedTargetIdsRef.current.has(targetId)) return false;
          setActiveDragId(targetId);
          return true;
        },
        onMoveShouldSetPanResponder: () => activeDragIdRef.current === targetId,
        onPanResponderMove: createHandleMoveFor(targetIndex),
        onPanResponderRelease: createHandleRelease(targetIndex, targetId),
      }),
    [createHandleRelease, createHandleMoveFor]
  );

  if (session.completed) {
    return (
      <ScreenContainer>
        <View style={styles.completedRoot}>
          <Text style={styles.completedTitle}>Sesiune finalizată</Text>
          <Text style={styles.completedScore}>
            Scor: {session.score} / {TRIAL_COUNT}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!currentTrial) {
    return null;
  }

  const progressText = `${session.currentTrialIndex + 1} / ${TRIAL_COUNT}`;

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>

        <View style={styles.topArea}>
          <View style={[styles.targetsRow, { gap: topGap }]}>
            {topTargets.map((target, index) => {
              const isMatched = matchedTargetIds.has(target.id);
              const panResponder = createPanResponder(index, target.id);
              return (
                <Animated.View
                  key={target.id}
                  ref={(el) => {
                    targetRefs.current[index] = el;
                  }}
                  {...(isMatched ? {} : panResponder.panHandlers)}
                  style={[
                    styles.targetWrap,
                    { width: itemSize, height: itemSize },
                    {
                      transform: [
                        {
                          translateX: Animated.add(
                            pans[index].x,
                            shakes[index]
                          ),
                        },
                        { translateY: pans[index].y },
                      ],
                    },
                  ]}
                >
                  <StimulusPlaceholder
                    stimulus={target}
                    size={itemSize}
                  />
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.bottomArea}>
          <View style={[styles.optionsRow, { gap: optionGap, maxWidth: usableWidth }]}>
            {bottomOptions.map((option, index) => (
              <OptionSlot
                key={`${option.id}-${index}`}
                stimulus={option}
                isHighlighted={matchedOptionIndices.has(index)}
                optionRef={(el) => {
                  optionRefs.current[index] = el;
                }}
                itemSize={itemSize}
              />
            ))}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  progressText: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
  topArea: {
    height: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  targetsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  targetWrap: {},
  bottomArea: {
    flex: 1,
    minHeight: "60%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  optionSlot: {
    justifyContent: "center",
    alignItems: "center",
  },
  optionInner: {
    borderRadius: 12,
  },
  stimulusBox: {
    borderRadius: 16,
  },
  completedRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  completedTitle: {
    fontSize: Typography.title,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  completedScore: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
});
