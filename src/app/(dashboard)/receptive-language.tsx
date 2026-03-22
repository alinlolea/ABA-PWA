import ScreenContainer from "@/components/layout/ScreenContainer";
import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { TouchTarget } from "@/design/touch";
import { Typography } from "@/design/typography";
import {
  RECEPTIVE_CATEGORIES,
  type ReceptiveCategory,
} from "@/features/receptive-language/categories";
import { auth, db } from "@/config/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { useResponsive } from "@/utils/responsive";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import { Menu, Provider as PaperProvider } from "react-native-paper";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SHOW_COMMON_OBJECTS_ID = "show_common_objects";

const RECEPTIVE_OBJECTIVES = [
  { id: SHOW_COMMON_OBJECTS_ID, name: "Arată obiecte comune", processCategory: "Identificare simplă", configurable: true },
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

export default function ReceptiveLanguageRoute() {
  const router = useRouter();
  const { selectedChildId } = useContext(SelectedChildContext);
  const [selectedId, setSelectedId] = useState<string | null>(SHOW_COMMON_OBJECTS_ID);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [selectedChildName, setSelectedChildName] = useState<string | null>(null);
  const { rs } = useResponsive();

  const [selectedCategory, setSelectedCategory] = useState<ReceptiveCategory | null>(null);
  const [itemCount, setItemCount] = useState<number>(1);
  const [distractorCount, setDistractorCount] = useState<number>(0);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const isShowCommonObjects = selectedId === SHOW_COMMON_OBJECTS_ID;

  const canStart = isShowCommonObjects
    ? selectedCategory === "animale_domestice" && itemCount >= 1 && itemCount <= 5
    : Boolean(selectedId);

  const touchMin = Math.max(48, TouchTarget.minSize);

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
    if (!isShowCommonObjects) {
      setSelectedCategory(null);
      setItemCount(1);
      setDistractorCount(0);
    }
  }, [isShowCommonObjects]);

  const bumpItemCount = (delta: number) => {
    setItemCount((c) => Math.min(5, Math.max(1, c + delta)));
  };

  const bumpDistractorCount = (delta: number) => {
    setDistractorCount((c) => Math.min(3, Math.max(0, c + delta)));
  };

  const handleStartSesiune = async () => {
    if (!selectedId) return;
    const currentUser = auth.currentUser;
    if (!currentUser?.uid || !selectedChildId) return;

    if (selectedId === SHOW_COMMON_OBJECTS_ID) {
      if (selectedCategory == null || itemCount < 1) return;
      if (selectedCategory !== "animale_domestice") return;
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
          category: selectedCategory,
          itemCount,
          distractorCount,
          objectiveType: "receptive_show_common_objects",
        });
        const childSnap = await getDoc(doc(db, "children", selectedChildId));
        const voiceEnabled = childSnap.exists() ? (childSnap.data().voiceEnabled !== false) : true;
        router.push({
          pathname: "/trial",
          params: {
            sessionId: sessionRef.id,
            objective: "receptive_show_common_objects",
            category: selectedCategory,
            itemCount: String(itemCount),
            distractorCount: String(distractorCount),
            childId: selectedChildId,
            voiceEnabled: String(voiceEnabled),
          },
        });
      } catch {
        // do not block navigation
      }
      return;
    }

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
          voiceEnabled: String(voiceEnabled),
        },
      });
    } catch {
      // do not block navigation
    }
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        <View style={[styles.sessionContainer, { padding: rs(24) }]}>
          <View style={[styles.sessionRow, { gap: rs(24) }, isSetupOpen && styles.sessionRowDimmed]}>
            <View style={styles.mainContentWrap}>
              <View style={[styles.areaHeader, { marginBottom: rs(20) }]}>
                <View style={styles.areaHeaderTitleRow}>
                  <Text style={[styles.areaHeaderTitle, { fontSize: rs(20), marginBottom: rs(2) }]}>Limbaj receptiv</Text>
                  <Text style={[styles.selectedChildName, { fontSize: rs(Typography.body) }]}>{selectedChildName ?? ""}</Text>
                </View>
                <Text style={[styles.areaHeaderSubtitle, { fontSize: rs(13), marginBottom: rs(10) }]}>
                  {RECEPTIVE_OBJECTIVES.length} objectives
                </Text>
                <View style={[styles.areaProgressTrack, { height: rs(4), borderRadius: rs(2) }]}>
                  <View style={[styles.areaProgressFill, { width: "65%", borderRadius: rs(2) }]} />
                </View>
              </View>
              <ScrollView
                style={styles.objectiveGridScroll}
                contentContainerStyle={[styles.objectiveGridScrollContent, { paddingVertical: rs(Spacing.md), paddingHorizontal: rs(Spacing.sm), paddingBottom: rs(24) }]}
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.objectiveGrid, { gap: rs(12) }]}>
                  {RECEPTIVE_OBJECTIVES.map((obj) => {
                    const isSelected = obj.id === selectedId;
                    const configurable = obj.configurable;
                    return (
                      <TouchableOpacity
                        key={obj.id}
                        style={[
                          styles.objectiveGridCard,
                          { padding: rs(14), borderRadius: rs(12) },
                          isSelected && styles.objectiveGridCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedId(obj.id);
                          if (configurable) setIsSetupOpen(true);
                          else setIsSetupOpen(false);
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
                          style={[styles.objectiveGridCardTitle, { fontSize: rs(15), marginBottom: rs(4) }]}
                          numberOfLines={2}
                        >
                          {obj.name}
                        </Text>
                        <Text
                          style={[styles.objectiveGridCardCategory, { fontSize: rs(13), marginBottom: rs(8) }]}
                          numberOfLines={1}
                        >
                          {obj.processCategory}
                        </Text>
                        <View style={[styles.objectiveGridBadge, { paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(8) }]}>
                          <Text style={[styles.objectiveGridBadgeText, { fontSize: rs(12) }]}>
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
        </View>

        {isSetupOpen && selectedId === SHOW_COMMON_OBJECTS_ID && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={styles.drawerBackdrop} />
            <View style={[styles.setupDrawer, { width: "42%", minWidth: rs(360), maxWidth: rs(520), paddingTop: rs(16), paddingHorizontal: rs(16) }]}>
              <View style={[styles.drawerHeader, { marginBottom: rs(12), paddingBottom: rs(12) }]}>
                <View style={{ flex: 1, paddingRight: rs(8) }}>
                  <Text style={[styles.drawerTitle, { fontSize: rs(18) }]}>Arată obiecte comune</Text>
                  <Text style={[styles.drawerSubtitle, { fontSize: rs(13), marginTop: rs(4) }]}>
                    Alege categoria și parametrii sesiunii
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsSetupOpen(false)}
                  hitSlop={{ top: rs(12), bottom: rs(12), left: rs(12), right: rs(12) }}
                  style={{ minWidth: rs(touchMin), minHeight: rs(touchMin), justifyContent: "center", alignItems: "center" }}
                  accessibilityLabel="Închide configurarea"
                >
                  <Ionicons name="close" size={rs(24)} color="#1E293B" />
                </TouchableOpacity>
              </View>

              <PaperProvider>
                <ScrollView
                  style={styles.configScroll}
                  contentContainerStyle={{ paddingBottom: rs(Spacing.xl) }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={[styles.sectionLabel, { fontSize: rs(14), marginBottom: rs(Spacing.sm) }]}>Categorie</Text>
                  <View style={{ marginBottom: rs(Spacing.lg) }}>
                    <Menu
                      visible={categoryMenuVisible}
                      onDismiss={() => setCategoryMenuVisible(false)}
                      anchor={
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Selectează categoria"
                          activeOpacity={0.85}
                          onPress={() => setCategoryMenuVisible(true)}
                          style={[
                            styles.categoryDropdownTrigger,
                            {
                              minHeight: rs(touchMin),
                              paddingVertical: rs(Spacing.md),
                              paddingHorizontal: rs(Spacing.md),
                              borderRadius: rs(12),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryDropdownText,
                              { fontSize: rs(16) },
                              selectedCategory == null && styles.categoryDropdownPlaceholder,
                            ]}
                            numberOfLines={1}
                          >
                            {selectedCategory == null
                              ? "Selectează categoria"
                              : (RECEPTIVE_CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? "")}
                          </Text>
                          <Ionicons name="chevron-down" size={rs(22)} color="#475569" />
                        </TouchableOpacity>
                      }
                      contentStyle={{ marginTop: rs(4) }}
                    >
                      {RECEPTIVE_CATEGORIES.map(({ key, label }) => {
                        const disabled = key !== "animale_domestice";
                        return (
                          <Menu.Item
                            key={key}
                            disabled={disabled}
                            onPress={() => {
                              if (disabled) return;
                              setSelectedCategory(key);
                              setCategoryMenuVisible(false);
                            }}
                            title={label}
                            titleStyle={[
                              { fontSize: rs(16) },
                              disabled && styles.menuItemDisabled,
                            ]}
                          />
                        );
                      })}
                    </Menu>
                    <Text style={[styles.categoryHelperText, { fontSize: rs(13), marginTop: rs(Spacing.sm) }]}>
                      Momentan disponibil doar: Animale domestice
                    </Text>
                  </View>

                  <Text style={[styles.sectionLabel, { fontSize: rs(14), marginBottom: rs(Spacing.sm) }]}>
                    Număr itemi (țintă) — 1–5
                  </Text>
                  <View style={[styles.rowStepper, { marginBottom: rs(Spacing.lg), gap: rs(Spacing.sm) }]}>
                    <TouchableOpacity
                      style={[
                        styles.stepperBtn,
                        { minWidth: rs(touchMin), minHeight: rs(touchMin), borderRadius: rs(12) },
                        itemCount <= 1 && styles.stepperBtnDisabled,
                      ]}
                      onPress={() => bumpItemCount(-1)}
                      disabled={itemCount <= 1}
                      accessibilityLabel="Scade numărul de itemi"
                    >
                      <Ionicons name="remove" size={rs(22)} color={itemCount <= 1 ? "#94A3B8" : "#1E293B"} />
                    </TouchableOpacity>
                    <View style={[styles.valuePill, { minHeight: rs(touchMin), paddingHorizontal: rs(Spacing.lg), borderRadius: rs(12) }]}>
                      <Text style={[styles.valuePillText, { fontSize: rs(18) }]}>{itemCount}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.stepperBtn,
                        { minWidth: rs(touchMin), minHeight: rs(touchMin), borderRadius: rs(12) },
                        itemCount >= 5 && styles.stepperBtnDisabled,
                      ]}
                      onPress={() => bumpItemCount(1)}
                      disabled={itemCount >= 5}
                      accessibilityLabel="Crește numărul de itemi"
                    >
                      <Ionicons name="add" size={rs(22)} color={itemCount >= 5 ? "#94A3B8" : "#1E293B"} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.sectionLabel, { fontSize: rs(14), marginBottom: rs(Spacing.sm) }]}>
                    Distractori — 0–3
                  </Text>
                  <View style={[styles.rowStepper, { marginBottom: rs(Spacing.md), gap: rs(Spacing.sm) }]}>
                    <TouchableOpacity
                      style={[
                        styles.stepperBtn,
                        { minWidth: rs(touchMin), minHeight: rs(touchMin), borderRadius: rs(12) },
                        distractorCount <= 0 && styles.stepperBtnDisabled,
                      ]}
                      onPress={() => bumpDistractorCount(-1)}
                      disabled={distractorCount <= 0}
                      accessibilityLabel="Scade distractorii"
                    >
                      <Ionicons name="remove" size={rs(22)} color={distractorCount <= 0 ? "#94A3B8" : "#1E293B"} />
                    </TouchableOpacity>
                    <View style={[styles.valuePill, { minHeight: rs(touchMin), paddingHorizontal: rs(Spacing.lg), borderRadius: rs(12) }]}>
                      <Text style={[styles.valuePillText, { fontSize: rs(18) }]}>{distractorCount}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.stepperBtn,
                        { minWidth: rs(touchMin), minHeight: rs(touchMin), borderRadius: rs(12) },
                        distractorCount >= 3 && styles.stepperBtnDisabled,
                      ]}
                      onPress={() => bumpDistractorCount(1)}
                      disabled={distractorCount >= 3}
                      accessibilityLabel="Crește distractorii"
                    >
                      <Ionicons name="add" size={rs(22)} color={distractorCount >= 3 ? "#94A3B8" : "#1E293B"} />
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </PaperProvider>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.floatingButtonContainer, { bottom: rs(32) }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.floatingButton,
            { paddingVertical: rs(14), paddingHorizontal: rs(40), borderRadius: rs(14), minHeight: rs(touchMin) },
            !canStart && styles.floatingButtonDisabled,
          ]}
          onPress={handleStartSesiune}
          disabled={!canStart}
          activeOpacity={0.8}
        >
          <Text style={[styles.floatingButtonText, { fontSize: rs(14) }]}>Start sesiune</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5EEF0",
  },
  drawerTitle: {
    fontWeight: "700",
    color: "#1E293B",
  },
  drawerSubtitle: {
    color: Colors.textSecondary,
  },
  configScroll: {
    flex: 1,
  },
  sectionLabel: {
    fontWeight: "600",
    color: "#1E293B",
  },
  categoryDropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  categoryDropdownText: {
    flex: 1,
    fontWeight: "600",
    color: "#1E293B",
  },
  categoryDropdownPlaceholder: {
    fontWeight: "500",
    color: "#94A3B8",
  },
  menuItemDisabled: {
    opacity: 0.5,
    color: "#94A3B8",
  },
  categoryHelperText: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  rowStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  stepperBtn: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepperBtnDisabled: {
    opacity: 0.55,
  },
  valuePill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 72,
  },
  valuePillText: {
    fontWeight: "700",
    color: "#1E293B",
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
});
