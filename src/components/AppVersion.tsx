/**
 * Displays app version in the bottom-left corner.
 * Deployments: v1.0.<buildNumber> (APP_BUILD_VERSION from build).
 * Local: v1.0.dev
 */
import { getAppVersion } from "@/utils/version";
import { Platform, StyleSheet, Text, View } from "react-native";

export default function AppVersion() {
  const label = getAppVersion();
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
