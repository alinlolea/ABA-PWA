/**
 * Pattern Reproduction Trial – "Reproducere pattern"
 * Child reproduces a horizontal pattern (colors and/or shapes) left → right by dragging from pool to slots.
 */

import { Colors } from "@/design/colors";
import { STIMULI_BY_CATEGORY } from "@/features/b1-2d-matching/stimuliByCategory";
import { LinearGradient } from "expo-linear-gradient";
import { db } from "@/config/firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useResponsive } from "@/utils/responsive";
import Svg, { Circle, Ellipse, Polygon, Rect } from "react-native-svg";
import { playAudio } from "@/utils/audio";
import { initSpeech, stopSpeech } from "@/utils/speech";

export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "rectangle"
  | "oval"
  | "star"
  | "diamond";

export type PatternItem =
  | { type: "color"; color: string }
  | { type: "shape"; shape: ShapeType };

function isWhiteLike(color: string): boolean {
  const c = color.toLowerCase().trim();
  if (c === "#ffffff" || c === "#fff" || c === "white") return true;
  if (c === "#fafafa" || c === "#fafafaff") return true;
  const hex = c.replace(/^#/, "");
  if (hex.length !== 6 && hex.length !== 8) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return r >= 0xf0 && g >= 0xf0 && b >= 0xf0;
}

const CUBE_COLORS = STIMULI_BY_CATEGORY["colors"]
  .map((s) => s.image)
  .filter((img): img is string => typeof img === "string")
  .filter((color) => !isWhiteLike(color));

const SHAPE_FORMS: ShapeType[] = ["circle", "square", "triangle", "rectangle", "oval", "star", "diamond"];
const SHAPE_FILL_NEUTRAL = Colors.textPrimary;

const ITEM_SIZE_DEFAULT = 90;
const ITEM_RADIUS = 16;
const SNAP_DURATION = 200;
const SHAKE_DURATION = 300;
const BORDER_ERROR = "#e74c3c";
const BORDER_WIDTH = 2;
const TRIAL_COUNT = 10;
const MAX_TOTAL_CUBES = 14;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function itemsEqual(a: PatternItem | null, b: PatternItem | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.type !== b.type) return false;
  if (a.type === "color" && b.type === "color") return a.color === b.color;
  if (a.type === "shape" && b.type === "shape") return a.shape === b.shape;
  return false;
}

function patternItemKey(item: PatternItem): string {
  if (item.type === "color") return `color:${item.color}`;
  return `shape:${item.shape}`;
}

function pickDistinctColorItems(n: number): PatternItem[] {
  const shuffled = shuffle([...CUBE_COLORS]);
  return shuffled.slice(0, n).map((color) => ({ type: "color" as const, color }));
}

function pickDistinctShapeItems(n: number): PatternItem[] {
  const shuffled = shuffle([...SHAPE_FORMS]);
  return shuffled.slice(0, n).map((shape) => ({ type: "shape" as const, shape }));
}

function pickBasePatternFree(patternLength: number): PatternItem[] {
  const types: ("color" | "shape")[] = [];
  types.push("color", "shape");
  for (let i = 2; i < patternLength; i++) {
    types.push(Math.random() < 0.5 ? "color" : "shape");
  }
  shuffle(types);

  const usedColors = new Set<string>();
  const usedShapes = new Set<string>();
  const colorPool = shuffle([...CUBE_COLORS]);
  const shapePool = shuffle([...SHAPE_FORMS]);
  const basePattern: PatternItem[] = [];

  for (const t of types) {
    if (t === "color") {
      const c = colorPool.find((x) => !usedColors.has(x));
      if (c) {
        usedColors.add(c);
        basePattern.push({ type: "color", color: c });
      }
    } else {
      const s = shapePool.find((x) => !usedShapes.has(x));
      if (s) {
        usedShapes.add(s);
        basePattern.push({ type: "shape", shape: s });
      }
    }
  }
  return basePattern;
}

function pickBasePatternAlternating(patternLength: number): PatternItem[] {
  const startWithColor = Math.random() < 0.5;
  const numColors = startWithColor
    ? Math.ceil(patternLength / 2)
    : Math.floor(patternLength / 2);
  const numShapes = patternLength - numColors;
  const colors = shuffle([...CUBE_COLORS]).slice(0, numColors);
  const shapes = shuffle([...SHAPE_FORMS]).slice(0, numShapes);
  const basePattern: PatternItem[] = [];
  let ci = 0;
  let si = 0;
  for (let i = 0; i < patternLength; i++) {
    const useColor = startWithColor ? i % 2 === 0 : i % 2 === 1;
    if (useColor && ci < colors.length) {
      basePattern.push({ type: "color", color: colors[ci++] });
    } else if (si < shapes.length) {
      basePattern.push({ type: "shape", shape: shapes[si++] });
    }
  }
  return basePattern;
}

function pickDistractorItems(model: PatternItem[], count: number): PatternItem[] {
  const hasColor = model.some((m) => m.type === "color");
  const hasShape = model.some((m) => m.type === "shape");
  const modelKeys = new Set(model.map(patternItemKey));
  const result: PatternItem[] = [];

  if (hasColor && !hasShape) {
    const available = shuffle([...CUBE_COLORS]).filter((c) => !modelKeys.has(`color:${c}`));
    for (let i = 0; i < count && i < available.length; i++) {
      result.push({ type: "color", color: available[i] });
    }
    return result;
  }

  if (hasShape && !hasColor) {
    const available = shuffle([...SHAPE_FORMS]).filter((s) => !modelKeys.has(`shape:${s}`));
    for (let i = 0; i < count && i < available.length; i++) {
      result.push({ type: "shape", shape: available[i] });
    }
    return result;
  }

  if (hasColor && hasShape) {
    const availableColors = shuffle([...CUBE_COLORS]).filter((c) => !modelKeys.has(`color:${c}`));
    const availableShapes = shuffle([...SHAPE_FORMS]).filter((s) => !modelKeys.has(`shape:${s}`));
    const usedColorSet = new Set<string>();
    const usedShapeSet = new Set<string>();
    for (let i = 0; i < count; i++) {
      const chooseColor = Math.random() < 0.5;
      if (chooseColor && availableColors.some((c) => !usedColorSet.has(c))) {
        const c = availableColors.find((x) => !usedColorSet.has(x))!;
        usedColorSet.add(c);
        result.push({ type: "color", color: c });
      } else if (availableShapes.some((s) => !usedShapeSet.has(s))) {
        const s = availableShapes.find((x) => !usedShapeSet.has(x))!;
        usedShapeSet.add(s);
        result.push({ type: "shape", shape: s });
      } else if (availableColors.some((c) => !usedColorSet.has(c))) {
        const c = availableColors.find((x) => !usedColorSet.has(x))!;
        usedColorSet.add(c);
        result.push({ type: "color", color: c });
      } else {
        break;
      }
    }
    return result;
  }

  return result;
}

export type PatternTrialConfig = {
  patternLength: number;
  repetitions: number;
  numberOfDistractors: number;
  useColors?: boolean;
  useShapes?: boolean;
  patternStructure?: "free" | "alternating";
};

export type PatternTrialState = {
  model: PatternItem[];
  placedCubes: (PatternItem | null)[];
  availableCubes: PatternItem[];
  placedPoolIndices: number[];
  completed: boolean;
};

function generateTrial(config: PatternTrialConfig): PatternTrialState {
  let useColors = config.useColors ?? true;
  let useShapes = config.useShapes ?? false;
  if (!useColors && !useShapes) useColors = true;

  const patternLength = Math.min(4, Math.max(2, config.patternLength));
  let repetitions = Math.min(4, Math.max(2, config.repetitions));
  const total = patternLength * repetitions;
  if (total > MAX_TOTAL_CUBES) {
    repetitions = Math.floor(MAX_TOTAL_CUBES / patternLength);
  }
  const numDistractors = Math.min(3, Math.max(0, config.numberOfDistractors ?? 0));

  const patternStructure = config.patternStructure ?? "free";
  let basePattern: PatternItem[];
  if (useColors && !useShapes) {
    basePattern = pickDistinctColorItems(patternLength);
  } else if (!useColors && useShapes) {
    basePattern = pickDistinctShapeItems(patternLength);
  } else {
    basePattern =
      patternStructure === "alternating"
        ? pickBasePatternAlternating(patternLength)
        : pickBasePatternFree(patternLength);
  }

  const fullModel: PatternItem[] = [];
  for (let r = 0; r < repetitions; r++) {
    fullModel.push(...basePattern);
  }

  const distractors = pickDistractorItems(fullModel, numDistractors);
  const availableCubes = shuffle([...fullModel, ...distractors]);

  return {
    model: fullModel,
    placedCubes: Array(fullModel.length).fill(null),
    availableCubes,
    placedPoolIndices: [],
    completed: false,
  };
}

function PatternShapeSvg({
  form,
  size,
  fill,
}: {
  form: ShapeType;
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

function renderPatternItem(item: PatternItem, size: number = ITEM_SIZE_DEFAULT) {
  if (item.type === "color") {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: item.color,
          borderRadius: ITEM_RADIUS,
        }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size }}>
      <PatternShapeSvg form={item.shape} size={size} fill={SHAPE_FILL_NEUTRAL} />
    </View>
  );
}

type Props = {
  sessionId: string;
  config: PatternTrialConfig;
  onComplete?: () => void;
  voiceEnabled?: boolean;
};

export default function PatternReproductionTrial({
  sessionId,
  config,
  onComplete,
  voiceEnabled = true,
}: Props) {
  const { width: screenWidth, height: screenHeight, rs } = useResponsive();
  const topZoneHeight = screenHeight * 0.6;
  const topZoneWidth = screenWidth;

  useEffect(() => {
    initSpeech();
  }, []);

  const [session, setSession] = useState(() => ({
    trials: [] as PatternTrialState[],
    currentTrialIndex: 0,
    score: 0,
    completed: false,
  }));

  const trialsInitializedRef = useRef(false);
  useEffect(() => {
    if (trialsInitializedRef.current) return;
    trialsInitializedRef.current = true;
    const normalizedConfig: PatternTrialConfig = {
      patternLength: Math.min(4, Math.max(2, config.patternLength)),
      repetitions: Math.min(4, Math.max(2, config.repetitions)),
      numberOfDistractors: Math.min(3, Math.max(0, config.numberOfDistractors ?? 0)),
      useColors: config.useColors ?? true,
      useShapes: config.useShapes ?? false,
      patternStructure: config.patternStructure ?? "free",
    };
    const trials = Array.from({ length: TRIAL_COUNT }, () => generateTrial(normalizedConfig));
    setSession((prev) => ({ ...prev, trials }));
  }, [config.patternLength, config.repetitions, config.numberOfDistractors, config.useColors, config.useShapes, config.patternStructure]);

  useEffect(() => {
    if (!session.completed) return;
    updateDoc(doc(db, "sessions", sessionId), {
      completedAt: serverTimestamp(),
      correctTrials: session.score,
      totalTrials: TRIAL_COUNT,
    });
    onComplete?.();
  }, [session.completed, sessionId, session.score, onComplete]);

  const currentTrial = session.completed
    ? null
    : session.trials[session.currentTrialIndex] ?? null;

  if (!currentTrial) {
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

  const totalItems = Math.max(1, currentTrial.availableCubes.length);
  const availableWidth = screenWidth * 0.9;
  const sizeFromWidth = availableWidth / totalItems;
  const maxItemSize = rs(90);
  const itemSize = Math.min(maxItemSize, sizeFromWidth);

  return (
    <PatternTrialInner
      key={session.currentTrialIndex}
      trial={currentTrial}
      currentTrialIndex={session.currentTrialIndex}
      voiceEnabled={voiceEnabled}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      itemSize={itemSize}
      onTrialComplete={() => {
        setSession((prev) => {
          if (prev.currentTrialIndex >= TRIAL_COUNT - 1) {
            return { ...prev, score: prev.score + 1, completed: true };
          }
          return {
            ...prev,
            currentTrialIndex: prev.currentTrialIndex + 1,
            score: prev.score + 1,
          };
        });
      }}
    />
  );
}

type InnerProps = {
  trial: PatternTrialState;
  currentTrialIndex: number;
  voiceEnabled?: boolean;
  screenWidth: number;
  screenHeight: number;
  itemSize: number;
  onTrialComplete: () => void;
};

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

function PatternTrialInner({
  trial,
  currentTrialIndex,
  voiceEnabled = true,
  screenWidth,
  screenHeight,
  itemSize,
  onTrialComplete,
}: InnerProps) {
  const progressText = `${currentTrialIndex + 1} / ${TRIAL_COUNT}`;
  const [state, setState] = useState(trial);
  const topZoneWidth = screenWidth;
  const topZoneHeight = screenHeight * 0.6;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (voiceEnabled) {
        stopSpeech();
        playAudio("pune-la-fel");
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [voiceEnabled]);

  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [cubePositions, setCubePositions] = useState<{ x: number; y: number }[]>([]);
  const slotRefs = useRef<(View | null)[]>([]);
  const poolRef = useRef<View | null>(null);
  const poolLayout = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const pans = useRef(
    trial.availableCubes.map(() => new Animated.ValueXY())
  ).current;
  const shakes = useRef(
    trial.availableCubes.map(() => new Animated.Value(0))
  ).current;
  const borderAnims = useRef(
    trial.availableCubes.map(() => new Animated.Value(0))
  ).current;

  const n = state.model.length;

  const initPositions = useCallback(() => {
    const count = trial.availableCubes.length;
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
  }, [trial.availableCubes.length, topZoneWidth, topZoneHeight, itemSize]);

  useEffect(() => {
    const t = setTimeout(initPositions, 100);
    return () => clearTimeout(t);
  }, [initPositions]);

  const allPlaced = state.placedCubes.every((c, i) => itemsEqual(c, state.model[i]));

  useEffect(() => {
    if (!allPlaced) return;

    let t: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      stopSpeech();
      await playAudio("bravo");
      t = setTimeout(() => onTrialComplete(), 1200);
    })();
    return () => {
      if (t != null) clearTimeout(t);
    };
  }, [allPlaced, onTrialComplete]);

  const runShakeAndReturn = useCallback(
    (index: number) => {
      borderAnims[index].setValue(2);
      Animated.sequence([
        Animated.timing(shakes[index], {
          toValue: 10,
          duration: SHAKE_DURATION / 4,
          useNativeDriver: false,
        }),
        Animated.timing(shakes[index], {
          toValue: -10,
          duration: SHAKE_DURATION / 4,
          useNativeDriver: false,
        }),
        Animated.timing(shakes[index], {
          toValue: 8,
          duration: SHAKE_DURATION / 4,
          useNativeDriver: false,
        }),
        Animated.timing(shakes[index], {
          toValue: 0,
          duration: SHAKE_DURATION / 4,
          useNativeDriver: false,
        }),
      ]).start(() => {
        borderAnims[index].setValue(0);
        Animated.parallel([
          Animated.timing(pans[index].x, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(pans[index].y, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      });
    },
    [shakes, pans, borderAnims]
  );

  const slotLayouts = useRef<{ x: number; y: number; w: number; h: number }[]>([]);

  const handleRelease = useCallback(
    (cubeIndex: number, item: PatternItem) =>
      (_: unknown, gestureState: { dx: number; dy: number }) => {
        setActiveDragIndex(null);
        const dx = gestureState.dx;
        const dy = gestureState.dy;

        const resolveSlot = (slotIndex: number) => {
          const layout = slotLayouts.current[slotIndex];
          if (!layout) return;
          const slotCenterX = layout.x + layout.w / 2;
          const slotCenterY = layout.y + layout.h / 2;
          const pos = cubePositions[cubeIndex];
          if (!pos) return;
          const pool = poolLayout.current;
          const cubeScreenX = pool.x + pos.x + itemSize / 2 + dx;
          const cubeScreenY = pool.y + pos.y + itemSize / 2 + dy;
          const dist = Math.sqrt(
            (slotCenterX - cubeScreenX) ** 2 + (slotCenterY - cubeScreenY) ** 2
          );
          return { slotIndex, dist };
        };

        let best: { slotIndex: number; dist: number } | null = null;
        for (let s = 0; s < n; s++) {
          const r = resolveSlot(s);
          if (r && (!best || r.dist < best.dist)) best = r;
        }

        if (!best || best.dist > itemSize * 1.2) {
          runShakeAndReturn(cubeIndex);
          return;
        }

        const slotIndex = best.slotIndex;
        if (state.placedCubes[slotIndex] !== null) {
          runShakeAndReturn(cubeIndex);
          return;
        }

        const nextExpectedIndex = (() => {
          for (let i = 0; i < state.placedCubes.length; i++) {
            if (state.placedCubes[i] === null) return i;
          }
          return -1;
        })();
        if (slotIndex !== nextExpectedIndex) {
          runShakeAndReturn(cubeIndex);
          return;
        }

        const expected = state.model[slotIndex];
        if (!itemsEqual(item, expected)) {
          runShakeAndReturn(cubeIndex);
          return;
        }

        const layout = slotLayouts.current[slotIndex];
        if (!layout) {
          runShakeAndReturn(cubeIndex);
          return;
        }

        const pool = poolLayout.current;
        const originX = cubePositions[cubeIndex]?.x ?? 0;
        const originY = cubePositions[cubeIndex]?.y ?? 0;
        const toX = layout.x - pool.x - originX;
        const toY = layout.y - pool.y - originY;

        Animated.parallel([
          Animated.timing(pans[cubeIndex].x, {
            toValue: toX,
            duration: SNAP_DURATION,
            useNativeDriver: false,
          }),
          Animated.timing(pans[cubeIndex].y, {
            toValue: toY,
            duration: SNAP_DURATION,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setState((prev) => {
            const nextPlaced = [...prev.placedCubes];
            nextPlaced[slotIndex] = item;
            return {
              ...prev,
              placedCubes: nextPlaced,
              placedPoolIndices: [...prev.placedPoolIndices, cubeIndex],
            };
          });
        });
      },
    [
      state.placedCubes,
      state.model,
      state.placedPoolIndices,
      cubePositions,
      n,
      itemSize,
      runShakeAndReturn,
    ]
  );

  const panResponders = useMemo(
    () =>
      trial.availableCubes.map((item, i) => {
        const used = state.placedPoolIndices.includes(i);
        const canDrag = !used && activeDragIndex === null;
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
    [trial.availableCubes, state.placedPoolIndices, activeDragIndex, handleRelease, pans]
  );

  const borderColor = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ["transparent", "#2ecc71", BORDER_ERROR],
    });

  const nextExpectedIndex = (() => {
    for (let i = 0; i < state.placedCubes.length; i++) {
      if (state.placedCubes[i] === null) return i;
    }
    return -1;
  })();

  return (
    <View style={styles.root}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{progressText}</Text>
      </View>
      <View
        style={styles.topZone}
        ref={poolRef}
        onLayout={() => {
          poolRef.current?.measureInWindow((x, y) => {
            poolLayout.current = { x, y };
          });
        }}
      >
        {trial.availableCubes.map((item, i) => {
          if (state.placedPoolIndices.includes(i)) return null;
          const pos = cubePositions[i] ?? { x: 0, y: 0 };
          return (
            <Animated.View
              key={`${patternItemKey(item)}-${i}`}
              {...panResponders[i].panHandlers}
              style={[
                styles.cubeWrap,
                {
                  left: pos.x,
                  top: pos.y,
                  width: itemSize,
                  height: itemSize,
                  transform: [
                    { translateX: Animated.add(pans[i].x, shakes[i]) },
                    { translateY: pans[i].y },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.cube,
                  {
                    backgroundColor: item.type === "shape" ? "transparent" : undefined,
                    borderRadius: item.type === "color" ? ITEM_RADIUS : 0,
                    borderWidth: borderAnims[i].interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, BORDER_WIDTH, BORDER_WIDTH],
                    }),
                    borderColor: borderColor(borderAnims[i]),
                  },
                ]}
              >
                {renderPatternItem(item, itemSize)}
              </Animated.View>
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
        <View style={styles.patternWrapper}>
          <View style={styles.slotRow}>
            {state.placedCubes.map((item, i) => (
              <View
                key={i}
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
                onLayout={() => {
                  slotRefs.current[i]?.measureInWindow((x, y, w, h) => {
                    slotLayouts.current[i] = { x, y, w, h };
                  });
                }}
                style={[
                  styles.slot,
                  {
                    width: itemSize,
                    height: itemSize,
                    borderWidth: 2,
                    borderColor:
                      i === nextExpectedIndex
                        ? "#2C6468"
                        : "rgba(0,0,0,0.25)",
                  },
                ]}
              >
                {item && renderPatternItem(item, itemSize)}
              </View>
            ))}
          </View>

          <View style={styles.modelRow}>
            {state.model.map((item, i) => (
              <View key={i} style={{ width: itemSize, height: itemSize }}>
                {renderPatternItem(item, itemSize)}
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
    backgroundColor: "#F4F7F8",
  },
  progressContainer: {
    position: "absolute",
    top: 20,
    left: 24,
    zIndex: 10,
  },
  progressText: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  topZone: {
    flex: 0.6,
    position: "relative",
  },
  bottomZone: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
  },
  patternWrapper: {
    alignItems: "center",
  },
  slotRow: {
    flexDirection: "row",
  },
  modelRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  horizontalDivider: {
    height: 2,
    width: "100%",
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
  },
  cubeWrap: {
    position: "absolute",
    zIndex: 10,
    elevation: 10,
  },
  cube: {
    flex: 1,
    overflow: "hidden",
  },
  completedRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E1E1E",
    marginBottom: 12,
  },
  completedScore: {
    fontSize: 16,
    color: "#6B6B6B",
  },
});
