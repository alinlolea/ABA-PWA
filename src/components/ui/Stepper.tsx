import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export default function Stepper({ value, min = 1, max = 10, onChange }: Props) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={() => canDecrement && onChange(value - 1)}
        disabled={!canDecrement}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}>
          −
        </Text>
      </Pressable>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Pressable
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
        onPress={() => canIncrement && onChange(value + 1)}
        disabled={!canIncrement}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  button: {
    height: 32,
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  buttonTextDisabled: {
    color: Colors.textSecondary,
  },
  valueContainer: {
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: Typography.title,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
