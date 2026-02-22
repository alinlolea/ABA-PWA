import ScreenContainer from "@/components/layout/ScreenContainer";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Stepper from "@/components/ui/Stepper";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import { MOCK_STIMULI } from "@/features/b1-2d-matching/mockStimuli";
import type { Stimulus } from "@/features/b1-2d-matching/types";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

type CategoryKey = "colors" | "shapes" | "objects";

const STIMULI_BY_CATEGORY: Record<CategoryKey, Stimulus[]> = {
  colors: MOCK_STIMULI.slice(0, 4),
  shapes: MOCK_STIMULI.slice(4, 8),
  objects: MOCK_STIMULI.slice(8, 12),
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  colors: "Culori",
  shapes: "Forme",
  objects: "Obiecte",
};

const MAX_TARGETS = 3;
const MAX_BOTTOM_ITEMS = 6;
const DISTRACTOR_MAX = 3;

type Objective = {
  id: number;
  label: string;
  enabled: boolean;
};

const OBJECTIVES: Objective[] = [
  { id: 1, label: "Potriviri 2D la 2D", enabled: true },
  { id: 2, label: "Sortare itemi non-identici", enabled: false },
  { id: 3, label: "Construcție cuburi peste model", enabled: false },
  { id: 4, label: "Construcție cuburi la fel", enabled: false },
  { id: 5, label: "Reproducere pattern", enabled: false },
  { id: 6, label: "Continuare pattern", enabled: false },
  { id: 7, label: "Asociere logică imagini", enabled: false },
  { id: 8, label: "Sortare după funcție", enabled: false },
  { id: 9, label: "Sortare după caracteristică", enabled: false },
  { id: 10, label: "Sortare pe categorie", enabled: false },
  { id: 11, label: "Găsește item dispărut", enabled: false },
  { id: 12, label: "Reproduce secvență obiecte", enabled: false },
  { id: 13, label: "Ordonează după criteriu", enabled: false },
  { id: 14, label: "Aranjare cronologică", enabled: false },
];

export default function Dashboard() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number>(1);
  const [category, setCategory] = useState<CategoryKey>("colors");
  const [selectedTargets, setSelectedTargets] = useState<Stimulus[]>([]);
  const [distractorCount, setDistractorCount] = useState(0);

  const selected = OBJECTIVES.find((o) => o.id === selectedId);
  const isActive = selected?.enabled ?? false;

  const categoryStimuli = useMemo(() => STIMULI_BY_CATEGORY[category], [category]);
  const distractorMax = Math.min(DISTRACTOR_MAX, Math.max(0, MAX_BOTTOM_ITEMS - selectedTargets.length));
  const canStart = selectedTargets.length > 0;

  useEffect(() => {
    if (distractorCount > distractorMax) {
      setDistractorCount(distractorMax);
    }
  }, [distractorMax, distractorCount]);

  const handleCategoryChange = (next: CategoryKey) => {
    setCategory(next);
    setSelectedTargets([]);
    setDistractorCount(0);
  };

  const handleTargetPress = (stimulus: Stimulus) => {
    setSelectedTargets((prev) => {
      const idx = prev.findIndex((s) => s.id === stimulus.id);
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      if (prev.length >= MAX_TARGETS) return prev;
      return [...prev, stimulus];
    });
  };

  const handleDistractorChange = (value: number) => {
    const max = Math.min(DISTRACTOR_MAX, MAX_BOTTOM_ITEMS - selectedTargets.length);
    setDistractorCount(Math.min(Math.max(0, value), max));
  };

  const handleStartSesiune = () => {
    if (!canStart) return;
    router.push({
      pathname: "/trial",
      params: {
        category,
        targets: JSON.stringify(selectedTargets.map((t) => t.id)),
        distractorCount: distractorCount.toString(),
      },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.dashboard}>
          <View style={styles.leftPanel}>
            <Text style={styles.leftPanelHeader}>Obiective</Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              {OBJECTIVES.map((obj) => {
                const isSelected = obj.id === selectedId;
                const isDisabled = !obj.enabled;
                return (
                  <Pressable
                    key={obj.id}
                    style={[
                      styles.objectiveRow,
                      isSelected && styles.objectiveRowSelected,
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
                      {obj.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.rightPanel}
            contentContainerStyle={styles.rightPanelContent}
            showsVerticalScrollIndicator={true}
          >
            {isActive ? (
              <>
                <Text style={styles.panelTitle}>{selected?.label}</Text>
                <View style={styles.titleDivider} />

                <Text style={styles.configLabel}>Categorie</Text>
                <View style={styles.segmentRow}>
                  {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => (
                    <Pressable
                      key={key}
                      style={[
                        styles.segmentButton,
                        category === key && styles.segmentButtonSelected,
                      ]}
                      onPress={() => handleCategoryChange(key)}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          category === key && styles.segmentButtonTextSelected,
                        ]}
                      >
                        {CATEGORY_LABELS[key]}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.configLabel}>Obiecte țintă (max {MAX_TARGETS})</Text>
                <View style={styles.targetGrid}>
                  {categoryStimuli.map((stimulus) => {
                    const isSelected = selectedTargets.some((s) => s.id === stimulus.id);
                    const color = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
                    return (
                      <Pressable
                        key={stimulus.id}
                        style={[
                          styles.targetItem,
                          isSelected && styles.targetItemSelected,
                          { backgroundColor: color },
                        ]}
                        onPress={() => handleTargetPress(stimulus)}
                      />
                    );
                  })}
                </View>

                <Text style={styles.configLabel}>
                  Adaugă număr de distractori
                </Text>
                <View style={styles.stepperSection}>
                  <Stepper
                    value={distractorCount}
                    min={0}
                    max={distractorMax}
                    onChange={handleDistractorChange}
                  />
                </View>
                <View style={styles.buttonSpacer}>
                  {canStart ? (
                    <PrimaryButton
                      title="Start sesiune"
                      onPress={handleStartSesiune}
                    />
                  ) : (
                    <View style={styles.buttonDisabled}>
                      <Text style={styles.buttonDisabledText}>Start sesiune</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.placeholderText}>În dezvoltare</Text>
                <View style={styles.buttonDisabled}>
                  <Text style={styles.buttonDisabledText}>Start sesiune</Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dashboard: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: "28%",
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
    padding: Spacing.lg,
    backgroundColor: Colors.panelSubtle,
  },
  leftPanelHeader: {
    fontSize: Typography.subtitle,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  objectiveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: Spacing.sm,
  },
  objectiveRowSelected: {
    backgroundColor: Colors.selectedHighlight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
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
  rightPanel: {
    flex: 1,
  },
  rightPanelContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  panelTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 32,
  },
  titleDivider: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.xxl,
  },
  configLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonSelected: {
    backgroundColor: Colors.selectedHighlight,
    borderColor: Colors.accent,
  },
  segmentButtonText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  segmentButtonTextSelected: {
    color: Colors.accent,
    fontWeight: "600",
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  targetItem: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  targetItemSelected: {
    borderColor: Colors.accent,
    borderWidth: 3,
  },
  stepperSection: {
    marginBottom: Spacing.xl,
  },
  buttonSpacer: {
    marginTop: 24,
    width: "100%",
  },
  placeholderText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    width: "100%",
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
    minHeight: 54,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    opacity: 0.7,
  },
  buttonDisabledText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
    fontWeight: "600",
  },
});
