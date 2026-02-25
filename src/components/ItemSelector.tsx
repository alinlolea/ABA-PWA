import Stepper from "@/components/ui/Stepper";
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

  const categoryId = category?.id ?? "";
  const categoryStimuli = useMemo(() => {
    if (categoryId && categoryId in STIMULI_BY_CATEGORY) {
      return STIMULI_BY_CATEGORY[categoryId as CategoryKey];
    }
    return [];
  }, [categoryId]);

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
  const numColumns = Math.min(Math.max(calculatedColumns, 3), 5);
  const itemWidth = cardWidth > 0 && numColumns > 0 ? cardWidth / numColumns - 16 : undefined;
  const isColorsCategory = categoryId === "colors";
  const isShapesCategory = categoryId === "shapes";
  const columnCount = isShapesCategory
    ? categoryStimuli.length
    : categoryStimuli.length <= 6
      ? categoryStimuli.length
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
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setCardWidth(width);
      }}
    >
      <View style={styles.configInner}>
        <View style={styles.headerSection}>
          <Text style={styles.panelTitle}>{category.label}</Text>
          <View style={styles.titleDivider} />
        </View>

        <Text style={styles.configLabel}>
          {categoryId === "colors"
            ? "Ce culoare vrei să învețe copilul?"
            : categoryId === "shapes"
              ? "Ce formă vrei să învețe copilul?"
              : `Obiecte țintă (max ${MAX_TARGETS})`}
        </Text>
        {isColorsCategory ? (
          <View style={styles.targetGridWrap}>
            <View
              style={[
                styles.targetGrid,
                { gap: gridGap, width: targetGridWidth },
              ]}
            >
              {categoryStimuli.map((stimulus) => {
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
                styles.targetGrid,
                { gap: gridGap, width: targetGridWidth, flexWrap: "nowrap" },
              ]}
            >
              {categoryStimuli.map((stimulus) => {
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
                styles.targetGrid,
                { gap: gridGap, width: targetGridWidth },
              ]}
            >
              {categoryStimuli.map((stimulus) => {
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
            data={categoryStimuli}
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

        <Text style={styles.configLabel}>
          Adaugă număr de distractori
        </Text>
        <View style={styles.stepperSection}>
          <Stepper
            value={localDistractors}
            min={0}
            max={distractorMax}
            onChange={handleDistractorChange}
          />
        </View>
      </View>
    </ScrollView>
    <View style={styles.modalButtonRow}>
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
  headerSection: {
    marginBottom: Spacing.md,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
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
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
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
