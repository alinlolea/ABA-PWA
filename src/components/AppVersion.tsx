/**
 * Displays app version and commit hash in the bottom-left corner.
 * On Vercel: v1.0.0-{first 6 of VERCEL_GIT_COMMIT_SHA}. Locally: v1.0.0-dev.
 */
import { Platform, StyleSheet, Text, View } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appVersion = (require("../../package.json") as { version?: string }).version ?? "0.0.0";

const commitSha =
  (typeof process !== "undefined" && process.env?.VERCEL_GIT_COMMIT_SHA) || "";

function formatVersion(): string {
  const v = appVersion;
  if (commitSha) {
    const short = commitSha.length >= 6 ? commitSha.slice(0, 6) : commitSha;
    return `v${v}-${short}`;
  }
  return `v${v}-dev`;
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
