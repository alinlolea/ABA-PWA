import ScreenContainer from "@/components/layout/ScreenContainer";
import { SelectedChildContext } from "@/contexts/SelectedChildContext";
import { objectiveGridCardDisabledStyle } from "@/design/objectiveCard";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import { auth, db } from "@/config/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { isLabelingObjectiveImplemented } from "@/utils/objectiveTrialAvailability";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useResponsive } from "@/utils/responsive";

const LABELING_OBJECTIVES = [
  {
    id: "numeste-culori",
    title: "Numeste culori",
    description: "Copilul va eticheta verbal culorile prezentate.",
    target: "Rosu, Albastru, Galben, Verde",
  },
];

export default function LabelingRoute() {
  const router = useRouter();
  const { selectedChildId } = useContext(SelectedChildContext);
  const [selectedChildName, setSelectedChildName] = useState<string | null>(null);
  const { rs } = useResponsive();

  useEffect(() => {
    if (!selectedChildId) {
      setSelectedChildName(null);
      return;
    }
    getDoc(doc(db, "children", selectedChildId)).then((snap) => {
      setSelectedChildName(snap.exists() ? (snap.data().name ?? null) : null);
    });
  }, [selectedChildId]);

  const handleCardPress = async (objectiveId: string) => {
    if (!isLabelingObjectiveImplemented(objectiveId)) return;
    if (!selectedChildId) return;
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) return;
    try {
      const sessionRef = await addDoc(collection(db, "sessions"), {
        userId: currentUser.uid,
        childId: selectedChildId,
        startedAt: serverTimestamp(),
        completedAt: null,
        totalTrials: 0,
        correctTrials: 0,
        masteredItems: 0,
        objectives: [{ objectiveId, trials: 0, correct: 0, mastered: false }],
      });
      const childSnap = await getDoc(doc(db, "children", selectedChildId));
      const voiceEnabled = childSnap.exists() ? (childSnap.data().voiceEnabled !== false) : true;
      router.push({
        pathname: "/trial",
        params: {
          sessionId: sessionRef.id,
          objective: objectiveId,
          module: "labeling",
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
          <View style={styles.sessionRow}>
            <View style={styles.mainContentWrap}>
              <View style={[styles.areaHeader, { marginBottom: rs(20) }]}>
                <View style={styles.areaHeaderTitleRow}>
                  <Text style={[styles.areaHeaderTitle, { fontSize: rs(20), marginBottom: rs(2) }]}>
                    Etichetare
                  </Text>
                  <Text style={[styles.selectedChildName, { fontSize: rs(Typography.body) }]}>
                    {selectedChildName ?? ""}
                  </Text>
                </View>
                <Text style={[styles.areaHeaderSubtitle, { fontSize: rs(13), marginBottom: rs(10) }]}>
                  {LABELING_OBJECTIVES.length} obiectiv(e)
                </Text>
                <View style={[styles.areaProgressTrack, { height: rs(4), borderRadius: rs(2) }]}>
                  <View style={[styles.areaProgressFill, { width: "65%", borderRadius: rs(2) }]} />
                </View>
              </View>
              <ScrollView
                style={styles.objectiveGridScroll}
                contentContainerStyle={[
                  styles.objectiveGridScrollContent,
                  {
                    paddingVertical: rs(Spacing.md),
                    paddingHorizontal: rs(Spacing.sm),
                    paddingBottom: rs(24),
                  },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.objectiveGrid, { gap: rs(12) }]}>
                  {LABELING_OBJECTIVES.map((obj) => {
                    const trialOk = isLabelingObjectiveImplemented(obj.id);
                    const isDisabled = !selectedChildId || !trialOk;
                    return (
                    <TouchableOpacity
                      key={obj.id}
                      style={[
                        styles.objectiveGridCard,
                        { padding: rs(14), borderRadius: rs(12) },
                        isDisabled && objectiveGridCardDisabledStyle,
                      ]}
                      onPress={() => {
                        if (isDisabled) return;
                        handleCardPress(obj.id);
                      }}
                      disabled={isDisabled}
                      accessibilityState={{ disabled: isDisabled }}
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
                      <Text
                        style={[styles.objectiveGridCardTitle, { fontSize: rs(15), marginBottom: rs(4) }]}
                        numberOfLines={2}
                      >
                        {obj.title}
                      </Text>
                      <Text
                        style={[styles.objectiveGridCardCategory, { fontSize: rs(13), marginBottom: rs(8) }]}
                        numberOfLines={2}
                      >
                        {obj.description}
                      </Text>
                      <View style={[styles.objectiveGridBadge, { paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(8) }]}>
                        <Text style={[styles.objectiveGridBadgeText, { fontSize: rs(12) }]}>
                          {!trialOk ? "În curând" : `Țintă: ${obj.target}`}
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
  sessionRow: {
    flex: 1,
    flexDirection: "row",
    gap: 24,
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
});
