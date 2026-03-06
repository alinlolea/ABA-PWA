import { Theme } from "@/design/theme";
import { TouchTarget } from "@/design/touch";
import { useResponsive } from "@/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PLAY_STORE_URL } from "@/hooks/useGoogleSpeechServices";

export default function GoogleSpeechWarningScreen() {
  const { rs } = useResponsive();

  const openPlayStore = () => {
    Linking.openURL(PLAY_STORE_URL);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name="warning-outline"
          size={rs(64)}
          color="#F59E0B"
          style={styles.icon}
        />
        <Text style={[styles.title, { fontSize: rs(22), marginBottom: rs(16) }]}>
          Serviciile de vorbire Google sunt necesare
        </Text>
        <Text style={[styles.message, { fontSize: rs(16), lineHeight: rs(24), marginBottom: rs(24) }]}>
          Această aplicație folosește capabilitățile de vorbire ale dispozitivului pentru STT (recunoaștere vocală) și TTS (citire cu voce). Pentru rezultate fiabile pe tableta Android, este necesară aplicația „Speech Services by Google”.
        </Text>
        <Text style={[styles.subMessage, { fontSize: rs(14), marginBottom: rs(28) }]}>
          Instalați aplicația din Play Store și reporniți aplicația de terapie.
        </Text>
        <Pressable
          style={[
            styles.button,
            {
              paddingVertical: rs(16),
              paddingHorizontal: rs(32),
              minHeight: TouchTarget.minSize,
              borderRadius: rs(12),
            },
          ]}
          onPress={openPlayStore}
        >
          <Ionicons name="open-outline" size={rs(22)} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { fontSize: rs(16) }]}>
            Deschide Play Store
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    padding: 24,
  },
  card: {
    maxWidth: 480,
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "600",
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
    textAlign: "center",
  },
  message: {
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.regular,
    textAlign: "center",
  },
  subMessage: {
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: Theme.fontFamily.semiBold,
  },
});
