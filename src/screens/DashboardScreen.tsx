import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../design/colors";

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});