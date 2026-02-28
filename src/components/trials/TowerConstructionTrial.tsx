/**
 * Tower Construction Trial – "Construcție cuburi peste model"
 * Child reproduces a vertical tower of colored cubes by dragging from pool to model slots.
 */

import { STIMULI_BY_CATEGORY } from "@/features/b1-2d-matching/stimuliByCategory";
import { LinearGradient } from "expo-linear-gradient";
import { db } from "@/services/firebaseConfig";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Tts from "react-native-tts";

const CUBE_COLORS = STIMULI_BY_CATEGORY["colors"]
  .map((s) => s.image)
  .filter((img): img is string => typeof img === "string")
  .filter((color) => color.toLowerCase() !== "#ffffff");

type CubeColor = string;

const MIN_ITEM_SIZE = 70;
const MAX_ITEM_SIZE = 120;
const ITEM_RADIUS_RATIO = 0.18;
const SNAP_DURATION = 200;
const SHAKE_DURATION = 300;
const SUCCESS_BORDER_DURATION = 600;
const BORDER_SUCCESS = "#2ecc71";
const BORDER_ERROR = "#e74c3c";
const BORDER_WIDTH = 2;
const TRIAL_COUNT = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Same item size logic as Matching Trial (trial.tsx). */
function computeItemSize(screenWidth: number, itemCount: number): number {
  const usableWidth = screenWidth * 0.9;
  const gap = usableWidth * 0.02;
  const count = Math.max(1, itemCount);
  return clamp(
    (usableWidth - gap * (count - 1)) / count,
    MIN_ITEM_SIZE,
    MAX_ITEM_SIZE
  );
}

export type TowerTrialConfig = {
  numberOfItems: number;
  numberOfDistractors: number;
};

export type TowerTrialState = {
  modelTower: CubeColor[];
  placedCubes: (CubeColor | null)[];
  availableCubes: CubeColor[];
  completed: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDistinctColors(n: number, excludeSameForTwo: boolean): CubeColor[] {
  const shuffled = shuffle([...CUBE_COLORS]);
  if (n === 2 && excludeSameForTwo) {
    return [shuffled[0], shuffled[1]];
  }
  return shuffled.slice(0, n);
}

function pickDistractorColors(modelColors: CubeColor[], count: number): CubeColor[] {
  const available = CUBE_COLORS.filter((c) => !modelColors.includes(c));
  const shuffled = shuffle(available);
  const result: CubeColor[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

function generateTrial(config: TowerTrialConfig): TowerTrialState {
  const n = Math.min(5, Math.max(2, config.numberOfItems));
  const numDistractors = Math.min(4, Math.max(0, config.numberOfDistractors ?? 0));
  const modelTower = pickDistinctColors(n, n === 2);
  const availableCubes = [...modelTower, ...pickDistractorColors(modelTower, numDistractors)];
  return {
    modelTower,
    placedCubes: Array(n).fill(null),
    availableCubes: shuffle(availableCubes),
    completed: false,
  };
}

type Props = {
  sessionId: string;
  config: TowerTrialConfig;
  onComplete?: () => void;
  voiceEnabled?: boolean;
};

export default function TowerConstructionTrial({ sessionId, config, onComplete, voiceEnabled = true }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const leftWidth = screenWidth * 0.6;
  const rightWidth = screenWidth * 0.4;
  const itemCount = Math.max(1, config.numberOfItems + (config.numberOfDistractors ?? 0));
  const itemSize = computeItemSize(screenWidth, itemCount);
  const itemRadius = Math.round(itemSize * ITEM_RADIUS_RATIO);

  useEffect(() => {
    Tts.setDefaultLanguage("ro-RO");
    Tts.setDefaultRate(0.5);
  }, []);

  const [session, setSession] = useState(() => ({
    trials: [] as TowerTrialState[],
    currentTrialIndex: 0,
    score: 0,
    completed: false,
  }));

  const trialsInitializedRef = useRef(false);
  useEffect(() => {
    if (trialsInitializedRef.current) return;
    trialsInitializedRef.current = true;
    const normalizedConfig: TowerTrialConfig = {
      numberOfItems: Math.min(5, Math.max(2, config.numberOfItems)),
      numberOfDistractors: Math.max(0, config.numberOfDistractors ?? 0),
    };
    const trials = Array.from({ length: TRIAL_COUNT }, () => generateTrial(normalizedConfig));
    setSession((prev) => ({ ...prev, trials }));
  }, [config.numberOfItems, config.numberOfDistractors]);

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

  return (
    <TowerTrialInner
      key={session.currentTrialIndex}
      trial={currentTrial}
      currentTrialIndex={session.currentTrialIndex}
      voiceEnabled={voiceEnabled}
      leftWidth={leftWidth}
      rightWidth={rightWidth}
      screenHeight={screenHeight}
      itemSize={itemSize}
      itemRadius={itemRadius}
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
  trial: TowerTrialState;
  currentTrialIndex: number;
  voiceEnabled?: boolean;
  leftWidth: number;
  rightWidth: number;
  screenHeight: number;
  itemSize: number;
  itemRadius: number;
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

function TowerTrialInner({
  trial,
  currentTrialIndex,
  voiceEnabled = true,
  leftWidth,
  rightWidth,
  screenHeight,
  itemSize,
  itemRadius,
  onTrialComplete,
}: InnerProps) {
  const progressText = `${currentTrialIndex + 1} / ${TRIAL_COUNT}`;
  const [state, setState] = useState(trial);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (voiceEnabled) {
        Tts.stop();
        Tts.speak("Construiește turn", {
          pitch: 1.4,
          rate: 0.6,
        } as unknown as Parameters<typeof Tts.speak>[1]);
      }
    }, 1500);

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
  const slotBorderAnims = useRef(
    trial.modelTower.map(() => new Animated.Value(0))
  ).current;

  const n = state.modelTower.length;
  const leftZoneHeight = screenHeight;

  const initPositions = useCallback(() => {
    const count = trial.availableCubes.length;
    const maxX = Math.max(0, leftWidth - itemSize);
    const maxY = Math.max(0, leftZoneHeight - itemSize);
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
  }, [trial.availableCubes.length, leftWidth, leftZoneHeight, itemSize]);

  useEffect(() => {
    const t = setTimeout(initPositions, 100);
    return () => clearTimeout(t);
  }, [initPositions]);

  const allPlaced = state.placedCubes.every((c, i) => c === state.modelTower[i]);

  useEffect(() => {
    if (!allPlaced) return;

    Tts.stop();
    Tts.speak("Bravo!", {
      pitch: 1.4,
      rate: 0.6,
    } as unknown as Parameters<typeof Tts.speak>[1]);

    const t = setTimeout(() => {
      onTrialComplete();
    }, 1200);

    return () => clearTimeout(t);
  }, [allPlaced, onTrialComplete]);

  const runSuccessBorder = useCallback(
    (cubeIndex: number, slotIndex: number) => {
      slotBorderAnims[slotIndex].setValue(1);
      Animated.timing(slotBorderAnims[slotIndex], {
        toValue: 0,
        duration: SUCCESS_BORDER_DURATION,
        useNativeDriver: false,
      }).start();
    },
    [slotBorderAnims]
  );

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
    (cubeIndex: number, color: CubeColor) =>
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

        const nextExpectedSlot = (() => {
          for (let i = state.placedCubes.length - 1; i >= 0; i--) {
            if (state.placedCubes[i] === null) {
              return i;
            }
          }
          return -1;
        })();
        if (slotIndex !== nextExpectedSlot) {
          runShakeAndReturn(cubeIndex);
          return;
        }

        const expectedColor = state.modelTower[slotIndex];
        if (color !== expectedColor) {
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
          runSuccessBorder(cubeIndex, slotIndex);
          setState((prev) => {
            const next = [...prev.placedCubes];
            next[slotIndex] = color;
            const nextAvailable = prev.availableCubes.filter((_, i) => i !== cubeIndex);
            return {
              ...prev,
              placedCubes: next,
              availableCubes: nextAvailable,
            };
          });
        });
      },
    [
      state.placedCubes,
      state.modelTower,
      cubePositions,
      n,
      itemSize,
      runShakeAndReturn,
      runSuccessBorder,
    ]
  );

  const panResponders = useMemo(
    () =>
      trial.availableCubes.map((color, i) => {
        const cubeUsed = state.placedCubes.includes(color);
        const canDrag = !cubeUsed && activeDragIndex === null;
        return PanResponder.create({
          onStartShouldSetPanResponder: () => canDrag,
          onMoveShouldSetPanResponder: () => activeDragIndex === i,
          onPanResponderGrant: () => setActiveDragIndex(i),
          onPanResponderMove: (_, g) => {
            pans[i].setValue({ x: g.dx, y: g.dy });
          },
          onPanResponderRelease: handleRelease(i, color),
        });
      }),
    [trial.availableCubes, state.placedCubes, activeDragIndex, handleRelease, pans]
  );

  const borderColor = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ["transparent", BORDER_SUCCESS, BORDER_ERROR],
    });

  const nextExpectedSlot = (() => {
    for (let i = state.placedCubes.length - 1; i >= 0; i--) {
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
        style={[styles.leftZone, { width: leftWidth }]}
          ref={poolRef}
          onLayout={() => {
            poolRef.current?.measureInWindow((x, y) => {
              poolLayout.current = { x, y };
            });
          }}
        >
          {trial.availableCubes.map((color, i) => {
            const used = state.placedCubes.includes(color);
            const pos = cubePositions[i] ?? { x: 0, y: 0 };
            if (used) return null;
            return (
              <Animated.View
                key={`${color}-${i}`}
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
                      backgroundColor: color,
                      borderRadius: itemRadius,
                      borderWidth: borderAnims[i].interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [0, BORDER_WIDTH, BORDER_WIDTH],
                      }),
                      borderColor: borderColor(borderAnims[i]),
                    },
                  ]}
                />
              </Animated.View>
            );
          })}
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
          end={{ x: 0, y: 1 }}
          style={styles.verticalDivider}
        />

        <View style={styles.rightZone} />

        <View style={styles.towerWrapper}>
          <View style={styles.towerContainer}>
            <View style={styles.modelTower}>
              {state.modelTower.map((color, i) => (
                <View
                  key={i}
                  style={[
                    styles.modelCube,
                    {
                      width: itemSize,
                      height: itemSize,
                      backgroundColor:
                        state.placedCubes[i] !== null
                          ? "transparent"
                          : color,
                      borderRadius: itemRadius,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.slotsOverlay}>
              {state.placedCubes.map((_, slotIndex) => (
                <View
                  key={slotIndex}
                  ref={(el) => {
                    slotRefs.current[slotIndex] = el;
                  }}
                  onLayout={() => {
                    slotRefs.current[slotIndex]?.measureInWindow((x, y, w, h) => {
                      slotLayouts.current[slotIndex] = { x, y, w, h };
                    });
                  }}
                  style={[
                    styles.slot,
                    { width: itemSize, height: itemSize },
                    slotIndex === nextExpectedSlot
                      ? { borderWidth: 2, borderColor: "#2C6468" }
                      : { borderWidth: 0, borderColor: "transparent" },
                  ]}
                >
                  {state.placedCubes[slotIndex] && (
                    <Animated.View
                      style={[
                        styles.placedCube,
                        {
                          width: itemSize,
                          height: itemSize,
                          backgroundColor: state.placedCubes[slotIndex]!,
                          borderRadius: itemRadius,
                          opacity:
                            nextExpectedSlot === -1
                              ? 0.55
                              : slotIndex > nextExpectedSlot
                                ? 0.55
                                : 1,
                          borderWidth: slotBorderAnims[slotIndex].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, BORDER_WIDTH],
                          }),
                          borderColor: slotBorderAnims[slotIndex].interpolate({
                            inputRange: [0, 1],
                            outputRange: ["transparent", BORDER_SUCCESS],
                          }),
                        },
                      ]}
                    />
                  )}
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
    flexDirection: "row",
    position: "relative",
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
  leftZone: {
    flex: 0.6,
    position: "relative",
    backgroundColor: "#F4F7F8",
  },
  rightZone: {
    flex: 0.4,
    position: "relative",
  },
  verticalDivider: {
    width: 2,
    height: "100%",
  },
  towerWrapper: {
    position: "absolute",
    right: 0,
    bottom: 120,
    width: "40%",
    alignItems: "center",
  },
  cubeWrap: {
    position: "absolute",
    zIndex: 10,
    elevation: 10,
  },
  cube: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  towerContainer: {
    position: "relative",
  },
  modelTower: {
    alignItems: "center",
  },
  modelCube: {},
  slotsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
  },
  placedCube: {
    position: "absolute",
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
