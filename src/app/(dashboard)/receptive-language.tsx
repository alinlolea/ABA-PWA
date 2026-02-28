import ItemSelector from "@/components/ItemSelector";
import ScreenContainer from "@/components/layout/ScreenContainer";
import { SelectedChildContext } from "@/contexts/SelectedChildContext";
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const RECEPTIVE_OBJECTIVES = [
  { id: "show_common_objects", name: "Arată obiecte comune", processCategory: "Identificare simplă", configurable: true },
  { id: "touch_object_parts", name: "Atinge părți ale obiectelor", processCategory: "Identificare simplă", configurable: false },
  { id: "show_adjectives", name: "Arată adjective", processCategory: "Identificare simplă", configurable: false },
  { id: "show_actions", name: "Arată acțiuni", processCategory: "Identificare simplă", configurable: false },
  { id: "identify_by_function", name: "Identifică obiect după funcție", processCategory: "Conceptual", configurable: false },
  { id: "identify_by_characteristic", name: "Identifică obiect după caracteristică", processCategory: "Conceptual", configurable: false },
  { id: "identify_by_category", name: "Identifică după categorie", processCategory: "Conceptual", configurable: false },
  { id: "show_two_items", name: "Arată 2 itemi", processCategory: "Multi-select", configurable: false },
  { id: "show_two_items_order", name: "Arată 2 itemi în ordine", processCategory: "Secvențiere verbală", configurable: false },
  { id: "identify_jobs", name: "Identifică meserii", processCategory: "Identificare simplă", configurable: false },
  { id: "identify_sounds", name: "Identifică sunete", processCategory: "Auditiv-receptiv", configurable: false },
  { id: "select_all_examples", name: "Selectează toate exemplarele", processCategory: "Multi-select", configurable: false },
  { id: "select_by_two_characteristics", name: "Selectează item după 2 caracteristici", processCategory: "Conceptual", configurable: false },
  { id: "select_all_by_characteristic", name: "Selectează toate obiectele după caracteristică", processCategory: "Conceptual", configurable: false },
  { id: "select_all_by_two_characteristics", name: "Selectează toate obiectele după 2 caracteristici", processCategory: "Conceptual", configurable: false },
  { id: "show_location_images", name: "Arată imagine locație sau activitate", processCategory: "Social-receptiv", configurable: false },
  { id: "show_emotions", name: "Arată emoții", processCategory: "Social-receptiv", configurable: false },
  { id: "identify_same", name: "Identifică la fel", processCategory: "Relațional", configurable: false },
  { id: "identify_different", name: "Identifică diferit", processCategory: "Relațional", configurable: false },
  { id: "identify_non_examples", name: "Identifică non-exemplare", processCategory: "Conceptual", configurable: false },
  { id: "identify_social_images", name: "Identifică imagini sociale", processCategory: "Social-receptiv", configurable: false },
];

const RECEPTIVE_DRAWER_CATEGORIES = [{ id: "common", label: "Obiecte comune" }];

export default function ReceptiveLanguageRoute() {
  const router = useRouter();
  const { selectedChildId } = useContext(SelectedChildContext);
  const [selectedId, setSelectedId] = useState<string | null>("show_common_objects");
  const [categoryId, setCategoryId] = useState<string>("common");
  const [selectedTargets, setSelectedTargets] = useState<Stimulus[]>([]);
  const [distractorCount, setDistractorCount] = useState(0);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{ id: string; label: string } | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [selectedChildName, setSelectedChildName] = useState<string | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const panelWidth = useMemo(() => {
    return Math.min(Math.max(screenWidth * 0.42, 520), 700);
  }, [screenWidth]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedObjective = RECEPTIVE_OBJECTIVES.find((o) => o.id === selectedId);
  const categories = selectedObjective?.configurable ? RECEPTIVE_DRAWER_CATEGORIES : [];
  const canStart = selectedObjective?.configurable ? selectedTargets.length > 0 : !!selectedId;

  useEffect(() => {
    if (!selectedChildId) {
      setSelectedChildName(null);
      return;
    }
    getDoc(doc(db, "children", selectedChildId)).then((snap) => {
      setSelectedChildName(snap.exists() ? (snap.data().name ?? null) : null);
    });
  }, [selectedChildId]);

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
    if (!selectedId) return;
    if (selectedObjective?.configurable && !selectedTargets.length) return;
    const currentUser = auth.currentUser;
    if (!currentUser?.uid || !selectedChildId) return;
    try {
      const sessionRef = await addDoc(collection(db, "sessions"), {
        userId: currentUser.uid,
        childId: selectedChildId,
        startedAt: serverTimestamp(),
        completedAt: null,
        totalTrials: 0,
        correctTrials: 0,
        masteredItems: 0,
        objectives: [{ objectiveId: selectedId, trials: 0, correct: 0, mastered: false }],
      });
      const childSnap = await getDoc(doc(db, "children", selectedChildId));
      const voiceEnabled = childSnap.exists() ? (childSnap.data().voiceEnabled !== false) : true;
      router.push({
        pathname: "/trial",
        params: {
          sessionId: sessionRef.id,
          childId: selectedChildId,
          category: categoryId,
          targets: JSON.stringify((selectedTargets || []).map((t) => t.id)),
          distractorCount: String(distractorCount),
          voiceEnabled: String(voiceEnabled),
        },
      });
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
                <Text style={styles.areaHeaderTitle}>Limbaj receptiv</Text>
                <Text style={styles.selectedChildName}>{selectedChildName ?? ""}</Text>
              </View>
              <Text style={styles.areaHeaderSubtitle}>
                {RECEPTIVE_OBJECTIVES.length} objectives
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
                {RECEPTIVE_OBJECTIVES.map((obj) => {
                  const isSelected = obj.id === selectedId;
                  const configurable = obj.configurable;
                  return (
                    <TouchableOpacity
                      key={obj.id}
                      style={[
                        styles.objectiveGridCard,
                        isSelected && styles.objectiveGridCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedId(obj.id);
                        if (configurable) setIsSetupOpen(true);
                      }}
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
                        style={styles.objectiveGridCardTitle}
                        numberOfLines={2}
                      >
                        {obj.name}
                      </Text>
                      <Text
                        style={styles.objectiveGridCardCategory}
                        numberOfLines={1}
                      >
                        {obj.processCategory}
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

        {isSetupOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={styles.drawerBackdrop} />
            {categories.length > 0 && (
              <View style={[styles.setupDrawer, { width: 300 }]}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.sessionCardTitle}>Categorii</Text>
                  <TouchableOpacity
                    onPress={() => setIsSetupOpen(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={24} color="#1E293B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.drawerCard}>
                  <ScrollView
                    style={styles.columnScroll}
                    contentContainerStyle={[
                      styles.columnScrollContent,
                      { paddingHorizontal: 12, paddingVertical: 8 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
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
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.floatingButtonContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.floatingButton,
            !canStart && styles.floatingButtonDisabled,
          ]}
          onPress={handleStartSesiune}
          disabled={!canStart}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonText}>Start sesiune</Text>
        </TouchableOpacity>
      </View>

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
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EEF0",
  },
  drawerCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
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
  sessionCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 18,
    color: "#1E293B",
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
  categoryRowText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
  },
  categoryRowTextSelected: {
    color: "#2C6468",
    fontWeight: "600",
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
