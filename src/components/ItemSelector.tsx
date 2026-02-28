import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import { STIMULI_BY_CATEGORY, type CategoryKey } from "@/features/b1-2d-matching/stimuliByCategory";
import type { Stimulus } from "@/features/b1-2d-matching/types";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Rect, Polygon, Ellipse } from "react-native-svg";

const GRID_COLUMNS = 6;
const COLOR_CIRCLE_MIN = 30;
const COLOR_CIRCLE_MAX = 40;
const COLOR_GRID_GAP = 24;

const MAX_TARGETS = 3;
const MAX_BOTTOM_ITEMS = 6;
const DISTRACTOR_MAX = 3;
const SHAPE_FILL = "#4B5563";

function isShapeStimulus(image: unknown): image is { type: "shape"; form: string; fill: string } {
  return (
    typeof image === "object" &&
    image !== null &&
    "type" in image &&
    (image as { type: string }).type === "shape"
  );
}

function isSvgStimulus(
  image: unknown
): image is { type: "svg"; icon: React.ComponentType<{ width?: number; height?: number; color?: string }> } {
  return (
    typeof image === "object" &&
    image !== null &&
    "type" in image &&
    "icon" in image &&
    (image as { type: string }).type === "svg"
  );
}

const PLACEHOLDER_CATEGORY_IDS = ["fruits", "vegetables", "animals", "vehicles", "food", "objects"];
function isPlaceholderCategory(categoryId: string): boolean {
  return PLACEHOLDER_CATEGORY_IDS.includes(categoryId);
}

const CATEGORY_ID_TO_ENGLISH: Record<string, string> = {
  colors: "Colors",
  shapes: "Shapes",
  fruits: "Fruits",
  vegetables: "Vegetables",
  animals: "Animals",
  vehicles: "Vehicles",
  food: "Food",
  objects: "Objects",
};

function ShapeThumb({
  form,
  size,
  fill,
  borderWidth,
  borderColor,
}: {
  form: string;
  size: number;
  fill: string;
  borderWidth: number;
  borderColor: string;
}) {
  const s = size;
  const h = size / 2;

  if (form === "circle") {
    return (
      <Svg width={s} height={s}>
        <Circle cx={h} cy={h} r={h} fill={fill} />
      </Svg>
    );
  }
  if (form === "square") {
    return (
      <Svg width={s} height={s}>
        <Rect width={s} height={s} fill={fill} />
      </Svg>
    );
  }
  if (form === "triangle") {
    return (
      <Svg width={s} height={s}>
        <Polygon points={`${h},0 ${s},${s} 0,${s}`} fill={fill} />
      </Svg>
    );
  }
  if (form === "rectangle") {
    return (
      <Svg width={s} height={s}>
        <Rect width={s} height={s * 0.6} x={0} y={(s - s * 0.6) / 2} fill={fill} />
      </Svg>
    );
  }
  if (form === "oval") {
    const ry = (s * 0.6) / 2;
    return (
      <Svg width={s} height={s}>
        <Ellipse cx={h} cy={h} rx={h} ry={ry} fill={fill} />
      </Svg>
    );
  }
  if (form === "diamond") {
    return (
      <Svg width={s} height={s}>
        <Polygon
          points={`${h},0 ${s},${h} ${h},${s} 0,${h}`}
          fill={fill}
        />
      </Svg>
    );
  }
  if (form === "star") {
    const starPoints = `${h},0 ${s * 0.62},${s * 0.38} ${s},${s * 0.38} ${s * 0.69},${s * 0.62} ${s * 0.81},${s} ${h},${s * 0.75} ${s * 0.19},${s} ${s * 0.31},${s * 0.62} 0,${s * 0.38} ${s * 0.38},${s * 0.38}`;
    return (
      <Svg width={s} height={s}>
        <Polygon points={starPoints} fill={fill} />
      </Svg>
    );
  }
  return (
    <Svg width={s} height={s}>
      <Rect width={s} height={s} fill={fill} />
    </Svg>
  );
}

export type ItemSelectorCategory = { id: string; label: string } | null;

export type ItemSelectorProps = {
  category: ItemSelectorCategory;
  selectedTargets: Stimulus[];
  setSelectedTargets: React.Dispatch<React.SetStateAction<Stimulus[]>>;
  distractorCount: number;
  setDistractorCount: (value: number) => void;
  onClose?: () => void;
};

export default function ItemSelector({
  category,
  selectedTargets,
  setSelectedTargets,
  distractorCount,
  setDistractorCount,
  onClose,
}: ItemSelectorProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(0);
  const [localTargets, setLocalTargets] = useState<Stimulus[]>(selectedTargets);
  const [localDistractors, setLocalDistractors] = useState(distractorCount);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryId = category?.id ?? "";
  const filteredStimuli = useMemo(() => {
    const base =
      (categoryId && categoryId in STIMULI_BY_CATEGORY
        ? STIMULI_BY_CATEGORY[categoryId as CategoryKey]
        : []) || [];

    if (!searchQuery.trim()) return base;

    return base.filter((s) =>
      s.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categoryId, searchQuery]);

  useEffect(() => {
    setLocalTargets(selectedTargets);
    setLocalDistractors(distractorCount);
  }, [categoryId, selectedTargets, distractorCount]);

  const distractorMax = Math.min(DISTRACTOR_MAX, Math.max(0, MAX_BOTTOM_ITEMS - localTargets.length));

  useEffect(() => {
    if (localDistractors > distractorMax) {
      setLocalDistractors(distractorMax);
    }
  }, [distractorMax, localDistractors]);

  const handleTargetPress = (stimulus: Stimulus) => {
    setLocalTargets((prev) => {
      const idx = prev.findIndex((s) => s.id === stimulus.id);
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      if (prev.length >= MAX_TARGETS) return prev;
      return [...prev, stimulus];
    });
  };

  const handleDistractorChange = (value: number) => {
    const max = Math.min(DISTRACTOR_MAX, MAX_BOTTOM_ITEMS - localTargets.length);
    setLocalDistractors(Math.min(Math.max(0, value), max));
  };

  const configColumnWidth = screenWidth * 0.85 * 0.9;
  const gridPadding = Spacing.xl;

  const MIN_ITEM_SIZE = 100;
  const calculatedColumns = cardWidth > 0 ? Math.floor(cardWidth / MIN_ITEM_SIZE) : 4;
  const numColumns = 5;
  const itemWidth = cardWidth > 0 && numColumns > 0 ? cardWidth / numColumns - 16 : undefined;
  const isColorsCategory = categoryId === "colors";
  const isShapesCategory = categoryId === "shapes";
  const columnCount = isShapesCategory
    ? 4
    : filteredStimuli.length <= 6
      ? filteredStimuli.length
      : 6;
  const colorCircleDiameter = Math.min(
    COLOR_CIRCLE_MAX,
    Math.max(
      COLOR_CIRCLE_MIN,
      columnCount > 0
        ? Math.floor(
            (configColumnWidth - gridPadding * 2 - COLOR_GRID_GAP * (columnCount - 1)) /
              columnCount -
              24 -
              COLOR_GRID_GAP
          )
        : COLOR_CIRCLE_MIN
    )
  );
  const colorCellWidth = colorCircleDiameter + 24;
  const colorGridWidth =
    columnCount > 0
      ? colorCellWidth * columnCount + COLOR_GRID_GAP * (columnCount - 1)
      : 0;
  const gridGap = isColorsCategory || isShapesCategory ? COLOR_GRID_GAP : Spacing.sm;
  const gridInnerWidth = Math.max(0, configColumnWidth - gridPadding * 2 - gridGap * (GRID_COLUMNS - 1));
  const gridItemSize = Math.min(
    Math.max(56, Math.floor(gridInnerWidth / GRID_COLUMNS - gridGap)),
    96
  );
  const targetGridWidth =
    isColorsCategory || isShapesCategory || isPlaceholderCategory(categoryId)
      ? colorGridWidth
      : gridItemSize * GRID_COLUMNS + gridGap * (GRID_COLUMNS - 1);
  const shapeThumbSize = colorCircleDiameter;
  const placeholderBoxSize = shapeThumbSize + 8;

  if (!category) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Selectează o categorie</Text>
      </View>
    );
  }

  return (
    <View style={styles.modalRoot}>
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setCardWidth(width);
      }}
    >
      <View style={styles.configInner}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>
            {CATEGORY_ID_TO_ENGLISH[categoryId] ?? category.label}
          </Text>
          <Text style={styles.panelSubtitle}>Configure Targets & Distractors</Text>
          <View style={styles.sectionDivider} />
        </View>

        <View style={styles.targetLibrarySection}>
          <View style={styles.libraryHeaderRow}>
            <Text style={styles.sectionTitle}>Target Library</Text>
            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={styles.clearButtonText}>×</Text>
                </Pressable>
              )}
            </View>
          </View>
          <View style={styles.sectionDivider} />
        </View>

        <View style={styles.gridCard}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.gridScroll}
            contentContainerStyle={styles.gridScrollContent}
            showsVerticalScrollIndicator={true}
          >
          {filteredStimuli.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No results found</Text>
          </View>
          ) : isColorsCategory ? (
          <View style={styles.targetGridWrap}>
            <View
              style={[
                styles.gridContainer,
                { gap: 16 },
              ]}
            >
              {filteredStimuli.map((stimulus) => {
                const isSelected = localTargets.some((s) => s.id === stimulus.id);
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
        ) : isShapesCategory ? (
          <View style={styles.targetGridWrap}>
            <View
              style={[
                styles.gridContainer,
                { gap: 16 },
              ]}
            >
              {filteredStimuli.map((stimulus) => {
                const isSelected = localTargets.some((s) => s.id === stimulus.id);
                const visual = isShapeStimulus(stimulus.image)
                  ? stimulus.image
                  : { type: "shape" as const, form: "circle" as const, fill: SHAPE_FILL };
                return (
                  <Pressable
                    key={stimulus.id}
                    style={[styles.colorCell, { width: colorCellWidth }]}
                    onPress={() => handleTargetPress(stimulus)}
                  >
                    <View
                      style={[
                        styles.shapeCellInner,
                        {
                          width: shapeThumbSize + 8,
                          height: shapeThumbSize + 8,
                        },
                        isSelected && {
                          borderWidth: 2,
                          borderColor: Colors.accent,
                          borderRadius: 8,
                        },
                      ]}
                    >
                      <ShapeThumb
                        form={visual.form}
                        size={shapeThumbSize}
                        fill={visual.fill}
                        borderWidth={0}
                        borderColor="transparent"
                      />
                    </View>
                    <Text style={styles.colorLabel} numberOfLines={1}>
                      {stimulus.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : isPlaceholderCategory(categoryId) ? (
          <View style={styles.targetGridWrap}>
            <View
              style={[
                styles.gridContainer,
                { gap: 16 },
              ]}
            >
              {filteredStimuli.map((stimulus) => {
                const isSelected = localTargets.some((s) => s.id === stimulus.id);
                const firstLetter = stimulus.label ? [...stimulus.label][0] ?? "?" : "?";
                return (
                  <Pressable
                    key={stimulus.id}
                    style={[styles.colorCell, { width: colorCellWidth }]}
                    onPress={() => handleTargetPress(stimulus)}
                  >
                    <View
                      style={[
                        styles.placeholderBox,
                        {
                          width: placeholderBoxSize,
                          height: placeholderBoxSize,
                        },
                        isSelected && {
                          borderWidth: 2,
                          borderColor: Colors.accent,
                        },
                      ]}
                    >
                      <Text style={styles.placeholderLetter}>{firstLetter}</Text>
                    </View>
                    <Text style={styles.colorLabel} numberOfLines={1}>
                      {stimulus.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredStimuli}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={({ item: stimulus }) => {
              const isSelected = localTargets.some((s) => s.id === stimulus.id);
              if (isSvgStimulus(stimulus.image)) {
                const Icon = stimulus.image.icon;
                return (
                  <View
                    style={[
                      styles.itemBox,
                      itemWidth !== undefined && { width: itemWidth },
                    ]}
                  >
                    <Pressable
                      style={[
                        styles.itemBoxPressable,
                        isSelected && styles.itemBoxSelected,
                      ]}
                      onPress={() => handleTargetPress(stimulus)}
                    >
                      <Icon
                        width={32}
                        height={32}
                        color={Colors.textPrimary}
                      />
                    </Pressable>
                  </View>
                );
              }
              const color = typeof stimulus.image === "string" ? stimulus.image : "#E0E0E0";
              return (
                <View
                  style={[
                    styles.itemBox,
                    itemWidth !== undefined && { width: itemWidth },
                  ]}
                >
                  <Pressable
                    style={[
                      styles.itemBoxPressable,
                      isSelected && styles.itemBoxSelected,
                      { backgroundColor: color },
                    ]}
                    onPress={() => handleTargetPress(stimulus)}
                  />
                </View>
              );
            }}
            columnWrapperStyle={styles.itemRowWrapper}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEnabled={false}
          />
        )}
          </ScrollView>
        </View>

        <View style={styles.selectionRow}>
          <View style={styles.selectedTargetsSection}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Selected Targets (max 3)</Text>
            <View style={styles.selectedTargetsChips}>
              {localTargets.length === 0 ? (
                <Text style={styles.selectedTargetsEmpty}>None selected</Text>
              ) : (
                localTargets.map((t) => (
                  <View key={t.id} style={styles.selectedTargetChip}>
                    <Text style={styles.selectedTargetChipText} numberOfLines={1}>{t.label}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
          <View style={styles.distractorSection}>
            <Text style={styles.distractorLabel}>Distractors</Text>
            <View style={styles.distractorControl}>
              <Pressable
                style={styles.distractorButton}
                onPress={() => handleDistractorChange(localDistractors - 1)}
                disabled={localDistractors <= 0}
              >
                <Text style={styles.distractorButtonText}>−</Text>
              </Pressable>
              <Text style={styles.distractorValue}>{localDistractors}</Text>
              <Pressable
                style={styles.distractorButton}
                onPress={() => handleDistractorChange(localDistractors + 1)}
                disabled={localDistractors >= distractorMax}
              >
                <Text style={styles.distractorButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
    <View style={styles.buttonRow}>
      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => {
          setSelectedTargets(localTargets);
          setDistractorCount(localDistractors);
          onClose?.();
        }}
      >
        <Text style={styles.confirmText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  placeholderText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  configInner: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  panelHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  panelSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E5EEF0",
    marginVertical: 12,
    width: "100%",
  },
  targetLibrarySection: {
    marginBottom: 16,
  },
  libraryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  smallSearchContainer: {
    width: 200,
    height: 36,
  },
  searchWrapper: {
    position: "relative",
    width: 200,
    height: 36,
    justifyContent: "center",
  },
  clearButton: {
    position: "absolute",
    right: 8,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "600",
  },
  noResultsContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#64748B",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 0,
  },
  searchBar: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1E293B",
  },
  gridCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    height: 280,
    marginBottom: 20,
  },
  gridScroll: {
    flex: 1,
  },
  gridScrollContent: {
    paddingBottom: 8,
  },
  targetGridWrap: {
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  selectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 16,
  },
  selectedTargetsSection: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    minWidth: 0,
  },
  selectedTargetsChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedTargetsEmpty: {
    fontSize: 13,
    color: "#64748B",
  },
  selectedTargetChip: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectedTargetChipText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
    maxWidth: 120,
  },
  distractorSection: {
    flexShrink: 0,
  },
  distractorLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 10,
  },
  distractorControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  distractorButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  distractorButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
  },
  distractorValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    minWidth: 24,
    textAlign: "center",
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
  shapeCellInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBox: {
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLetter: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  itemRowWrapper: {
    gap: 12,
  },
  itemBox: {
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F8FAFB",
  },
  itemBoxPressable: {
    flex: 1,
    width: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemBoxSelected: {
    borderWidth: 2,
    borderColor: "#2C6468",
  },
  stepperSection: {
    marginBottom: Spacing.xl,
  },
  modalRoot: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cancelText: {
    color: "#334155",
    fontWeight: "500",
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#2C6468",
  },
  confirmText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
