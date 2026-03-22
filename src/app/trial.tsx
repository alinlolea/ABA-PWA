import ColorLabelingTrial from "@/components/trials/ColorLabelingTrial";
import PatternContinuationTrial from "@/components/trials/PatternContinuationTrial";
import LogicalMatchingTrial from "@/components/trials/LogicalMatchingTrial";
import PatternReproductionTrial from "@/components/trials/PatternReproductionTrial";
import TowerConstructionCopyTrial from "@/components/trials/TowerConstructionCopyTrial";
import TowerConstructionTrial from "@/components/trials/TowerConstructionTrial";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Theme } from "@/design/theme";
import { Typography } from "@/design/typography";
import { generateTrials } from "@/features/b1-2d-matching/logic/generateTrials";
import { STIMULI_BY_CATEGORY, type CategoryKey } from "@/features/b1-2d-matching/stimuliByCategory";
import type { B1Config, SessionState, Stimulus, Trial } from "@/features/b1-2d-matching/types";
import { auth, db } from "@/config/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  makeMutable,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { playAudio } from "@/utils/audio";
import { initSpeech, stopSpeech } from "@/utils/speech";
import Svg, { Circle, Ellipse, Polygon, Rect } from "react-native-svg";

const TRIAL_COUNT = 10;
const CORRECT_FEEDBACK_MS = 600;
const SHAKE_DURATION_MS = 300;
const SNAP_ANIM_DURATION = 200;
/** Max items in top row for B1 matching (logical association supports up to 5 pairs). */
const MAX_TOP_TARGETS = 5;
const MAX_BOTTOM_OPTIONS = 6;
const DEFAULT_DISTRACTOR_COUNT = 0;
const MIN_ITEM_SIZE = 70;
const MAX_ITEM_SIZE = 120;
const OPTION_BORDER_DEFAULT = "#444";
const OPTION_BORDER_SUCCESS = "#2ecc71";
const OPTION_BORDER_ERROR = "#e74c3c";
const BORDER_WIDTH = 2;
const ITEM_RADIUS_RATIO = 0.18;

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

type DraggableTargetProps = {
  disabled: boolean;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  onDragStart: () => void;
  onDragEnd: (dx: number, dy: number) => void;
  viewRef: (el: View | null) => void;
  style: object | object[];
  children: React.ReactNode;
};

function DraggableTarget({
  disabled,
  translateX,
  translateY,
  onDragStart,
  onDragEnd,
  viewRef,
  style,
  children,
}: DraggableTargetProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      runOnJS(onDragEnd)(event.translationX, event.translationY);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View
        ref={viewRef as unknown as React.Ref<Reanimated.View>}
        style={[style, animatedStyle]}
      >
        {children}
      </Reanimated.View>
    </GestureDetector>
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
  const scale = 0.88;
  const innerSize = size * scale;
  const offset = (size - innerSize) / 2;
  const h = innerSize / 2;
  const viewBox = `0 0 ${size} ${size}`;

  if (form === "circle") {
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Circle cx={offset + h} cy={offset + h} r={h} fill={fill} />
      </Svg>
    );
  }
  if (form === "square") {
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Rect x={offset} y={offset} width={innerSize} height={innerSize} fill={fill} />
      </Svg>
    );
  }
  if (form === "triangle") {
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Polygon points={`${offset + h},${offset} ${offset + innerSize},${offset + innerSize} ${offset},${offset + innerSize}`} fill={fill} />
      </Svg>
    );
  }
  if (form === "rectangle") {
    const rectHeight = innerSize * 0.6;
    const y = offset + (innerSize - rectHeight) / 2;
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Rect x={offset} y={y} width={innerSize} height={rectHeight} fill={fill} />
      </Svg>
    );
  }
  if (form === "oval") {
    const ry = (innerSize * 0.6) / 2;
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Ellipse cx={offset + h} cy={offset + h} rx={h} ry={ry} fill={fill} />
      </Svg>
    );
  }
  if (form === "diamond") {
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Polygon points={`${offset + h},${offset} ${offset + innerSize},${offset + h} ${offset + h},${offset + innerSize} ${offset},${offset + h}`} fill={fill} />
      </Svg>
    );
  }
  if (form === "star") {
    const starPoints = `${offset + h},${offset} ${offset + innerSize * 0.62},${offset + innerSize * 0.38} ${offset + innerSize},${offset + innerSize * 0.38} ${offset + innerSize * 0.69},${offset + innerSize * 0.62} ${offset + innerSize * 0.81},${offset + innerSize} ${offset + h},${offset + innerSize * 0.75} ${offset + innerSize * 0.19},${offset + innerSize} ${offset + innerSize * 0.31},${offset + innerSize * 0.62} ${offset},${offset + innerSize * 0.38} ${offset + innerSize * 0.38},${offset + innerSize * 0.38}`;
    return (
      <Svg width={size} height={size} viewBox={viewBox}>
        <Polygon points={starPoints} fill={fill} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox={viewBox}>
      <Rect x={offset} y={offset} width={innerSize} height={innerSize} fill={fill} />
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
  const isShape = isShapeStimulus(stimulus.image);
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: isShape
      ? ["transparent", TARGET_BORDER_SUCCESS, TARGET_BORDER_ERROR]
      : [TARGET_BORDER_DEFAULT, TARGET_BORDER_SUCCESS, TARGET_BORDER_ERROR],
  });
  const itemBoxStyle = [
    styles.itemBox,
    { width: size, height: size, borderRadius: itemRadius },
    { borderColor: animatedBorderColor },
    isShape && { backgroundColor: "transparent" },
  ];

  if (isShape) {
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
  const isShape = isShapeStimulus(stimulus.image);
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: isShape
      ? ["transparent", OPTION_BORDER_SUCCESS, OPTION_BORDER_ERROR]
      : [defaultBorderColor, OPTION_BORDER_SUCCESS, OPTION_BORDER_ERROR],
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
    ...(isShape && { backgroundColor: "transparent" as const }),
  };

  if (isShape) {
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

type TrialParams = {
  category?: string;
  targets?: string;
  distractorCount?: string;
  childId?: string;
  sessionId?: string;
  voiceEnabled?: string;
  trialType?: string;
  objective?: string;
  module?: string;
  numberOfItems?: string;
  numberOfDistractors?: string;
  patternLength?: string;
  repetitions?: string;
  useColors?: string;
  useShapes?: string;
  patternStructure?: string;
  /** Number of pairs (top targets) for logical-image-association / B1 trials; 1–5. */
  numberOfPairs?: string;
};

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
  const numberOfPairsRaw =
    typeof params.numberOfPairs === "string"
      ? params.numberOfPairs
      : Array.isArray(params.numberOfPairs)
        ? params.numberOfPairs[0]
        : undefined;
  const hasNumberOfPairs = numberOfPairsRaw != null && String(numberOfPairsRaw).length > 0;
  const parsedPairs = parseInt(String(numberOfPairsRaw ?? "3"), 10);
  const numberOfPairs = clamp(Number.isNaN(parsedPairs) ? 3 : parsedPairs, 1, 5);
  const targetsForTrials = hasNumberOfPairs
    ? selectedTargets.slice(0, numberOfPairs)
    : selectedTargets;
  const distractorCount = Number(params.distractorCount ?? DEFAULT_DISTRACTOR_COUNT);
  const resolvedDistractorCount = Number.isNaN(distractorCount) || distractorCount < 0
    ? DEFAULT_DISTRACTOR_COUNT
    : distractorCount;
  return {
    category,
    targets: targetsForTrials.length > 0 ? targetsForTrials : selectedTargets,
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
  const objectiveRaw = params.objective;
  const objective = typeof objectiveRaw === "string" ? objectiveRaw : Array.isArray(objectiveRaw) ? objectiveRaw[0] : undefined;
  if (objective === "numeste-culori") {
    if (!sessionId) throw new Error("TrialScreen: sessionId is required for numeste-culori.");
    const voiceEnabledLabeling = (Array.isArray(params.voiceEnabled) ? params.voiceEnabled[0] : params.voiceEnabled) !== "false";
    return (
      <ColorLabelingTrial
        sessionId={sessionId}
        childId={typeof params.childId === "string" ? params.childId : Array.isArray(params.childId) ? params.childId[0] : undefined}
        voiceEnabled={voiceEnabledLabeling}
      />
    );
  }
  if (!sessionId) {
    throw new Error("TrialScreen: sessionId is missing from route params.");
  }
  const trialTypeRaw = params.trialType;
  const trialType = typeof trialTypeRaw === "string" ? trialTypeRaw : Array.isArray(trialTypeRaw) ? trialTypeRaw[0] : undefined;
  if (trialType === "tower_over_model") {
    const n = Math.min(5, Math.max(2, parseInt(params.numberOfItems ?? "3", 10) || 3));
    const d = Math.min(4, Math.max(0, parseInt(params.numberOfDistractors ?? "1", 10) || 0));
    const voiceEnabledTower = (Array.isArray(params.voiceEnabled) ? params.voiceEnabled[0] : params.voiceEnabled) !== "false";
    return (
      <TowerConstructionTrial
        sessionId={sessionId}
        config={{ numberOfItems: n, numberOfDistractors: d }}
        voiceEnabled={voiceEnabledTower}
      />
    );
  }
  if (trialType === "tower-copy") {
    const n = Math.min(5, Math.max(2, parseInt(params.numberOfItems ?? "3", 10) || 3));
    const d = Math.min(4, Math.max(0, parseInt(params.numberOfDistractors ?? "1", 10) || 0));
    const voiceEnabledTower = (Array.isArray(params.voiceEnabled) ? params.voiceEnabled[0] : params.voiceEnabled) !== "false";
    return (
      <TowerConstructionCopyTrial
        sessionId={sessionId}
        config={{ numberOfItems: n, numberOfDistractors: d }}
        voiceEnabled={voiceEnabledTower}
      />
    );
  }
  if (trialType === "pattern-reproduction") {
    const patternLength = Math.min(4, Math.max(2, parseInt(params.patternLength ?? "2", 10) || 2));
    const repetitions = Math.min(4, Math.max(2, parseInt(params.repetitions ?? "2", 10) || 2));
    const numberOfDistractors = Math.min(3, Math.max(0, parseInt(params.numberOfDistractors ?? "0", 10) || 0));
    const useColors = (Array.isArray(params.useColors) ? params.useColors[0] : params.useColors) !== "false";
    const useShapes = (Array.isArray(params.useShapes) ? params.useShapes[0] : params.useShapes) === "true";
    const patternStructureRaw = Array.isArray(params.patternStructure) ? params.patternStructure[0] : params.patternStructure;
    const patternStructure = patternStructureRaw === "alternating" ? "alternating" : "free";
    const voiceEnabledPattern = (Array.isArray(params.voiceEnabled) ? params.voiceEnabled[0] : params.voiceEnabled) !== "false";
    return (
      <PatternReproductionTrial
        sessionId={sessionId}
        config={{
          patternLength,
          repetitions,
          numberOfDistractors,
          useColors,
          useShapes,
          patternStructure,
        }}
        voiceEnabled={voiceEnabledPattern}
      />
    );
  }
  if (trialType === "pattern-continuation") {
    const patternLength = Math.min(4, Math.max(2, parseInt(params.patternLength ?? "2", 10) || 2));
    const repetitions = Math.min(4, Math.max(2, parseInt(params.repetitions ?? "2", 10) || 2));
    const visibleRepetitionsRaw = parseInt(
      Array.isArray(params.visibleRepetitions) ? params.visibleRepetitions[0] : (params.visibleRepetitions ?? String(repetitions - 1)),
      10
    );
    const visibleRepetitions = Math.min(
      Math.max(1, repetitions - 1),
      Math.max(1, visibleRepetitionsRaw || repetitions - 1)
    );
    const numberOfDistractors = Math.min(3, Math.max(0, parseInt(params.numberOfDistractors ?? "0", 10) || 0));
    const useColors = (Array.isArray(params.useColors) ? params.useColors[0] : params.useColors) !== "false";
    const useShapes = (Array.isArray(params.useShapes) ? params.useShapes[0] : params.useShapes) === "true";
    const patternStructureRaw = Array.isArray(params.patternStructure) ? params.patternStructure[0] : params.patternStructure;
    const patternStructure = patternStructureRaw === "alternating" ? "alternating" : "free";
    const voiceEnabledPattern = (Array.isArray(params.voiceEnabled) ? params.voiceEnabled[0] : params.voiceEnabled) !== "false";
    return (
      <PatternContinuationTrial
        sessionId={sessionId}
        config={{
          patternLength,
          repetitions,
          visibleRepetitions,
          numberOfDistractors,
          useColors,
          useShapes,
          patternStructure,
        }}
        voiceEnabled={voiceEnabledPattern}
      />
    );
  }
  if (trialType === "logical-image-association") {
    const numberOfPairsRaw =
      typeof params.numberOfPairs === "string"
        ? params.numberOfPairs
        : Array.isArray(params.numberOfPairs)
          ? params.numberOfPairs[0]
          : undefined;
    const parsedLogicalPairs = parseInt(String(numberOfPairsRaw ?? "3"), 10);
    const logicalPairCount = clamp(Number.isNaN(parsedLogicalPairs) ? 3 : parsedLogicalPairs, 1, 5);
    return (
      <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        <LogicalMatchingTrial pairCount={logicalPairCount} />
      </View>
    );
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
    initSpeech();
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
      stopSpeech();
      playAudio("potriveste");
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

  const dragTranslateX = useRef(
    Array.from({ length: MAX_TOP_TARGETS }, () => makeMutable(0))
  ).current;
  const dragTranslateY = useRef(
    Array.from({ length: MAX_TOP_TARGETS }, () => makeMutable(0))
  ).current;
  const targetRefs = useRef<(View | null)[]>(
    Array.from({ length: MAX_TOP_TARGETS }, () => null)
  );
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
    dragTranslateX.forEach((v) => {
      v.value = 0;
    });
    dragTranslateY.forEach((v) => {
      v.value = 0;
    });
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
  }, [dragTranslateX, dragTranslateY, targetBorderAnims, optionBorderAnims, optionPulseAnims]);

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
      dragTranslateX[index].value = withTiming(0, { duration: 250 });
      dragTranslateY[index].value = withTiming(0, { duration: 250 });
    },
    [dragTranslateX, dragTranslateY]
  );

  const runShakeThenBack = useCallback(
    (index: number) => {
      animateBackToOrigin(index);
    },
    [animateBackToOrigin]
  );

  const animateSnapTo = useCallback(
    (index: number, toX: number, toY: number, onDone?: () => void) => {
      dragTranslateX[index].value = withTiming(toX, { duration: SNAP_ANIM_DURATION });
      dragTranslateY[index].value = withTiming(
        toY,
        { duration: SNAP_ANIM_DURATION },
        (finished) => {
          if (finished && onDone) {
            runOnJS(onDone)();
          }
        }
      );
    },
    [dragTranslateX, dragTranslateY]
  );

  const createHandleRelease = useCallback(
    (targetIndex: number, targetId: string) =>
      (dx: number, dy: number) => {
        setActiveDragId(null);
        const trial = currentTrialRef.current;
        if (!trial || !trial.topTargets?.length || !trial.bottomOptions?.length) {
          animateBackToOrigin(targetIndex);
          return;
        }
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

            animateSnapTo(targetIndex, snapPanX, snapPanY, async () => {
              setTotalAttempts((prev) => prev + 1);
              if (isCorrect) {
                runOptionBorderFeedback(bestIndex, true);
                if (voiceEnabled) {
                  stopSpeech();
                  await playAudio("bravo");
                }
                setCorrectAttempts((prev) => prev + 1);
                setMatchedTargetIds((prev) => new Set(prev).add(targetId));
                setMatchedOptionIndices((prev) => new Set(prev).add(bestIndex));
              } else {
                runOptionBorderFeedback(bestIndex, false);
                if (voiceEnabled) {
                  stopSpeech();
                  await playAudio("mai-incearca");
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

  const createHandleStart = useCallback(
    (targetId: string) =>
      () => {
        if (activeDragIdRef.current !== null) return;
        if (matchedTargetIdsRef.current.has(targetId)) return;
        setActiveDragId(targetId);
      },
    []
  );

  if (session.completed) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.completedRoot}>
          <Text style={styles.completedTitle}>Sesiune finalizată</Text>
          <Text style={styles.completedScore}>
            Scor: {session.score} / {TRIAL_COUNT}
          </Text>
        </View>
      </View>
    );
  }

  if (!currentTrial) {
    return null;
  }

  const progressText = `${session.currentTrialIndex + 1} / ${TRIAL_COUNT}`;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.trialContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{progressText}</Text>
        </View>

        <View style={styles.topArea}>
          <View style={[styles.targetsRow, { gap: topGap }]}>
            {topTargets.map((target, index) => {
              const isMatched = matchedTargetIds.has(target.id);
              return (
                <DraggableTarget
                  key={target.id}
                  viewRef={(el) => {
                    targetRefs.current[index] = el;
                  }}
                  disabled={isMatched || (activeDragId !== null && activeDragId !== target.id)}
                  translateX={dragTranslateX[index]}
                  translateY={dragTranslateY[index]}
                  onDragStart={createHandleStart(target.id)}
                  onDragEnd={createHandleRelease(index, target.id)}
                  style={[
                    styles.targetWrap,
                    { width: ITEM_SIZE, height: ITEM_SIZE },
                  ]}
                >
                  <StimulusPlaceholder
                    stimulus={target}
                    size={ITEM_SIZE}
                    itemRadius={ITEM_RADIUS}
                    borderColorAnim={targetBorderAnims[index]}
                  />
                </DraggableTarget>
              );
            })}
          </View>
        </View>

        <LinearGradient
          colors={[
            "rgba(44,100,104,0)",
            "rgba(44,100,104,0.9)",
            "rgba(44,100,104,0.9)",
            "rgba(44,100,104,0)",
          ]}
          locations={[0, 0.2, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.horizontalDivider}
        />

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
    </View>
  );
}

const styles = StyleSheet.create({
  trialContainer: {
    flex: 1,
    backgroundColor: "#F4F7F8",
    padding: 24,
    touchAction: "none",
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
  horizontalDivider: {
    height: 2,
    width: "100%",
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
