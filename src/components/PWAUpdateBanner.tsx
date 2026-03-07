import { Theme } from "@/design/theme";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type PWAUpdateBannerProps = {
  onReload: () => void;
};

/**
 * Small non-intrusive banner at the bottom when a new version is available (web only).
 * Does not block the interface; remains visible until user reloads.
 */
export default function PWAUpdateBanner({ onReload }: PWAUpdateBannerProps) {
  if (Platform.OS !== "web") return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>New version of the app is available.</Text>
      <Pressable style={styles.button} onPress={onReload}>
        <Text style={styles.buttonText}>Reload App</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Theme.colors.primary,
    zIndex: 9999,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Theme.fontFamily.medium,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Theme.fontFamily.semiBold,
  },
});
