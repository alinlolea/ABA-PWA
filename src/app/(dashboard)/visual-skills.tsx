import ItemSelector from "@/components/ItemSelector";
import Stepper from "@/components/ui/Stepper";
import ScreenContainer from "@/components/layout/ScreenContainer";
import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { OBJECTIVES } from "@/config/objectives";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import type { Stimulus } from "@/features/b1-2d-matching/types";
import { auth, db } from "@/services/firebaseConfig";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";

function getMaxRepetitions(patternLength: number): number {
  switch (patternLength) {
    case 2:
      return 7;
    case 3:
      return 4;
    case 4:
      return 3;
    default:
      return 3;
  }
}

export default function VisualSkillsRoute() {
  const router = useRouter();
  const { selectedChildId } = useContext(SelectedChildContext);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<string>("colors");
  const [selectedTargets, setSelectedTargets] = useState<Stimulus[]>([]);
  const [distractorCount, setDistractorCount] = useState(0);
  const [towerNumberOfItems, setTowerNumberOfItems] = useState(3);
  const [towerNumberOfDistractors, setTowerNumberOfDistractors] = useState(1);
  const [patternLength, setPatternLength] = useState(2);
  const [patternRepetitions, setPatternRepetitions] = useState(2);
  const [visibleRepetitions, setVisibleRepetitions] = useState<number>(1);
  const [patternNumberOfDistractors, setPatternNumberOfDistractors] = useState(0);
  const [patternUseColors, setPatternUseColors] = useState(true);
  const [patternUseShapes, setPatternUseShapes] = useState(false);
  const [patternStructure, setPatternStructure] = useState<"free" | "alternating">("free");
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{ id: string; label: string } | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [shouldRenderDrawer, setShouldRenderDrawer] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const [selectedChildName, setSelectedChildName] = useState<string | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    if (!selectedChildId) {
      setSelectedChildName(null);
      return;
    }
    getDoc(doc(db, "children", selectedChildId)).then((snap) => {
      setSelectedChildName(snap.exists() ? (snap.data().name ?? null) : null);
    });
  }, [selectedChildId]);
  const panelWidth = useMemo(() => {
    return Math.min(Math.max(screenWidth * 0.42, 520), 700);
  }, [screenWidth]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectorVisible) {
      slideAnim.setValue(panelWidth);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [selectorVisible, panelWidth, slideAnim]);

  const closePanel = () => {
    Animated.timing(slideAnim, {
      toValue: panelWidth,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => setSelectorVisible(false));
  };

  const selectedObjective = OBJECTIVES.find((o) => o.id === selectedId);
  const categories = selectedObjective?.categories ?? [];
  const isTowerObjective = selectedObjective?.trialType === "tower_over_model";
  const isTowerCopyObjective = selectedObjective?.trialType === "tower-copy";
  const isPatternReproductionObjective = selectedObjective?.trialType === "pattern-reproduction";
  const isPatternContinuationObjective = selectedObjective?.trialType === "pattern-continuation";
  const patternValid = patternLength * patternRepetitions <= 14;
  const patternStimuliValid = patternUseColors || patternUseShapes;
  const totalItems = patternLength && patternRepetitions
    ? patternLength * patternRepetitions
    : 0;
  const isPatternInvalid = totalItems > 14;

  useEffect(() => {
    if (visibleRepetitions >= patternRepetitions) {
      setVisibleRepetitions(Math.max(1, patternRepetitions - 1));
    }
  }, [patternRepetitions]);

  const canStart =
    isTowerObjective ||
    isTowerCopyObjective ||
    (isPatternReproductionObjective ? patternValid && patternStimuliValid : false) ||
    (isPatternContinuationObjective ? patternValid && patternStimuliValid : false) ||
    selectedTargets.length > 0;

  useEffect(() => {
    if (isSetupOpen) {
      setShouldRenderDrawer(true);
      Animated.timing(drawerAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else if (shouldRenderDrawer) {
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShouldRenderDrawer(false);
      });
    }
  }, [isSetupOpen]);

  const drawerWidth = screenWidth * 0.37;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10,

      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0) {
          const progress = 1 - gesture.dx / drawerWidth;
          drawerAnim.setValue(Math.max(0, progress));
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > drawerWidth * 0.35) {
          setIsSetupOpen(false);
        } else {
          Animated.timing(drawerAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
      setSelectedTargets([]);
      setDistractorCount(0);
    }
  }, [selectedId, categories, categoryId]);

  const handleCategoryChange = (nextId: string) => {
    setCategoryId(nextId);
    setSelectedTargets([]);
    setDistractorCount(0);
  };

  const openSelector = (cat: { id: string; label: string }) => {
    setActiveCategory(cat);
    if (cat.id !== categoryId) {
      setCategoryId(cat.id);
      setSelectedTargets([]);
      setDistractorCount(0);
    }
    setSelectorVisible(true);
  };

  const handleStartSesiune = async () => {
    if (!canStart) return;
    const currentUser = auth.currentUser;
    if (!currentUser?.uid || !selectedChildId) return;
    const selectedObjectives = [selectedId];
    try {
      const sessionRef = await addDoc(collection(db, "sessions"), {
        userId: currentUser.uid,
        childId: selectedChildId,
        startedAt: serverTimestamp(),
        completedAt: null,
        totalTrials: 0,
        correctTrials: 0,
        masteredItems: 0,
        objectives: selectedObjectives.map((id) => ({
          objectiveId: id,
          trials: 0,
          correct: 0,
          mastered: false,
        })),
      });
      const childSnap = await getDoc(doc(db, "children", selectedChildId));
      const voiceEnabled = childSnap.exists() ? (childSnap.data().voiceEnabled !== false) : true;
      const baseParams: Record<string, string> = {
        sessionId: sessionRef.id,
        childId: selectedChildId,
        voiceEnabled: String(voiceEnabled),
      };
      if (isTowerObjective) {
        router.push({
          pathname: "/trial",
          params: {
            ...baseParams,
            trialType: "tower_over_model",
            numberOfItems: String(towerNumberOfItems),
            numberOfDistractors: String(towerNumberOfDistractors),
          },
        });
      } else if (isTowerCopyObjective) {
        router.push({
          pathname: "/trial",
          params: {
            ...baseParams,
            trialType: "tower-copy",
            numberOfItems: String(towerNumberOfItems),
            numberOfDistractors: String(towerNumberOfDistractors),
          },
        });
      } else if (isPatternReproductionObjective) {
        router.push({
          pathname: "/trial",
          params: {
            ...baseParams,
            trialType: "pattern-reproduction",
            patternLength: String(patternLength),
            repetitions: String(patternRepetitions),
            numberOfDistractors: String(patternNumberOfDistractors),
            useColors: String(patternUseColors),
            useShapes: String(patternUseShapes),
            patternStructure: patternStructure,
          },
        });
      } else if (isPatternContinuationObjective) {
        router.push({
          pathname: "/trial",
          params: {
            ...baseParams,
            trialType: "pattern-continuation",
            patternLength: String(patternLength),
            repetitions: String(patternRepetitions),
            visibleRepetitions: String(visibleRepetitions),
            numberOfDistractors: String(patternNumberOfDistractors),
            useColors: String(patternUseColors),
            useShapes: String(patternUseShapes),
            patternStructure: patternStructure,
          },
        });
      } else {
        router.push({
          pathname: "/trial",
          params: {
            ...baseParams,
            category: categoryId,
            targets: JSON.stringify(selectedTargets.map((t) => t.id)),
            distractorCount: String(distractorCount),
          },
        });
      }
    } catch {
      // do not block navigation
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.sessionContainer}>
        <View style={[styles.sessionRow, isSetupOpen && styles.sessionRowDimmed]}>
          <View style={styles.mainContentWrap}>
            <View style={styles.areaHeader}>
              <View style={styles.areaHeaderTitleRow}>
                <Text style={styles.areaHeaderTitle}>Discriminare vizuală</Text>
                <Text style={styles.selectedChildName}>{selectedChildName ?? ""}</Text>
              </View>
              <Text style={styles.areaHeaderSubtitle}>
                {OBJECTIVES.length} objectives
              </Text>
              <View style={styles.areaProgressTrack}>
                <View style={[styles.areaProgressFill, { width: "65%" }]} />
              </View>
            </View>
            <ScrollView
              style={styles.objectiveGridScroll}
              contentContainerStyle={styles.objectiveGridScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.objectiveGrid}>
              {OBJECTIVES.map((obj) => {
                const isSelected = obj.id === selectedId;
                const isDisabled = !obj.enabled;
                const configurable = obj.categories.length > 0 || obj.trialType === "tower_over_model" || obj.trialType === "tower-copy" || obj.trialType === "pattern-reproduction" || obj.trialType === "pattern-continuation";
                const processCategory =
                  obj.categories.length > 0
                    ? obj.categories.map((c) => c.label).join(", ")
                    : "—";
                return (
                  <TouchableOpacity
                    key={obj.id}
                    style={[
                      styles.objectiveGridCard,
                      isSelected && styles.objectiveGridCardSelected,
                      isDisabled && styles.objectiveGridCardDisabled,
                    ]}
                    onPress={() => {
                      if (isDisabled) return;
                      setSelectedId(obj.id);
                      if (obj.categories.length > 0 || obj.trialType === "tower_over_model" || obj.trialType === "tower-copy" || obj.trialType === "pattern-reproduction" || obj.trialType === "pattern-continuation") setIsSetupOpen(true);
                    }}
                    disabled={isDisabled}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardAccentWrapper}>
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
                        style={styles.cardAccentLine}
                      />
                    </View>
                    {isSelected && (
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
                        style={styles.cardLeftAccent}
                      />
                    )}
                    <Text
                      style={[
                        styles.objectiveGridCardTitle,
                        isDisabled && styles.objectiveTextDisabled,
                      ]}
                      numberOfLines={2}
                    >
                      {obj.title}
                    </Text>
                    <Text
                      style={[
                        styles.objectiveGridCardCategory,
                        isDisabled && styles.objectiveTextDisabled,
                      ]}
                      numberOfLines={1}
                    >
                      {processCategory}
                    </Text>
                    <View style={styles.objectiveGridBadge}>
                      <Text style={styles.objectiveGridBadgeText}>
                        {configurable ? "⚙ Configurabil" : "Standard"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              </View>
            </ScrollView>
          </View>
        </View>

        {shouldRenderDrawer && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={() => setIsSetupOpen(false)}>
              <Animated.View
                style={[
                  styles.drawerBackdrop,
                  {
                    opacity: drawerAnim,
                  },
                ]}
              />
            </TouchableWithoutFeedback>
            {(isTowerObjective || isTowerCopyObjective) ? (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.setupDrawer,
                  { width: 300 },
                  {
                    transform: [
                      {
                        translateX: drawerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.drawerContainer}>
                  <View style={styles.drawerHeader}>
                    <View style={styles.drawerHeaderTextContainer}>
                      <Text style={styles.drawerTitle}>Configurare</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.drawerCloseButton}
                      onPress={() => setIsSetupOpen(false)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close" size={24} color="#1E293B" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                  <ScrollView
                    style={styles.drawerScroll}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.drawerCard}>
                      <View style={{ paddingHorizontal: 12, paddingVertical: 16, gap: 16 }}>
                        <View>
                          <Text style={styles.towerConfigLabel}>Număr cuburi (2–5)</Text>
                          <Stepper
                            value={towerNumberOfItems}
                            min={2}
                            max={5}
                            onChange={setTowerNumberOfItems}
                          />
                        </View>
                        <View>
                          <Text style={styles.towerConfigLabel}>Distractori (0–4)</Text>
                          <Stepper
                            value={towerNumberOfDistractors}
                            min={0}
                            max={4}
                            onChange={setTowerNumberOfDistractors}
                          />
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                  <LinearGradient
                    colors={["rgba(244,247,248,1)", "rgba(244,247,248,0)"]}
                    style={styles.drawerFadeTopScroll}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={["rgba(244,247,248,0)", "rgba(244,247,248,1)"]}
                    style={styles.drawerFadeBottomScroll}
                    pointerEvents="none"
                  />
                  </View>
                  <View style={styles.drawerFooter}>
                    <TouchableOpacity
                      style={[
                        styles.floatingButton,
                        !canStart && styles.floatingButtonDisabled,
                        isPatternInvalid && { opacity: 0.5 },
                      ]}
                      onPress={handleStartSesiune}
                      disabled={!canStart || isPatternInvalid}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.floatingButtonText}>Start sesiune</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ) : (isPatternReproductionObjective || isPatternContinuationObjective) ? (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.setupDrawer,
                  { width: screenWidth * 0.4 },
                  {
                    transform: [
                      {
                        translateX: drawerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [screenWidth * 0.4, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.drawerContainer}>
                  <View style={styles.drawerHeader}>
                    <View style={styles.drawerHeaderTextContainer}>
                      <Text style={styles.drawerTitle}>Configurare</Text>
                      <Text style={styles.drawerSubtitle}>
                        Configurează dificultatea exercițiului
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.drawerCloseButton}
                      onPress={() => setIsSetupOpen(false)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close" size={24} color="#1E293B" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                  <ScrollView
                    style={styles.drawerScroll}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Structură pattern</Text>
                      <View style={{ flexDirection: "row", gap: 20, marginBottom: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.towerConfigLabel}>Lungime pattern (2–4)</Text>
                          <Stepper
                            value={patternLength}
                            min={2}
                            max={4}
                            onChange={setPatternLength}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.towerConfigLabel}>
                            Repetiții (2–{getMaxRepetitions(patternLength)})
                          </Text>
                          <Stepper
                            value={patternRepetitions}
                            min={2}
                            max={getMaxRepetitions(patternLength)}
                            onChange={setPatternRepetitions}
                          />
                        </View>
                      </View>
                      <View style={{ marginTop: 12, marginBottom: 16 }}>
                        <Text style={styles.totalLabel}>Total itemi</Text>
                        <Text
                          style={[
                            styles.totalValue,
                            { color: totalItems > 14 ? "#D32F2F" : "#2C6468" },
                          ]}
                        >
                          {totalItems} din 14
                        </Text>
                      </View>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={styles.towerConfigLabel}>Distractori (0–3)</Text>
                        <Stepper
                          value={patternNumberOfDistractors}
                          min={0}
                          max={3}
                          onChange={setPatternNumberOfDistractors}
                        />
                      </View>
                      {!patternValid && (
                        <Text style={[styles.patternValidationText, { marginTop: 4 }]}>
                          Lungime × Repetiții trebuie să fie ≤ 14
                        </Text>
                      )}
                    </View>
                    <LinearGradient
                      colors={[
                        "rgba(44,100,104,0)",
                        "rgba(44,100,104,0.9)",
                        "rgba(44,100,104,0)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.sectionGradientDivider}
                      pointerEvents="none"
                    />
                    {isPatternContinuationObjective && (
                      <>
                        <View style={styles.sectionCard}>
                          <Text style={styles.sectionTitle}>Nivel suport</Text>
                          <View style={{ marginBottom: 10 }}>
                            <Text style={styles.towerConfigLabel}>Repetiții afișate ca model</Text>
                            <Stepper
                              value={visibleRepetitions}
                              min={1}
                              max={Math.max(1, patternRepetitions - 1)}
                              onChange={setVisibleRepetitions}
                            />
                          </View>
                        <Text style={{ marginTop: 4, fontSize: 12, color: "#64748B" }}>
                          Copilul va completa {patternRepetitions - visibleRepetitions} repetiții.
                        </Text>
                      </View>
                        <LinearGradient
                          colors={[
                            "rgba(44,100,104,0)",
                            "rgba(44,100,104,0.9)",
                            "rgba(44,100,104,0)",
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.sectionGradientDivider}
                          pointerEvents="none"
                        />
                      </>
                    )}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Stimuli</Text>
                      <View style={{ marginBottom: 10 }}>
                      <Pressable
                        style={({ pressed }) => [styles.patternCheckboxRow, pressed && styles.patternCheckboxRowPressed]}
                        onPress={() => setPatternUseColors((v) => !v)}
                      >
                        <Ionicons
                          name={patternUseColors ? "checkbox" : "square-outline"}
                          size={22}
                          color={patternUseColors ? "#2C6468" : "#64748B"}
                        />
                        <Text style={styles.patternCheckboxLabel}>Culori</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.patternCheckboxRow, pressed && styles.patternCheckboxRowPressed]}
                        onPress={() => setPatternUseShapes((v) => !v)}
                      >
                        <Ionicons
                          name={patternUseShapes ? "checkbox" : "square-outline"}
                          size={22}
                          color={patternUseShapes ? "#2C6468" : "#64748B"}
                        />
                        <Text style={styles.patternCheckboxLabel}>Forme</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.patternCheckboxRow, styles.patternCheckboxRowDisabled]}
                        disabled={true}
                      >
                        <Ionicons name="square-outline" size={22} color="#94A3B8" />
                        <Text style={[styles.patternCheckboxLabel, styles.patternCheckboxLabelDisabled]}>
                          Imagini
                        </Text>
                        <Text style={styles.patternCheckboxSoon}>În curând</Text>
                      </Pressable>
                      </View>
                      {!patternStimuliValid && (
                        <Text style={[styles.patternValidationText, { marginTop: 12 }]}>
                          Selectați cel puțin un tip de stimuli
                        </Text>
                      )}
                      {patternUseColors && patternUseShapes && (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.towerConfigLabel}>Structură pattern</Text>
                          <Pressable
                            style={({ pressed }) => [styles.patternCheckboxRow, pressed && styles.patternCheckboxRowPressed]}
                            onPress={() => setPatternStructure("free")}
                          >
                            <Ionicons
                              name={patternStructure === "free" ? "radio-button-on" : "radio-button-off"}
                              size={22}
                              color={patternStructure === "free" ? "#2C6468" : "#64748B"}
                            />
                            <Text style={styles.patternCheckboxLabel}>Liber</Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [styles.patternCheckboxRow, pressed && styles.patternCheckboxRowPressed]}
                            onPress={() => setPatternStructure("alternating")}
                          >
                            <Ionicons
                              name={patternStructure === "alternating" ? "radio-button-on" : "radio-button-off"}
                              size={22}
                              color={patternStructure === "alternating" ? "#2C6468" : "#64748B"}
                            />
                            <Text style={styles.patternCheckboxLabel}>Alternanță strictă</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                  <LinearGradient
                    colors={["rgba(244,247,248,1)", "rgba(244,247,248,0)"]}
                    style={styles.drawerFadeTopScroll}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={["rgba(244,247,248,0)", "rgba(244,247,248,1)"]}
                    style={styles.drawerFadeBottomScroll}
                    pointerEvents="none"
                  />
                  </View>
                  <View style={styles.drawerFooter}>
                    <TouchableOpacity
                      style={[
                        styles.drawerStartButton,
                        (!canStart || isPatternInvalid) && styles.drawerStartButtonDisabled,
                      ]}
                      onPress={handleStartSesiune}
                      disabled={!canStart || isPatternInvalid}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.drawerStartButtonText}>Start sesiune</Text>
                    </TouchableOpacity>
                    {isPatternInvalid && (
                      <Text
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "#D32F2F",
                        }}
                      >
                        Depășește limita maximă de 14 itemi.
                      </Text>
                    )}
                  </View>
                </View>
              </Animated.View>
            ) : categories.length > 0 ? (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.setupDrawer,
                  { width: 300 },
                  {
                    transform: [
                      {
                        translateX: drawerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.drawerContainer}>
                  <View style={styles.drawerHeader}>
                    <View style={styles.drawerHeaderTextContainer}>
                      <Text style={styles.drawerTitle}>Categorii</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.drawerCloseButton}
                      onPress={() => setIsSetupOpen(false)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close" size={24} color="#1E293B" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                  <ScrollView
                    style={styles.drawerScroll}
                    contentContainerStyle={[
                      styles.columnScrollContent,
                      { paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 24 },
                    ]}
                    showsVerticalScrollIndicator={false}
                  >
                    {categories.map((cat) => {
                      const isSelected = categoryId === cat.id;
                      const isConfigured = isSelected && selectedTargets.length > 0;
                      return (
                        <Pressable
                          key={cat.id}
                          style={({ pressed }) => [
                            styles.rowItem,
                            pressed && styles.rowItemPressed,
                            isSelected && styles.rowItemSelected,
                          ]}
                          onPress={() => handleCategoryChange(cat.id)}
                        >
                          <View style={styles.categoryRowContent}>
                            <Text
                              style={[
                                styles.categoryRowText,
                                isSelected && styles.categoryRowTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {cat.label}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => openSelector(cat)}>
                            {isConfigured ? (
                              <Text style={styles.configuredText}>Configurat</Text>
                            ) : (
                              <Text style={styles.setupText}>Configurează</Text>
                            )}
                          </TouchableOpacity>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <LinearGradient
                    colors={["rgba(244,247,248,1)", "rgba(244,247,248,0)"]}
                    style={styles.drawerFadeTopScroll}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={["rgba(244,247,248,0)", "rgba(244,247,248,1)"]}
                    style={styles.drawerFadeBottomScroll}
                    pointerEvents="none"
                  />
                  </View>
                  <View style={styles.drawerFooter}>
                    <TouchableOpacity
                      style={[
                        styles.floatingButton,
                        !canStart && styles.floatingButtonDisabled,
                        isPatternInvalid && { opacity: 0.5 },
                      ]}
                      onPress={handleStartSesiune}
                      disabled={!canStart || isPatternInvalid}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.floatingButtonText}>Start sesiune</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </View>
        )}
      </View>

      {selectedObjective && !selectedObjective.requiresConfig && (
        <View style={styles.floatingButtonContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.floatingButton,
              !canStart && styles.floatingButtonDisabled,
              isPatternInvalid && { opacity: 0.5 },
            ]}
            onPress={handleStartSesiune}
            disabled={!canStart || isPatternInvalid}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonText}>Start sesiune</Text>
          </TouchableOpacity>
          {isPatternInvalid && (
            <Text
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#D32F2F",
              }}
            >
              Depășește limita maximă de 14 itemi.
            </Text>
          )}
        </View>
      )}

      <Modal
        visible={selectorVisible}
        animationType="none"
        transparent
        onRequestClose={closePanel}
      >
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePanel}
          />
          {selectorVisible && activeCategory && (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.sidePanelContainer,
                {
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: panelWidth,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <ItemSelector
                  category={activeCategory}
                  selectedTargets={selectedTargets}
                  setSelectedTargets={setSelectedTargets}
                  distractorCount={distractorCount}
                  setDistractorCount={setDistractorCount}
                  onClose={closePanel}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sessionContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F2F5F7",
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  setupDrawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  drawerHeaderTextContainer: {
    alignItems: "flex-start",
    flex: 1,
    paddingRight: 48,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  drawerCloseButton: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#FFFFFF",
  },
  drawerFadeTop: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    height: 40,
  },
  drawerFadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 72,
    height: 40,
  },
  drawerFadeTopScroll: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  drawerFadeBottomScroll: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  drawerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  sectionCard: {
    backgroundColor: "transparent",
    padding: 16,
    marginBottom: 0,
  },
  sectionGradientDivider: {
    height: 2,
    width: "100%",
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#7A8A8D",
    marginBottom: 16,
    textTransform: "uppercase",
  },
  totalLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    marginTop: 0,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  drawerSubtitle: {
    fontSize: 13,
    color: "#8A9A9D",
    marginTop: 4,
  },
  drawerStartButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2C6468",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  drawerStartButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  drawerStartButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sessionRow: {
    flex: 1,
    flexDirection: "row",
    gap: 24,
  },
  sessionRowDimmed: {
    opacity: 0.85,
  },
  mainContentWrap: {
    flex: 1,
  },
  objectiveGridScroll: {
    flex: 1,
  },
  objectiveGridScrollContent: {
    paddingBottom: 24,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionCardHeader: {
    marginBottom: 16,
  },
  sessionCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 18,
    color: "#1E293B",
  },
  cardTitleDivider: {
    height: 1,
    backgroundColor: "#E5EEF0",
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  areaHeader: {
    marginBottom: 20,
  },
  areaHeaderTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  selectedChildName: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  areaHeaderSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  areaProgressTrack: {
    height: 4,
    backgroundColor: "#E5EEF0",
    borderRadius: 2,
    overflow: "hidden",
  },
  areaProgressFill: {
    height: "100%",
    backgroundColor: "#2C6468",
    borderRadius: 2,
  },
  cardAccentWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: "hidden",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardAccentLine: {
    flex: 1,
  },
  objectiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  objectiveGridCard: {
    width: "48%",
    minWidth: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 0,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  objectiveGridCardSelected: {},
  cardLeftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  objectiveGridCardDisabled: {
    opacity: 0.6,
  },
  objectiveGridCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  objectiveGridCardCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  objectiveGridBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(44,100,104,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  objectiveGridBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2C6468",
  },
  columnScroll: {
    flex: 1,
  },
  columnScrollContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    gap: 20,
  },
  rowItemPressed: {
    backgroundColor: "rgba(44,100,104,0.08)",
  },
  rowItemSelected: {
    backgroundColor: "rgba(44,100,104,0.14)",
  },
  objectiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EEF0",
    marginVertical: 6,
    gap: Spacing.sm,
  },
  objectiveRowSelected: {
    backgroundColor: "rgba(44,100,104,0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#2C6468",
  },
  objectiveRowDisabled: {
    opacity: 0.6,
  },
  objectiveNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    minWidth: 20,
  },
  objectiveLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  objectiveTextDisabled: {
    color: Colors.textSecondary,
  },
  categoryRowContent: {
    flexShrink: 0,
  },
  setupText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2C6468",
  },
  configuredText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#16A34A",
  },
  categoryRowSelected: {
    backgroundColor: "rgba(44,100,104,0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#2C6468",
  },
  categoryRowText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
  },
  categoryRowTextSelected: {
    color: "#2C6468",
    fontWeight: "600",
  },
  towerConfigLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
  },
  patternValidationText: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 4,
  },
  patternCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingRight: 8,
  },
  patternCheckboxRowPressed: {
    opacity: 0.7,
  },
  patternCheckboxRowDisabled: {
    opacity: 0.6,
  },
  patternCheckboxLabel: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  patternCheckboxLabelDisabled: {
    color: "#94A3B8",
  },
  patternCheckboxSoon: {
    fontSize: 11,
    color: "#94A3B8",
  },
  placeholderText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  floatingButton: {
    backgroundColor: "#2C6468",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  floatingButtonDisabled: {
    opacity: 0.5,
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sidePanelContainer: {
    minWidth: 520,
    maxWidth: 700,
    height: "100%",
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
});
