/**
 * Sortare itemi non-identici — single trial, drag from top pool to 3 bottom bins.
 */

import { db } from "@/config/firebase";
import { Spacing } from "@/design/spacing";
import { Theme } from "@/design/theme";
import {
  getSortPool,
  SORT_CATEGORY_LABELS,
  type SortCategoryId,
  type SortPoolItem,
} from "@/features/sort-non-identical/sortNonIdenticalAssets";
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
import { playAudio } from "@/utils/audio";
import { normalizeRasterSource } from "@/utils/rasterImageSource";
import { trialUiRootShellStyle } from "@/utils/trialUiShell";
import { stopSpeech } from "@/utils/speech";

const RETURN_DURATION = 220;
const SHAKE_DURATION = 280;
const INCORRECT_SECOND_AUDIO_DELAY_MS = 500;
const COMPLETION_BRAVO_DELAY_MS = 450;
const ITEM_RADIUS = 14;
const DROP_PAD_RATIO = 0.05;

type SessionItem = {
  instanceId: string;
  categoryId: SortCategoryId;
  id: string;
  image: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickThreePerCategory(cats: SortCategoryId[]): SessionItem[] {
  const out: SessionItem[] = [];
  let counter = 0;
  for (const cat of cats) {
    const pool = getSortPool(cat);
    const picked: SortPoolItem[] = shuffle(pool).slice(0, 3);
    for (const p of picked) {
      out.push({
        instanceId: `${cat}-${p.id}-${counter++}`,
        categoryId: cat,
        id: p.id,
        image: p.image,
      });
    }
  }
  return shuffle(out);
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
  slotCategory: (SortCategoryId | null)[],
  sessionCats: SortCategoryId[]
): boolean {
  if (slotCategory[slotIndex] !== null) return true;
  const assigned = slotCategory.filter(Boolean).length;
  if (sessionCats.length === 2 && assigned === 2) return false;
  return true;
}

function applyAutoAssign(
  next: (SortCategoryId | null)[],
  sessionCats: SortCategoryId[]
): void {
  const empty = [0, 1, 2].filter((i) => next[i] == null);
  const used = new Set(next.filter(Boolean) as SortCategoryId[]);
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
  item: SessionItem,
  slotIndex: number,
  slotCategory: (SortCategoryId | null)[],
  sessionCats: SortCategoryId[]
): { ok: true; nextSlot: (SortCategoryId | null)[] } | { ok: false } {
  const next = [...slotCategory];

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

function randomPositionsForItems(
  count: number,
  poolW: number,
  poolH: number,
  itemSize: number
): { x: number; y: number }[] {
  const pad = DROP_PAD_RATIO * Math.min(poolW, poolH);
  const maxX = Math.max(pad, poolW - itemSize - pad);
  const maxY = Math.max(pad, poolH - itemSize - pad);
  const minX = pad;
  const minY = pad;
  const positions: { x: number; y: number }[] = [];
  const maxTries = 60;
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let t = 0; t < maxTries && !placed; t++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const overlaps = positions.some((p) =>
        rectsOverlap(x, y, itemSize, p.x, p.y, itemSize)
      );
      if (!overlaps) {
        positions.push({ x, y });
        placed = true;
      }
    }
    if (!placed) {
      const fx = minX + (i % 5) * (itemSize * 0.35);
      const fy = minY + Math.floor(i / 5) * (itemSize * 0.35);
      positions.push({
        x: Math.min(fx, maxX),
        y: Math.min(fy, maxY),
      });
    }
  }
  return positions;
}

type Props = {
  sessionId: string;
  sessionCategories: SortCategoryId[];
  voiceEnabled?: boolean;
};

export default function SortNonIdenticalTrial({
  sessionId,
  sessionCategories,
  voiceEnabled = true,
}: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const itemSize = Math.min(100, Math.max(72, screenWidth * 0.09));
  const topZoneHeight = screenHeight * 0.48;

  const [sessionItems] = useState<SessionItem[]>(() => pickThreePerCategory(sessionCategories));
  const [topItems, setTopItems] = useState<SessionItem[]>(() => [...sessionItems]);
  const [bins, setBins] = useState<SessionItem[][]>(() => [[], [], []]);
  const [slotCategory, setSlotCategory] = useState<(SortCategoryId | null)[]>(() => [
    null,
    null,
    null,
  ]);
  const slotCategoryRef = useRef(slotCategory);
  slotCategoryRef.current = slotCategory;

  const [positionsById, setPositionsById] = useState<Record<string, { x: number; y: number }>>({});
  const positionsInitRef = useRef(false);
  const [completed, setCompleted] = useState(false);
  const [trialPromptReady, setTrialPromptReady] = useState(!voiceEnabled);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [interactionLocked, setInteractionLocked] = useState(false);

  const poolRef = useRef<View | null>(null);
  const poolLayout = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dropSlotRefs = useRef<(View | null)[]>([null, null, null]);
  const dropLayouts = useRef<{ x: number; y: number; w: number; h: number }[]>([
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
  ]);

  const pansRef = useRef<Record<string, Animated.ValueXY>>({});
  const slotBorderAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const slotShakeX = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const feedbackBusyRef = useRef(false);

  const firestoreSyncedRef = useRef(false);

  const ensurePan = useCallback((id: string) => {
    if (!pansRef.current[id]) {
      pansRef.current[id] = new Animated.ValueXY({ x: 0, y: 0 });
    }
    return pansRef.current[id];
  }, []);

  const topItemsRef = useRef(topItems);
  topItemsRef.current = topItems;

  const initPositionsOnce = useCallback(() => {
    if (positionsInitRef.current) return;
    const w = poolLayout.current.w;
    const h = poolLayout.current.h;
    if (!w || !h || topItemsRef.current.length === 0) return;
    positionsInitRef.current = true;
    const pos = randomPositionsForItems(topItemsRef.current.length, w, h, itemSize);
    const map: Record<string, { x: number; y: number }> = {};
    topItemsRef.current.forEach((it, i) => {
      map[it.instanceId] = pos[i] ?? { x: 0, y: 0 };
    });
    setPositionsById(map);
  }, [itemSize]);

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
    if (topItems.length > 0 || completed) return;
    const t = setTimeout(() => {
      void playAudio("bravo");
      setCompleted(true);
    }, COMPLETION_BRAVO_DELAY_MS);
    return () => clearTimeout(t);
  }, [topItems.length, completed]);

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
    for (let s = 0; s < 3; s++) {
      dropSlotRefs.current[s]?.measureInWindow((x, y, w, h) => {
        dropLayouts.current[s] = { x, y, w, h };
      });
    }
  }, []);

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

  const randomizePosition = useCallback(
    (instanceId: string) => {
      const w = poolLayout.current.w || screenWidth;
      const h = poolLayout.current.h || topZoneHeight;
      const others = topItems.filter((t) => t.instanceId !== instanceId);
      const otherPos = others.map((t) => positionsById[t.instanceId]).filter(Boolean) as {
        x: number;
        y: number;
      }[];
      const pad = DROP_PAD_RATIO * Math.min(w, h);
      const maxX = Math.max(pad, w - itemSize - pad);
      const maxY = Math.max(pad, h - itemSize - pad);
      let tries = 0;
      let nx = pad;
      let ny = pad;
      while (tries++ < 50) {
        nx = pad + Math.random() * (maxX - pad);
        ny = pad + Math.random() * (maxY - pad);
        const overlaps = otherPos.some((p) =>
          rectsOverlap(nx, ny, itemSize, p.x, p.y, itemSize)
        );
        if (!overlaps) break;
      }
      setPositionsById((prev) => ({ ...prev, [instanceId]: { x: nx, y: ny } }));
    },
    [topItems, positionsById, screenWidth, topZoneHeight, itemSize]
  );

  const runIncorrectFeedback = useCallback(
    (poolInstanceId: string, slotIndex: number) => {
      void (async () => {
        await playAudio("gresit");
        await new Promise<void>((r) => setTimeout(r, INCORRECT_SECOND_AUDIO_DELAY_MS));
        await playAudio("mai_incearca");
      })();
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
        randomizePosition(poolInstanceId);
        setInteractionLocked(false);
        feedbackBusyRef.current = false;
      });
    },
    [randomizePosition, slotBorderAnims, slotShakeX]
  );

  const handleRelease = useCallback(
    (instanceId: string, item: SessionItem) =>
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
        const cubeScreenX = pool.x + pos.x + itemSize / 2 + dx;
        const cubeScreenY = pool.y + pos.y + itemSize / 2 + dy;

        let hit: number | null = null;
        for (let s = 0; s < 3; s++) {
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

        void playAudio("bravo");
        feedbackBusyRef.current = true;
        setInteractionLocked(true);
        setSlotCategory(result.nextSlot);
        setBins((prev) => {
          const next = prev.map((b) => [...b]);
          next[hit!] = [...next[hit!], item];
          return next;
        });
        setTopItems((prev) => prev.filter((t) => t.instanceId !== instanceId));
        slotBorderAnims[hit].setValue(1);
        setTimeout(() => {
          slotBorderAnims[hit].setValue(0);
          setInteractionLocked(false);
          feedbackBusyRef.current = false;
        }, 450);
      },
    [
      interactionLocked,
      trialPromptReady,
      positionsById,
      sessionCategories,
      animateReturn,
      runIncorrectFeedback,
      itemSize,
      slotBorderAnims,
    ]
  );

  const panResponders = useMemo(() => {
    return topItems.map((item) => {
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
  }, [topItems, trialPromptReady, activeDragId, interactionLocked, ensurePan, handleRelease]);

  const bottomGap = 10;
  const slotW = (screenWidth * 0.92 - bottomGap * 2) / 3;

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
              initPositionsOnce();
            });
          }}
        >
          {topItems.map((item, index) => {
            const pos = positionsById[item.instanceId] ?? { x: 0, y: 0 };
            const pan = ensurePan(item.instanceId);
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
                    zIndex: activeDragId === item.instanceId ? 20 : 1,
                  },
                  {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                  },
                ]}
                {...panResponders[index].panHandlers}
              >
                <View
                  style={[
                    styles.cardOuter,
                    {
                      width: itemSize,
                      height: itemSize,
                      borderRadius: ITEM_RADIUS,
                    },
                  ]}
                >
                  <Image
                    source={normalizeRasterSource(item.image)}
                    style={{
                      width: itemSize * 0.92,
                      height: itemSize * 0.92,
                      borderRadius: ITEM_RADIUS - 2,
                    }}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                    {...(Platform.OS === "web" ? { draggable: false } : {})}
                  />
                </View>
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
        <View style={[styles.dropRow, { width: screenWidth * 0.95, gap: bottomGap }]}>
          {[0, 1, 2].map((slotIndex) => {
            const label =
              slotCategory[slotIndex] != null
                ? SORT_CATEGORY_LABELS[slotCategory[slotIndex]!]
                : " ";
            const stack = bins[slotIndex];
            return (
              <View
                key={slotIndex}
                style={[styles.slotCol, { width: slotW, minHeight: itemSize * 2.4 }]}
              >
                <Text style={styles.slotLabel} numberOfLines={2}>
                  {label}
                </Text>
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
                      minHeight: itemSize * 2,
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
                      transform: [{ translateX: slotShakeX[slotIndex] }],
                    }}
                  >
                    <View style={styles.stackInner}>
                      {stack.map((b, bi) => {
                        const rot = bi % 2 === 0 ? "4deg" : "-5deg";
                        const ox = (bi % 3) * 4 - 4;
                        const oy = -bi * 6;
                        return (
                          <View
                            key={b.instanceId}
                            style={[
                              styles.stackItem,
                              {
                                zIndex: bi + 1,
                                transform: [{ translateX: ox }, { translateY: oy }, { rotate: rot }],
                              },
                            ]}
                          >
                            <Image
                              source={normalizeRasterSource(b.image)}
                              style={{
                                width: itemSize * 0.88,
                                height: itemSize * 0.88,
                                borderRadius: ITEM_RADIUS - 2,
                              }}
                              resizeMode="contain"
                              accessibilityIgnoresInvertColors
                              {...(Platform.OS === "web" ? { draggable: false } : {})}
                            />
                          </View>
                        );
                      })}
                    </View>
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
  cardOuter: {
    backgroundColor: Theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
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
    flex: 1,
    width: "100%",
    borderRadius: ITEM_RADIUS,
    borderWidth: 2,
    borderStyle: "dashed",
    backgroundColor: Theme.colors.activeBg,
    overflow: "visible",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 8,
  },
  stackInner: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 40,
    position: "relative",
  },
  stackItem: {
    position: "absolute",
    bottom: 0,
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
