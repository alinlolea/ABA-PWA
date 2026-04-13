/**
 * Sortare itemi non-identici — pool-based stream, dynamic bin count, free placement in bins.
 */

import { db } from "@/config/firebase";
import { Spacing } from "@/design/spacing";
import { Theme } from "@/design/theme";
import {
  getSortPool as getSortNonIdenticalPool,
  SORT_CATEGORY_LABELS as SORT_NON_IDENTICAL_LABELS,
} from "@/features/sort-non-identical/sortNonIdenticalAssets";
import {
  getSortPeCategoriePool,
  SORT_PE_CATEGORIE_LABELS,
} from "@/features/sort-pe-categorie/sortPeCategorieAssets";
import type { SortNonIdenticalCategoryId } from "@/features/sort-non-identical/sortNonIdenticalAssets";
import type { SortPeCategorieCategoryId } from "@/features/sort-pe-categorie/sortPeCategorieAssets";
import { LinearGradient } from "expo-linear-gradient";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { playAudio, playErrorAudio, playSuccessAudio } from "@/utils/audio";
import { normalizeRasterSource } from "@/utils/rasterImageSource";
import { trialUiRootShellStyle } from "@/utils/trialUiShell";
import { stopSpeech } from "@/utils/speech";

const RETURN_DURATION = 220;
const SHAKE_DURATION = 280;
const COMPLETION_BRAVO_DELAY_MS = 450;
const ITEM_RADIUS = 14;
const DROP_PAD_RATIO = 0.05;
const SPAWN_ATTEMPTS = 10;
const CORRECT_PULSE_MS = 520;
const CARD_BORDER = "#E2E8F0";

export type SortTrialVariant = "non_identical" | "sort_by_category";

type TopItem = {
  instanceId: string;
  categoryId: string;
  id: string;
  image: number;
};

type PlacedItem = TopItem & {
  relX: number;
  relY: number;
  zIndex: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolItemToTopItem(
  p: { id: string; categoryId: string; image: number },
  instanceId: string
): TopItem {
  return {
    instanceId,
    categoryId: p.categoryId,
    id: p.id,
    image: p.image,
  };
}

function initRemainingAndVisible(
  sessionCats: string[],
  getPool: (categoryId: string) => { id: string; categoryId: string; image: number }[]
): {
  remaining: Record<string, TopItem[]>;
  visible: TopItem[];
} {
  let uid = 0;
  const remaining = {} as Record<string, TopItem[]>;
  for (const cat of sessionCats) {
    const pool = shuffle(getPool(cat));
    remaining[cat] = pool.map((p) => poolItemToTopItem(p, `t-${uid++}`));
  }
  const visible: TopItem[] = [];
  for (const cat of sessionCats) {
    for (let i = 0; i < 3; i++) {
      const next = remaining[cat].shift();
      if (next) visible.push(next);
    }
  }
  return { remaining, visible: shuffle(visible) };
}

function rectsOverlap(
  x1: number,
  y1: number,
  s1: number,
  x2: number,
  y2: number,
  s2: number
): boolean {
  return x1 < x2 + s2 && x2 < x1 + s1 && y1 < y2 + s2 && y2 < y1 + s1;
}

function isNullDropTargetValid(
  slotIndex: number,
  slotCategory: (string | null)[],
  sessionCats: string[]
): boolean {
  if (slotCategory[slotIndex] !== null) return true;
  const assigned = slotCategory.filter(Boolean).length;
  if (sessionCats.length === 2 && assigned === 2) return false;
  return true;
}

function applyAutoAssign(
  next: (string | null)[],
  sessionCats: string[]
): void {
  const empty = next.map((v, i) => (v == null ? i : -1)).filter((i) => i >= 0);
  const used = new Set(next.filter(Boolean) as string[]);
  const missing = sessionCats.filter((c) => !used.has(c));

  if (sessionCats.length === 2 && used.size === 1 && empty.length >= 1 && missing.length === 1) {
    const sortedEmpty = [...empty].sort((a, b) => a - b);
    next[sortedEmpty[0]] = missing[0];
    return;
  }
  if (empty.length === 1 && missing.length === 1) {
    next[empty[0]] = missing[0];
  }
}

function tryDrop(
  item: TopItem,
  slotIndex: number,
  slotCategory: (string | null)[],
  sessionCats: string[]
): { ok: true; nextSlot: (string | null)[] } | { ok: false } {
  const next = [...slotCategory];
  const alreadyAssignedIndex = next.findIndex((c) => c === item.categoryId);
  if (alreadyAssignedIndex !== -1 && alreadyAssignedIndex !== slotIndex) {
    // Category has been claimed by another bin; lock further drops to that bin only.
    return { ok: false };
  }

  if (next[slotIndex] === null) {
    if (!isNullDropTargetValid(slotIndex, next, sessionCats)) return { ok: false };
    next[slotIndex] = item.categoryId;
    applyAutoAssign(next, sessionCats);
    return { ok: true, nextSlot: next };
  }

  if (next[slotIndex] === item.categoryId) {
    return { ok: true, nextSlot: next };
  }

  return { ok: false };
}

/** Top pool: random position in ~90% bounds, no overlap with existing boxes; optional exclude previous point. */
function findSpawnTopPosition(
  poolW: number,
  poolH: number,
  itemSize: number,
  existing: { x: number; y: number }[],
  excludePrevious?: { x: number; y: number } | null
): { x: number; y: number } {
  const pad = DROP_PAD_RATIO * Math.min(poolW, poolH);
  const minX = pad;
  const minY = pad;
  const maxX = Math.max(minX, poolW - itemSize - pad);
  const maxY = Math.max(minY, poolH - itemSize - pad);

  const distOk = (x: number, y: number) => {
    if (
      excludePrevious &&
      rectsOverlap(x, y, itemSize, excludePrevious.x, excludePrevious.y, itemSize)
    ) {
      return false;
    }
    return !existing.some((p) => rectsOverlap(x, y, itemSize, p.x, p.y, itemSize));
  };

  for (let t = 0; t < SPAWN_ATTEMPTS; t++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    if (distOk(x, y)) return { x, y };
  }

  const step = Math.max(8, itemSize * 0.35);
  for (let gy = minY; gy <= maxY; gy += step) {
    for (let gx = minX; gx <= maxX; gx += step) {
      const x = Math.min(gx, maxX);
      const y = Math.min(gy, maxY);
      if (distOk(x, y)) return { x, y };
    }
  }
  return { x: minX, y: minY };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

type Props = {
  sessionId: string;
  sessionCategories: string[];
  voiceEnabled?: boolean;
  /** Uses pools from `sort-pe-categorie` when set; default is sort non-identical. */
  variant?: SortTrialVariant;
};

export default function SortNonIdenticalTrial({
  sessionId,
  sessionCategories,
  voiceEnabled = true,
  variant = "non_identical",
}: Props) {
  const getPool = useCallback(
    (cat: string) => {
      if (variant === "sort_by_category") {
        return getSortPeCategoriePool(cat as SortPeCategorieCategoryId);
      }
      return getSortNonIdenticalPool(cat as SortNonIdenticalCategoryId);
    },
    [variant]
  );

  const categoryLabels = useMemo(
    () =>
      (variant === "sort_by_category" ? SORT_PE_CATEGORIE_LABELS : SORT_NON_IDENTICAL_LABELS) as Record<
        string,
        string
      >,
    [variant]
  );
  const getLabel = useCallback((id: string) => categoryLabels[id] ?? " ", [categoryLabels]);

  const nSlots = sessionCategories.length;
  const sessionKey = sessionCategories.join(",");
  const initialTrialState = useMemo(
    () => initRemainingAndVisible(sessionCategories, getPool),
    [sessionKey, getPool]
  );

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const itemSize = Math.min(100, Math.max(72, screenWidth * 0.09));
  const topZoneHeight = screenHeight * 0.48;

  const [remainingByCategory, setRemainingByCategory] = useState<
    Record<string, TopItem[]>
  >(() => initialTrialState.remaining);
  const [visibleTop, setVisibleTop] = useState<TopItem[]>(() => initialTrialState.visible);
  const [placedBins, setPlacedBins] = useState<PlacedItem[][]>(() =>
    Array.from({ length: nSlots }, () => [])
  );
  const [slotCategory, setSlotCategory] = useState<(string | null)[]>(() =>
    Array(nSlots).fill(null)
  );
  const slotCategoryRef = useRef(slotCategory);
  slotCategoryRef.current = slotCategory;

  const [positionsById, setPositionsById] = useState<Record<string, { x: number; y: number }>>({});
  const placedZRef = useRef(0);

  const [completed, setCompleted] = useState(false);
  const [trialPromptReady, setTrialPromptReady] = useState(!voiceEnabled);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [interactionLocked, setInteractionLocked] = useState(false);

  const poolRef = useRef<View | null>(null);
  const poolLayout = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dropSlotRefs = useRef<(View | null)[]>(
    Array.from({ length: nSlots }, () => null)
  );
  const dropLayouts = useRef<{ x: number; y: number; w: number; h: number }[]>(
    Array.from({ length: nSlots }, () => ({ x: 0, y: 0, w: 0, h: 0 }))
  );

  const pansRef = useRef<Record<string, Animated.ValueXY>>({});
  const slotBorderAnims = useRef(
    Array.from({ length: nSlots }, () => new Animated.Value(0))
  ).current;
  const slotShakeX = useRef(Array.from({ length: nSlots }, () => new Animated.Value(0))).current;
  const slotPulseScale = useRef(Array.from({ length: nSlots }, () => new Animated.Value(1))).current;
  const feedbackBusyRef = useRef(false);
  const firestoreSyncedRef = useRef(false);

  const poolsRemainCount = useMemo(
    () => sessionCategories.reduce((s, c) => s + remainingByCategory[c].length, 0),
    [remainingByCategory, sessionCategories]
  );

  const ensurePan = useCallback((id: string) => {
    if (!pansRef.current[id]) {
      pansRef.current[id] = new Animated.ValueXY({ x: 0, y: 0 });
    }
    return pansRef.current[id];
  }, []);

  const visibleTopRef = useRef(visibleTop);
  visibleTopRef.current = visibleTop;

  const assignInitialTopPositions = useCallback(() => {
    const w = poolLayout.current.w;
    const h = poolLayout.current.h;
    if (!w || !h || visibleTopRef.current.length === 0) return;
    setPositionsById((prev) => {
      const next = { ...prev };
      let changed = false;
      const occupied: { x: number; y: number }[] = [];
      for (const t of visibleTopRef.current) {
        const existing = next[t.instanceId];
        if (existing != null) {
          occupied.push(existing);
          continue;
        }
        const pos = findSpawnTopPosition(w, h, itemSize, occupied, null);
        next[t.instanceId] = pos;
        occupied.push(pos);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [itemSize]);

  useEffect(() => {
    assignInitialTopPositions();
  }, [visibleTop, assignInitialTopPositions]);

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
      await playAudio("sorteaza");
      if (!cancelled) setTrialPromptReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [voiceEnabled]);

  useEffect(() => {
    if (completed) return;
    if (visibleTop.length > 0 || poolsRemainCount > 0) return;
    const t = setTimeout(() => {
      setCompleted(true);
    }, COMPLETION_BRAVO_DELAY_MS);
    return () => clearTimeout(t);
  }, [visibleTop.length, poolsRemainCount, completed]);

  useEffect(() => {
    if (!completed || !sessionId || firestoreSyncedRef.current) return;
    firestoreSyncedRef.current = true;
    void updateDoc(doc(db, "sessions", sessionId), {
      completedAt: serverTimestamp(),
      correctTrials: 1,
      totalTrials: 1,
    });
  }, [completed, sessionId]);

  const measureSlots = useCallback(() => {
    for (let s = 0; s < nSlots; s++) {
      dropSlotRefs.current[s]?.measureInWindow((x, y, w, h) => {
        dropLayouts.current[s] = { x, y, w, h };
      });
    }
  }, [nSlots]);

  const animateReturn = useCallback((instanceId: string) => {
    const pan = pansRef.current[instanceId];
    if (!pan) return;
    Animated.parallel([
      Animated.timing(pan.x, {
        toValue: 0,
        duration: RETURN_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(pan.y, {
        toValue: 0,
        duration: RETURN_DURATION,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const runContainerCorrectFeedback = useCallback(
    (slotIndex: number) => {
      slotBorderAnims[slotIndex].setValue(1);
      slotPulseScale[slotIndex].setValue(1);
      Animated.sequence([
        Animated.timing(slotPulseScale[slotIndex], {
          toValue: 1.06,
          duration: CORRECT_PULSE_MS / 2,
          useNativeDriver: true,
        }),
        Animated.timing(slotPulseScale[slotIndex], {
          toValue: 1,
          duration: CORRECT_PULSE_MS / 2,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        slotBorderAnims[slotIndex].setValue(0);
      }, CORRECT_PULSE_MS);
    },
    [slotBorderAnims, slotPulseScale]
  );

  const runIncorrectFeedback = useCallback(
    (poolInstanceId: string, slotIndex: number) => {
      void playErrorAudio();
      const border = slotBorderAnims[slotIndex];
      const shake = slotShakeX[slotIndex];
      const pan = pansRef.current[poolInstanceId];
      border.setValue(2);
      const panAnim =
        pan != null
          ? Animated.parallel([
              Animated.timing(pan.x, { toValue: 0, duration: RETURN_DURATION, useNativeDriver: false }),
              Animated.timing(pan.y, { toValue: 0, duration: RETURN_DURATION, useNativeDriver: false }),
            ])
          : Animated.timing(new Animated.Value(0), { toValue: 0, duration: 0, useNativeDriver: false });
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shake, {
            toValue: 8,
            duration: SHAKE_DURATION / 4,
            useNativeDriver: false,
          }),
          Animated.timing(shake, {
            toValue: -8,
            duration: SHAKE_DURATION / 4,
            useNativeDriver: false,
          }),
          Animated.timing(shake, {
            toValue: 0,
            duration: SHAKE_DURATION / 4,
            useNativeDriver: false,
          }),
        ]),
        panAnim,
      ]).start(() => {
        border.setValue(0);
        setInteractionLocked(false);
        feedbackBusyRef.current = false;
      });
    },
    [slotBorderAnims, slotShakeX]
  );

  const handleRelease = useCallback(
    (instanceId: string, item: TopItem) =>
      (_: unknown, gestureState: { dx: number; dy: number }) => {
        setActiveDragId(null);
        if (interactionLocked || feedbackBusyRef.current || !trialPromptReady) {
          animateReturn(instanceId);
          return;
        }

        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const pos = positionsById[instanceId];
        if (!pos) {
          animateReturn(instanceId);
          return;
        }

        const pool = poolLayout.current;
        const itemLeft = pool.x + pos.x + dx;
        const itemTop = pool.y + pos.y + dy;
        const cubeScreenX = itemLeft + itemSize / 2;
        const cubeScreenY = itemTop + itemSize / 2;

        let hit: number | null = null;
        for (let s = 0; s < nSlots; s++) {
          const L = dropLayouts.current[s];
          if (!L || L.w < 8) continue;
          if (
            cubeScreenX >= L.x &&
            cubeScreenX <= L.x + L.w &&
            cubeScreenY >= L.y &&
            cubeScreenY <= L.y + L.h
          ) {
            hit = s;
            break;
          }
        }

        if (hit === null) {
          animateReturn(instanceId);
          return;
        }

        const result = tryDrop(item, hit, slotCategoryRef.current, sessionCategories);
        if (!result.ok) {
          feedbackBusyRef.current = true;
          setInteractionLocked(true);
          runIncorrectFeedback(instanceId, hit);
          return;
        }

        const L = dropLayouts.current[hit];
        let relX = itemLeft - L.x;
        let relY = itemTop - L.y;
        relX = clamp(relX, 0, Math.max(0, L.w - itemSize));
        relY = clamp(relY, 0, Math.max(0, L.h - itemSize));

        const z = ++placedZRef.current;
        const placed: PlacedItem = { ...item, relX, relY, zIndex: z };

        void playSuccessAudio();
        feedbackBusyRef.current = true;
        setInteractionLocked(true);
        setSlotCategory(result.nextSlot);
        setPlacedBins((prev) => {
          const next = prev.map((b) => [...b]);
          next[hit!] = [...next[hit!], placed];
          return next;
        });

        const cat = item.categoryId;
        const excludePos = { x: pos.x, y: pos.y };

        setRemainingByCategory((prevR) => {
          const newR = { ...prevR, [cat]: [...prevR[cat]] };
          const nextFromPool = newR[cat].shift() ?? null;

          setVisibleTop((prevV) => {
            const nv = prevV.filter((t) => t.instanceId !== instanceId);
            setPositionsById((pp) => {
              const copy = { ...pp };
              delete copy[instanceId];
              if (nextFromPool) {
                const w = poolLayout.current.w;
                const h = poolLayout.current.h;
                if (w && h) {
                  const existingBoxes = nv
                    .map((t) => copy[t.instanceId] ?? pp[t.instanceId])
                    .filter((p): p is { x: number; y: number } => p != null);
                  copy[nextFromPool.instanceId] = findSpawnTopPosition(
                    w,
                    h,
                    itemSize,
                    existingBoxes,
                    excludePos
                  );
                }
              }
              return copy;
            });
            return nextFromPool ? [...nv, nextFromPool] : nv;
          });

          return newR;
        });

        runContainerCorrectFeedback(hit);
        setTimeout(() => {
          setInteractionLocked(false);
          feedbackBusyRef.current = false;
        }, CORRECT_PULSE_MS + 40);
      },
    [
      interactionLocked,
      trialPromptReady,
      positionsById,
      sessionCategories,
      nSlots,
      animateReturn,
      runIncorrectFeedback,
      itemSize,
      runContainerCorrectFeedback,
    ]
  );

  const panResponders = useMemo(() => {
    return visibleTop.map((item) => {
      const pan = ensurePan(item.instanceId);
      return PanResponder.create({
        onStartShouldSetPanResponder: () =>
          trialPromptReady && activeDragId === null && !interactionLocked && !feedbackBusyRef.current,
        onMoveShouldSetPanResponder: () => activeDragId === item.instanceId,
        onPanResponderGrant: () => setActiveDragId(item.instanceId),
        onPanResponderMove: (_, g) => {
          pan.setValue({ x: g.dx, y: g.dy });
        },
        onPanResponderRelease: handleRelease(item.instanceId, item),
        onPanResponderTerminate: handleRelease(item.instanceId, item),
      });
    });
  }, [visibleTop, trialPromptReady, activeDragId, interactionLocked, ensurePan, handleRelease]);

  const bottomGap = 10;
  const rowWidth = screenWidth * 0.95;
  const slotW = (rowWidth - bottomGap * (nSlots - 1)) / nSlots;

  const renderItemCard = (image: number, size: number, elevated?: boolean) => (
    <View
      style={[
        styles.itemCard,
        {
          width: size,
          height: size,
          borderRadius: ITEM_RADIUS,
          borderWidth: 1,
          borderColor: CARD_BORDER,
          backgroundColor: "#FFFFFF",
          elevation: elevated ? 6 : 3,
          shadowOpacity: elevated ? 0.18 : 0.12,
        },
      ]}
    >
      <Image
        source={normalizeRasterSource(image)}
        style={{
          width: size * 0.88,
          height: size * 0.88,
          borderRadius: ITEM_RADIUS - 3,
        }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        {...(Platform.OS === "web" ? { draggable: false } : {})}
      />
    </View>
  );

  if (completed) {
    return (
      <View style={[styles.root, trialUiRootShellStyle]}>
        <View style={styles.completedRoot}>
          <Text style={styles.completedTitle}>Proba finalizată</Text>
          <Text style={styles.completedSub}>Toate itemele au fost sortate corect.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, trialUiRootShellStyle]}>
      <View style={styles.progressWrap}>
        <Text style={styles.progressText}>1 / 1</Text>
      </View>

      <View style={[styles.topZone, { minHeight: topZoneHeight }]}>
        <View
          ref={poolRef}
          style={StyleSheet.absoluteFill}
          onLayout={() => {
            poolRef.current?.measureInWindow((x, y, w, h) => {
              poolLayout.current = { x, y, w, h };
              assignInitialTopPositions();
            });
          }}
        >
          {visibleTop.map((item, index) => {
            const pos = positionsById[item.instanceId] ?? { x: 0, y: 0 };
            const pan = ensurePan(item.instanceId);
            const dragging = activeDragId === item.instanceId;
            return (
              <Animated.View
                key={item.instanceId}
                style={[
                  styles.draggableWrap,
                  {
                    left: pos.x,
                    top: pos.y,
                    width: itemSize,
                    height: itemSize,
                    zIndex: dragging ? 40 : 2,
                  },
                  {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                  },
                ]}
                {...panResponders[index].panHandlers}
              >
                {renderItemCard(item.image, itemSize, dragging)}
              </Animated.View>
            );
          })}
        </View>
      </View>

      <LinearGradient
        colors={["rgba(44,100,104,0)", "rgba(44,100,104,0.85)", "rgba(44,100,104,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.horizontalDivider}
      />

      <View style={styles.bottomZone}>
        <View style={[styles.dropRow, { width: rowWidth, gap: bottomGap }]}>
          {Array.from({ length: nSlots }, (_, slotIndex) => {
            const label =
              slotCategory[slotIndex] != null ? getLabel(slotCategory[slotIndex]!) : " ";
            const stack = placedBins[slotIndex] ?? [];
            return (
              <View
                key={slotIndex}
                style={[styles.slotCol, { width: slotW, minHeight: itemSize * 2.6 }]}
              >
                <Text style={styles.slotLabel} numberOfLines={2}>
                  {label}
                </Text>
                <Animated.View
                  style={{
                    transform: [{ scale: slotPulseScale[slotIndex] }],
                    width: "100%",
                  }}
                >
                  <Animated.View
                    ref={(el) => {
                      dropSlotRefs.current[slotIndex] = el as unknown as View | null;
                    }}
                    onLayout={() => {
                      measureSlots();
                    }}
                    style={[
                      styles.slotBox,
                      {
                        minHeight: itemSize * 2.2,
                        borderColor: slotBorderAnims[slotIndex].interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: ["rgba(148, 163, 184, 0.85)", "#2ecc71", "#e74c3c"],
                        }),
                      },
                    ]}
                  >
                    <Animated.View
                      style={{
                        flex: 1,
                        width: "100%",
                        minHeight: itemSize * 2,
                        transform: [{ translateX: slotShakeX[slotIndex] }],
                      }}
                    >
                      <View style={styles.binContent}>
                        {stack.map((b) => (
                          <View
                            key={b.instanceId}
                            style={[
                              styles.placedAbsolute,
                              {
                                left: b.relX,
                                top: b.relY,
                                width: itemSize,
                                height: itemSize,
                                zIndex: b.zIndex,
                              },
                            ]}
                          >
                            {renderItemCard(b.image, itemSize)}
                          </View>
                        ))}
                      </View>
                    </Animated.View>
                  </Animated.View>
                </Animated.View>
              </View>
            );
          })}
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
  progressWrap: {
    position: "absolute",
    top: 20,
    left: 24,
    zIndex: 30,
  },
  progressText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
  },
  topZone: {
    flex: 0.5,
    position: "relative",
    marginHorizontal: Spacing.sm,
  },
  draggableWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  itemCard: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  horizontalDivider: {
    height: 2,
    width: "100%",
    marginVertical: 4,
  },
  bottomZone: {
    flex: 0.5,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  dropRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  slotCol: {
    alignItems: "center",
  },
  slotLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 6,
    minHeight: 32,
    fontFamily: Theme.fontFamily.medium,
  },
  slotBox: {
    width: "100%",
    borderRadius: ITEM_RADIUS,
    borderWidth: 2,
    borderStyle: "dashed",
    backgroundColor: Theme.colors.activeBg,
    overflow: "hidden",
  },
  binContent: {
    flex: 1,
    width: "100%",
    minHeight: 40,
    position: "relative",
  },
  placedAbsolute: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  completedRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  completedTitle: {
    fontSize: 20,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  completedSub: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.regular,
    textAlign: "center",
  },
});
