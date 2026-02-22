import ScreenContainer from "@/components/layout/ScreenContainer";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Stepper from "@/components/ui/Stepper";
import { OBJECTIVES } from "@/config/objectives";
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
  useWindowDimensions,
} from "react-native";

const GRID_COLUMNS = 6;
const COLOR_CIRCLE_MIN = 30;
const COLOR_CIRCLE_MAX = 40;
const COLOR_GRID_GAP = 24;

type CategoryKey = "colors" | "shapes" | "objects";

const COLORS_DATA: { id: string; label: string; hex: string }[] = [
  { id: "color-red", label: "Roșu", hex: "#E53935" },
  { id: "color-green", label: "Verde", hex: "#43A047" },
  { id: "color-blue", label: "Albastru", hex: "#1E88E5" },
  { id: "color-yellow", label: "Galben", hex: "#FDD835" },
  { id: "color-orange", label: "Portocaliu", hex: "#FB8C00" },
  { id: "color-purple", label: "Mov", hex: "#8E24AA" },
  { id: "color-pink", label: "Roz", hex: "#EC407A" },
  { id: "color-brown", label: "Maro", hex: "#6D4C41" },
  { id: "color-black", label: "Negru", hex: "#212121" },
  { id: "color-white", label: "Alb", hex: "#FAFAFA" },
  { id: "color-gray", label: "Gri", hex: "#757575" },
  { id: "color-beige", label: "Bej", hex: "#D7C4A3" },
];

const COLORS_AS_STIMULI: Stimulus[] = COLORS_DATA.map((c) => ({
  id: c.id,
  label: c.label,
  image: c.hex,
}));

const STIMULI_BY_CATEGORY: Record<CategoryKey, Stimulus[]> = {
  colors: COLORS_AS_STIMULI,
  shapes: MOCK_STIMULI.slice(4, 8),
  objects: MOCK_STIMULI.slice(8, 12),
};

const MAX_TARGETS = 3;
const MAX_BOTTOM_ITEMS = 6;
const DISTRACTOR_MAX = 3;

export default function Dashboard() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<string>("colors");
  const [selectedTargets, setSelectedTargets] = useState<Stimulus[]>([]);
  const [distractorCount, setDistractorCount] = useState(0);

  const selectedObjective = OBJECTIVES.find((o) => o.id === selectedId);
  const isActive = selectedObjective?.enabled ?? false;
  const categories = selectedObjective?.categories ?? [];
  const selectedCategoryLabel = categories.find((c) => c.id === categoryId)?.label ?? "";

  const categoryStimuli = useMemo(() => {
    if (categoryId && categoryId in STIMULI_BY_CATEGORY) {
      return STIMULI_BY_CATEGORY[categoryId as CategoryKey];
    }
    return [];
  }, [categoryId]);
  const distractorMax = Math.min(DISTRACTOR_MAX, Math.max(0, MAX_BOTTOM_ITEMS - selectedTargets.length));
  const canStart = selectedTargets.length > 0;

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
      setSelectedTargets([]);
      setDistractorCount(0);
    }
  }, [selectedId, categories, categoryId]);

  useEffect(() => {
    if (distractorCount > distractorMax) {
      setDistractorCount(distractorMax);
    }
  }, [distractorMax, distractorCount]);

  const handleCategoryChange = (nextId: string) => {
    setCategoryId(nextId);
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
        category: categoryId,
        targets: JSON.stringify(selectedTargets.map((t) => t.id)),
        distractorCount: distractorCount.toString(),
      },
    });
  };

  const configColumnWidth = screenWidth * (categories.length > 0 ? 0.55 : 0.75);
  const gridPadding = Spacing.xl;
  const isColorsCategory = categoryId === "colors";
  const colorCircleDiameter = Math.min(
    COLOR_CIRCLE_MAX,
    Math.max(
      COLOR_CIRCLE_MIN,
      Math.floor((configColumnWidth - gridPadding * 2 - COLOR_GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS - 24 - COLOR_GRID_GAP)
    )
  );
  const colorCellWidth = colorCircleDiameter + 24;
  const colorGridWidth = colorCellWidth * GRID_COLUMNS + COLOR_GRID_GAP * (GRID_COLUMNS - 1);
  const gridGap = isColorsCategory ? COLOR_GRID_GAP : Spacing.sm;
  const gridInnerWidth = Math.max(0, configColumnWidth - gridPadding * 2 - gridGap * (GRID_COLUMNS - 1));
  const gridItemSize = Math.min(
    Math.max(56, Math.floor(gridInnerWidth / GRID_COLUMNS - gridGap)),
    96
  );
  const targetGridWidth = isColorsCategory
    ? colorGridWidth
    : gridItemSize * GRID_COLUMNS + gridGap * (GRID_COLUMNS - 1);

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <View style={styles.dashboard}>
          <View style={styles.objectivesColumn}>
            <Text style={styles.columnHeader}>Obiective</Text>
            <ScrollView
              style={styles.columnScroll}
              contentContainerStyle={styles.columnScrollContent}
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
                      {obj.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <View style={styles.columnDivider} />

          {categories.length > 0 && (
            <>
              <View style={styles.categoriesColumn}>
                <Text style={styles.columnHeader}>Categorii</Text>
                <ScrollView
                  style={styles.columnScroll}
                  contentContainerStyle={styles.columnScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {categories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryRow,
                          isSelected && styles.categoryRowSelected,
                        ]}
                        onPress={() => handleCategoryChange(cat.id)}
                      >
                        <Text
                          style={[
                            styles.categoryRowText,
                            isSelected && styles.categoryRowTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={styles.columnDivider} />
            </>
          )}

          <ScrollView
            style={[
              styles.configColumn,
              categories.length > 0 && styles.configColumnFixed,
            ]}
            contentContainerStyle={styles.configColumnContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.configInner}>
              {isActive ? (
                <>
                  <View style={styles.headerSection}>
                    <Text style={styles.panelTitle}>{selectedObjective?.title}</Text>
                    {selectedCategoryLabel ? (
                      <Text style={styles.panelSubtitle}>{selectedCategoryLabel}</Text>
                    ) : null}
                    <View style={styles.titleDivider} />
                  </View>

                  <Text style={styles.configLabel}>Obiecte țintă (max {MAX_TARGETS})</Text>
                  {isColorsCategory ? (
                    <View style={styles.targetGridWrap}>
                      <View
                        style={[
                          styles.targetGrid,
                          { gap: gridGap, width: targetGridWidth },
                        ]}
                      >
                        {categoryStimuli.map((stimulus) => {
                          const isSelected = selectedTargets.some((s) => s.id === stimulus.id);
                          const colorHex = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
                          return (
                            <Pressable
                              key={stimulus.id}
                              style={[styles.colorCell, { width: colorCellWidth }]}
                              onPress={() => handleTargetPress(stimulus)}
                            >
                              <View
                                style={[
                                  styles.colorCircle,
                                  {
                                    width: colorCircleDiameter,
                                    height: colorCircleDiameter,
                                    borderRadius: 999,
                                    backgroundColor: colorHex,
                                    borderWidth: 2,
                                    borderColor: isSelected ? Colors.accent : Colors.border,
                                  },
                                ]}
                              />
                              <Text style={styles.colorLabel} numberOfLines={1}>
                                {stimulus.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.targetGridScroll}
                      contentContainerStyle={[
                        styles.targetGrid,
                        { gap: gridGap, width: targetGridWidth },
                      ]}
                      showsVerticalScrollIndicator={true}
                    >
                      {categoryStimuli.map((stimulus) => {
                        const isSelected = selectedTargets.some((s) => s.id === stimulus.id);
                        const color = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
                        return (
                          <Pressable
                            key={stimulus.id}
                            style={[
                              styles.targetItem,
                              isSelected && styles.targetItemSelected,
                              { width: gridItemSize, height: gridItemSize, backgroundColor: color },
                            ]}
                            onPress={() => handleTargetPress(stimulus)}
                          />
                        );
                      })}
                    </ScrollView>
                  )}

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
                  <View style={styles.buttonSpacer}>
                    <View style={styles.buttonDisabled}>
                      <Text style={styles.buttonDisabledText}>Start sesiune</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
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
  objectivesColumn: {
    width: "25%",
    flexShrink: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.panelSubtle,
  },
  categoriesColumn: {
    width: "20%",
    flexShrink: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.panelSubtle,
  },
  columnDivider: {
    width: 1,
    backgroundColor: Colors.divider,
  },
  columnHeader: {
    fontSize: Typography.subtitle,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  columnScroll: {
    flex: 1,
  },
  columnScrollContent: {
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
  categoryRow: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  categoryRowSelected: {
    backgroundColor: Colors.selectedHighlight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  categoryRowText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  categoryRowTextSelected: {
    color: Colors.accent,
    fontWeight: "600",
  },
  configColumn: {
    flex: 1,
  },
  configColumnFixed: {
    width: "55%",
    flexShrink: 0,
  },
  configColumnContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  configInner: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  headerSection: {
    maxHeight: "15%",
    marginBottom: Spacing.md,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  panelSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  titleDivider: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  configLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  targetGridWrap: {
    marginBottom: Spacing.xl,
  },
  targetGridScroll: {
    marginBottom: Spacing.xl,
    maxHeight: 320,
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  colorCell: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  colorCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  colorLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 4,
    textAlign: "center",
  },
  targetItem: {
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
    alignSelf: "center",
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
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    opacity: 0.7,
  },
  buttonDisabledText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
    fontWeight: "600",
  },
});
