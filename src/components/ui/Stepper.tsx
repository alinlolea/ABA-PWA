import { Spacing } from "@/design/spacing";
import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export default function Stepper({ value, min = 1, max = 10, onChange }: Props) {
  const canDecrement = value > min;
  const canIncrement = value < max;
  const minusScale = useRef(new Animated.Value(1)).current;
  const plusScale = useRef(new Animated.Value(1)).current;

  const runPressIn = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 100,
      bounciness: 4,
    }).start();
  };
  const runPressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 100,
      bounciness: 6,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => canDecrement && onChange(value - 1)}
        disabled={!canDecrement}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPressIn={() => runPressIn(minusScale)}
        onPressOut={() => runPressOut(minusScale)}
      >
        <Animated.View
          style={[
            styles.button,
            !canDecrement && styles.buttonDisabled,
            { transform: [{ scale: minusScale }] },
          ]}
        >
          <Text style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}>
            −
          </Text>
        </Animated.View>
      </Pressable>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Pressable
        onPress={() => canIncrement && onChange(value + 1)}
        disabled={!canIncrement}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPressIn={() => runPressIn(plusScale)}
        onPressOut={() => runPressOut(plusScale)}
      >
        <Animated.View
          style={[
            styles.button,
            !canIncrement && styles.buttonDisabled,
            { transform: [{ scale: plusScale }] },
          ]}
        >
          <Text style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}>
            +
          </Text>
        </Animated.View>
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
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F2F4F5",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C6468",
  },
  buttonTextDisabled: {
    color: "#94A3B8",
  },
  valueContainer: {
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E1E1E",
    minWidth: 32,
    textAlign: "center",
  },
});
