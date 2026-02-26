import ItemSelector from "@/components/ItemSelector";
import ScreenContainer from "@/components/layout/ScreenContainer";
import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { RECEPTIVE_LANGUAGE_OBJECTIVES } from "@/config/objectives";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import type { Stimulus } from "@/features/b1-2d-matching/types";
import { auth, db } from "@/services/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

export default function ReceptiveLanguageRoute() {
  const router = useRouter();
  const { selectedChildId } = useContext(SelectedChildContext);
  const [selectedId, setSelectedId] = useState<number>(100);
  const [categoryId, setCategoryId] = useState<string>("colors");
  const [selectedTargets, setSelectedTargets] = useState<Stimulus[]>([]);
  const [distractorCount, setDistractorCount] = useState(0);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{ id: string; label: string } | null>(null);
  const { width: screenWidth } = useWindowDimensions();
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

  const selectedObjective = RECEPTIVE_LANGUAGE_OBJECTIVES.find((o) => o.id === selectedId);
  const categories = selectedObjective?.categories ?? [];
  const canStart = selectedTargets.length > 0;

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
      router.push({
        pathname: "/trial",
        params: {
          sessionId: sessionRef.id,
          childId: selectedChildId,
          category: categoryId,
          targets: JSON.stringify(selectedTargets.map((t) => t.id)),
          distractorCount: String(distractorCount),
        },
      });
    } catch {
      // do not block navigation
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.sessionContainer}>
        <View style={styles.sessionRow}>
          <View style={styles.sessionCard}>
            <View style={styles.sessionCardHeader}>
              <Text style={styles.sessionCardTitle}>Objectives</Text>
              <View style={styles.cardTitleDivider} />
            </View>
            <ScrollView
              style={styles.columnScroll}
              contentContainerStyle={[
                styles.columnScrollContent,
                { paddingHorizontal: 12, paddingVertical: 8 },
              ]}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {RECEPTIVE_LANGUAGE_OBJECTIVES.map((obj) => {
                const isSelected = obj.id === selectedId;
                const isDisabled = !obj.enabled;
                return (
                  <Pressable
                    key={obj.id}
                    style={({ pressed }) => [
                      styles.rowItem,
                      pressed && styles.rowItemPressed,
                      isSelected && styles.rowItemSelected,
                      isDisabled && styles.objectiveRowDisabled,
                    ]}
                    onPress={() => !isDisabled && setSelectedId(obj.id)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.objectiveNumber,
                        isDisabled && styles.objectiveTextDisabled,
                      ]}
                    >
                      {obj.id}.
                    </Text>
                    <Text
                      style={[
                        styles.objectiveLabel,
                        isDisabled && styles.objectiveTextDisabled,
                      ]}
                      numberOfLines={2}
                    >
                      {obj.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {categories.length > 0 && (
            <>
              <View style={styles.sessionCard}>
                <View style={styles.sessionCardHeader}>
                  <Text style={styles.sessionCardTitle}>Categories</Text>
                  <View style={styles.cardTitleDivider} />
                </View>
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
                            <Text style={styles.configuredText}>Configured</Text>
                          ) : (
                            <Text style={styles.setupText}>Set up</Text>
                          )}
                        </TouchableOpacity>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}

          <View style={styles.sessionCard}>
            <View style={styles.sessionCardHeader}>
              <Text style={styles.sessionCardTitle}>Progress</Text>
              <View style={styles.cardTitleDivider} />
            </View>
            <Text style={styles.placeholderText}>—</Text>
          </View>
        </View>
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
    backgroundColor: "#F4F7F8",
  },
  sessionRow: {
    flex: 1,
    flexDirection: "row",
    gap: 24,
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
    gap: Spacing.sm,
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
    flex: 1,
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
