import ScreenContainer from "@/components/layout/ScreenContainer";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import { generateTrials } from "@/features/b1-2d-matching/logic/generateTrials";
import { STIMULI_BY_CATEGORY, type CategoryKey } from "@/features/b1-2d-matching/stimuliByCategory";
import type { B1Config, SessionState, Stimulus, Trial } from "@/features/b1-2d-matching/types";
import { auth, db } from "@/services/firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Tts from "react-native-tts";
import Svg, { Circle, Ellipse, Polygon, Rect } from "react-native-svg";

const TRIAL_COUNT = 10;
const CORRECT_FEEDBACK_MS = 600;
const SHAKE_DURATION_MS = 300;
const SNAP_ANIM_DURATION = 200;
const MAX_TOP_TARGETS = 3;
const MAX_BOTTOM_OPTIONS = 6;
const DEFAULT_DISTRACTOR_COUNT = 0;
const MIN_ITEM_SIZE = 70;
const MAX_ITEM_SIZE = 120;
const OPTION_BORDER_DEFAULT = "#444";
const OPTION_BORDER_SUCCESS = "#2ecc71";
const OPTION_BORDER_ERROR = "#e74c3c";
const BORDER_WIDTH = 2;
const ITEM_RADIUS_RATIO = 0.12;

const VALID_CATEGORIES: CategoryKey[] = [
  "colors",
  "shapes",
  "fruits",
  "vegetables",
  "animals",
  "vehicles",
  "food",
  "objects",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

function isShapeStimulus(image: unknown): image is { type: "shape"; form: string; fill: string } {
  return (
    typeof image === "object" &&
    image !== null &&
    "type" in image &&
    (image as { type: string }).type === "shape"
  );
}

function isSvgStimulus(
  image: unknown
): image is { type: "svg"; icon: React.ComponentType<{ width?: number; height?: number; color?: string }> } {
  return (
    typeof image === "object" &&
    image !== null &&
    "type" in image &&
    "icon" in image &&
    (image as { type: string }).type === "svg"
  );
}

function isPlaceholderStimulus(image: unknown): image is { type: "placeholder" } {
  return (
    typeof image === "object" &&
    image !== null &&
    "type" in image &&
    (image as { type: string }).type === "placeholder"
  );
}

function TrialShapeSvg({
  form,
  size,
  fill,
}: {
  form: string;
  size: number;
  fill: string;
}) {
  const s = size;
  const h = size / 2;
  const viewBox = `0 0 ${s} ${s}`;

  if (form === "circle") {
    return (
      <Svg width={s} height={s} viewBox={viewBox}>
        <Circle cx={h} cy={h} r={h} fill={fill} />
      </Svg>
    );
  }
  if (form === "square") {
    return (
      <Svg width={s} height={s} viewBox={viewBox}>
        <Rect width={s} height={s} fill={fill} />
      </Svg>
    );
  }
  if (form === "triangle") {
    return (
      <Svg width={s} height={s} viewBox={viewBox}>
        <Polygon points={`${h},0 ${s},${s} 0,${s}`} fill={fill} />
      </Svg>
    );
  }
  if (form === "rectangle") {
    const rectHeight = s * 0.6;
    const y = (s - rectHeight) / 2;
    return (
      <Svg width={s} height={s} viewBox={viewBox}>
        <Rect x={0} y={y} width={s} height={rectHeight} fill={fill} />
      </Svg>
    );
  }
  if (form === "oval") {
    const ry = (s * 0.6) / 2;
    return (
      <Svg width={s} height={s} viewBox={viewBox}>
        <Ellipse cx={h} cy={h} rx={h} ry={ry} fill={fill} />
      </Svg>
    );
  }
  if (form === "diamond") {
    return (
      <Svg width={s} height={s} viewBox={viewBox}>
        <Polygon points={`${h},0 ${s},${h} ${h},${s} 0,${h}`} fill={fill} />
      </Svg>
    );
  }
  if (form === "star") {
    const starPoints = `${h},0 ${s * 0.62},${s * 0.38} ${s},${s * 0.38} ${s * 0.69},${s * 0.62} ${s * 0.81},${s} ${h},${s * 0.75} ${s * 0.19},${s} ${s * 0.31},${s * 0.62} 0,${s * 0.38} ${s * 0.38},${s * 0.38}`;
    return (
      <Svg width={s} height={s} viewBox={viewBox}>
        <Polygon points={starPoints} fill={fill} />
      </Svg>
    );
  }
  return (
    <Svg width={s} height={s} viewBox={viewBox}>
      <Rect width={s} height={s} fill={fill} />
    </Svg>
  );
}

const TARGET_BORDER_DEFAULT = "#444";
const TARGET_BORDER_SUCCESS = "#2ecc71";
const TARGET_BORDER_ERROR = "#e74c3c";

function StimulusPlaceholder({
  stimulus,
  size,
  itemRadius,
  borderColorAnim,
}: {
  stimulus: Stimulus;
  size: number;
  itemRadius: number;
  borderColorAnim: Animated.Value;
}) {
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [TARGET_BORDER_DEFAULT, TARGET_BORDER_SUCCESS, TARGET_BORDER_ERROR],
  });
  const itemBoxStyle = [
    styles.itemBox,
    { width: size, height: size, borderRadius: itemRadius },
    { borderColor: animatedBorderColor },
  ];

  if (isShapeStimulus(stimulus.image)) {
    return (
      <Animated.View style={itemBoxStyle}>
        <TrialShapeSvg form={stimulus.image.form} size={size} fill={stimulus.image.fill} />
      </Animated.View>
    );
  }
  if (isSvgStimulus(stimulus.image)) {
    const Icon = stimulus.image.icon;
    return (
      <Animated.View style={itemBoxStyle}>
        <Icon width={size} height={size} color={Colors.textPrimary} />
      </Animated.View>
    );
  }
  if (isPlaceholderStimulus(stimulus.image)) {
    const firstLetter = stimulus.label ? [...stimulus.label][0] ?? "?" : "?";
    return (
      <Animated.View style={itemBoxStyle}>
        <View style={[styles.placeholderBox, { width: size, height: size, borderRadius: itemRadius, overflow: "hidden" }]}>
          <Text style={[styles.placeholderLetter, { fontSize: Math.max(14, size * 0.35) }]}>{firstLetter}</Text>
        </View>
      </Animated.View>
    );
  }
  const color = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
  return (
      <Animated.View style={itemBoxStyle}>
      <View style={{ width: size, height: size, backgroundColor: color, borderRadius: itemRadius, overflow: "hidden" }} />
    </Animated.View>
  );
}

function OptionSlot({
  stimulus,
  isHighlighted,
  optionRef,
  itemSize,
  itemRadius,
  borderColorAnim,
  defaultBorderColor,
}: {
  stimulus: Stimulus;
  isHighlighted: boolean;
  optionRef: (el: View | null) => void;
  itemSize: number;
  itemRadius: number;
  borderColorAnim: Animated.Value;
  defaultBorderColor: string;
}) {
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [defaultBorderColor, OPTION_BORDER_SUCCESS, OPTION_BORDER_ERROR],
  });
  const borderContainerStyle = {
    width: itemSize,
    height: itemSize,
    borderWidth: BORDER_WIDTH,
    borderRadius: itemRadius,
    borderColor: animatedBorderColor,
    overflow: "hidden" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  if (isShapeStimulus(stimulus.image)) {
    return (
      <View
        ref={optionRef}
        collapsable={false}
        style={[styles.optionSlot, { width: itemSize, height: itemSize }]}
      >
        <Animated.View style={borderContainerStyle}>
          <TrialShapeSvg
            form={stimulus.image.form}
            size={itemSize}
            fill={stimulus.image.fill}
          />
        </Animated.View>
      </View>
    );
  }
  if (isSvgStimulus(stimulus.image)) {
    const Icon = stimulus.image.icon;
    return (
      <View
        ref={optionRef}
        collapsable={false}
        style={[styles.optionSlot, { width: itemSize, height: itemSize }]}
      >
        <Animated.View style={borderContainerStyle}>
          <Icon width={itemSize} height={itemSize} color={Colors.textPrimary} />
        </Animated.View>
      </View>
    );
  }
  if (isPlaceholderStimulus(stimulus.image)) {
    const firstLetter = stimulus.label ? [...stimulus.label][0] ?? "?" : "?";
    return (
      <View
        ref={optionRef}
        collapsable={false}
        style={[styles.optionSlot, { width: itemSize, height: itemSize }]}
      >
        <Animated.View style={borderContainerStyle}>
          <View style={[styles.placeholderBox, { width: itemSize, height: itemSize, borderRadius: itemRadius, overflow: "hidden" }]}>
            <Text style={[styles.placeholderLetter, { fontSize: Math.max(14, itemSize * 0.35) }]}>{firstLetter}</Text>
          </View>
        </Animated.View>
      </View>
    );
  }
  const color = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
  return (
    <View
      ref={optionRef}
      collapsable={false}
      style={[styles.optionSlot, { width: itemSize, height: itemSize }]}
    >
      <Animated.View style={borderContainerStyle}>
        <View style={{ width: itemSize, height: itemSize, backgroundColor: color, borderRadius: itemRadius, overflow: "hidden" }} />
      </Animated.View>
    </View>
  );
}

type TrialParams = { category?: string; targets?: string; distractorCount?: string; childId?: string; sessionId?: string; voiceEnabled?: string };

function buildB1Config(params: TrialParams): B1Config {
  const category = (VALID_CATEGORIES.includes(params.category as CategoryKey)
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
  const pool = STIMULI_BY_CATEGORY[category] ?? [];
  const selectedTargets = targetIds
    .map((id) => pool.find((s) => s.id === id))
    .filter((s): s is Stimulus => s != null);
  const distractorCount = Number(params.distractorCount ?? DEFAULT_DISTRACTOR_COUNT);
  const resolvedDistractorCount = Number.isNaN(distractorCount) || distractorCount < 0
    ? DEFAULT_DISTRACTOR_COUNT
    : distractorCount;
  return {
    category,
    targets: selectedTargets,
    distractorCount: resolvedDistractorCount,
    pool,
  };
}

export default function TrialScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<TrialParams>();
  const sessionIdRaw = params.sessionId;
  const sessionId =
    typeof sessionIdRaw === "string"
      ? sessionIdRaw
      : Array.isArray(sessionIdRaw)
        ? sessionIdRaw[0]
        : undefined;
  if (!sessionId) {
    throw new Error("TrialScreen: sessionId is missing from route params.");
  }
  const voiceEnabledRaw = params.voiceEnabled;
  const voiceEnabled = (Array.isArray(voiceEnabledRaw) ? voiceEnabledRaw[0] : voiceEnabledRaw) !== "false";
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
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);

  useEffect(() => {
    Tts.setDefaultLanguage("ro-RO");
    Tts.setDefaultRate(0.5);
  }, []);

  const trialsInitializedRef = useRef(false);
  useEffect(() => {
    if (!config || trialsInitializedRef.current) return;
    trialsInitializedRef.current = true;
    setSession((prev) => ({
      ...prev,
      trials: generateTrials(config),
    }));
  }, [config]);

  useEffect(() => {
    if (!session.completed && session.trials.length > 0 && voiceEnabled) {
      Tts.stop();
      Tts.speak("Potrivește!", {
        pitch: 1.0,
        rate: 0.5,
      } as unknown as Parameters<typeof Tts.speak>[1]);
    }
  }, [session.currentTrialIndex, session.trials.length, voiceEnabled]);

  useEffect(() => {
    if (!session.completed) return;

    updateDoc(doc(db, "sessions", sessionId), {
      completedAt: serverTimestamp(),
      correctTrials: session.score,
      totalTrials: TRIAL_COUNT,
      correctAttempts: correctAttempts,
      totalAttempts: totalAttempts,
      accuracy:
        totalAttempts > 0
          ? correctAttempts / totalAttempts
          : 0,
    });
  }, [session.completed]);

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
  const optionBorderAnims = useRef(
    Array.from({ length: MAX_BOTTOM_OPTIONS }, () => new Animated.Value(0))
  ).current;
  const optionPulseAnims = useRef(
    Array.from({ length: MAX_BOTTOM_OPTIONS }, () => new Animated.Value(0))
  ).current;
  const targetBorderAnims = useRef(
    Array.from({ length: MAX_TOP_TARGETS }, () => new Animated.Value(0))
  ).current;

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
  const ITEM_SIZE = clamp(
    (usableWidth - gap * (bottomCount - 1)) / bottomCount,
    MIN_ITEM_SIZE,
    MAX_ITEM_SIZE
  );
  const ITEM_RADIUS = Math.round(ITEM_SIZE * ITEM_RADIUS_RATIO);
  const snapRadius = ITEM_SIZE * 0.6;
  const optionGap = bottomCount > 1 ? (usableWidth - ITEM_SIZE * bottomCount) / (bottomCount - 1) : 0;
  const topCount = topTargets.length;
  const topGap = topCount > 1 ? (usableWidth - ITEM_SIZE * topCount) / (topCount - 1) : 0;

  const snapRadiusRef = useRef(snapRadius);
  snapRadiusRef.current = snapRadius;

  const allMatched =
    currentTrial &&
    topTargets.length > 0 &&
    matchedTargetIds.size === topTargets.length;

  const runOptionBorderFeedback = useCallback(
    (index: number, isCorrect: boolean) => {
      optionBorderAnims[index].setValue(isCorrect ? 1 : 2);
      Animated.sequence([
        Animated.timing(optionPulseAnims[index], {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(optionPulseAnims[index], {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(optionPulseAnims[index], {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(optionPulseAnims[index], {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        optionBorderAnims[index].setValue(0);
      });
    },
    [optionBorderAnims, optionPulseAnims]
  );

  const advanceToNext = useCallback(() => {
    pans.forEach((p) => p.setValue({ x: 0, y: 0 }));
    shakes.forEach((s) => s.setValue(0));
    targetBorderAnims.forEach((a) => a.setValue(0));
    optionBorderAnims.forEach((a) => a.setValue(0));
    optionPulseAnims.forEach((a) => a.setValue(0));
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
  }, [pans, shakes, targetBorderAnims, optionBorderAnims, optionPulseAnims]);

  useEffect(() => {
    if (!allMatched) return;
    advanceTimeoutRef.current = setTimeout(() => {
      advanceToNext();
    }, 1500);
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
              setTotalAttempts((prev) => prev + 1);
              if (isCorrect) {
                runOptionBorderFeedback(bestIndex, true);
                if (voiceEnabled) {
                  Tts.stop();
                  Tts.speak("Bravo!", {
                    pitch: 1.4,
                    rate: 0.6,
                  } as unknown as Parameters<typeof Tts.speak>[1]);
                }
                setCorrectAttempts((prev) => prev + 1);
                setMatchedTargetIds((prev) => new Set(prev).add(targetId));
                setMatchedOptionIndices((prev) => new Set(prev).add(bestIndex));
              } else {
                runOptionBorderFeedback(bestIndex, false);
                if (voiceEnabled) {
                  Tts.stop();
                  Tts.speak("Mai încearcă!", {
                    pitch: 0.9,
                    rate: 0.48,
                  } as unknown as Parameters<typeof Tts.speak>[1]);
                }
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
      runOptionBorderFeedback,
      voiceEnabled,
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
      <View style={styles.trialContainer}>
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
                    { width: ITEM_SIZE, height: ITEM_SIZE },
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
                    size={ITEM_SIZE}
                    itemRadius={ITEM_RADIUS}
                    borderColorAnim={targetBorderAnims[index]}
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
                itemSize={ITEM_SIZE}
                itemRadius={ITEM_RADIUS}
                borderColorAnim={optionBorderAnims[index]}
                defaultBorderColor={matchedOptionIndices.has(index) ? OPTION_BORDER_SUCCESS : OPTION_BORDER_DEFAULT}
              />
            ))}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  trialContainer: {
    flex: 1,
    backgroundColor: "#F4F7F8",
    padding: 24,
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
  itemBox: {
    borderWidth: BORDER_WIDTH,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBox: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLetter: {
    fontWeight: "700",
    color: Colors.textPrimary,
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
