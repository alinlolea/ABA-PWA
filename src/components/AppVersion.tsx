/**
 * Displays app version and optional git commit hash in the bottom-left corner.
 * Visible on all screens for deployment identification.
 * Version from package.json; commit from EXPO_PUBLIC_GIT_COMMIT.
 */
import { Platform, StyleSheet, Text, View } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appVersion = (require("../../package.json") as { version?: string }).version ?? "0.0.0";
const commitHash =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_GIT_COMMIT) || "";

function formatVersion(): string {
  const v = appVersion;
  if (commitHash) {
    const short = commitHash.length >= 6 ? commitHash.slice(0, 6) : commitHash;
    return `v${v}-${short}`;
  }
  return `v${v}`;
}

export default function AppVersion() {
  const label = formatVersion();
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 10,
    left: 10,
    zIndex: 9999,
    ...(Platform.OS === "web" ? { pointerEvents: "none" as const } : {}),
  },
  text: {
    fontSize: 11,
    opacity: 0.6,
    color: "#666",
  },
});
