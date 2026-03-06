import { Theme } from "@/design/theme";
import { TouchTarget } from "@/design/touch";
import { useResponsive } from "@/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PLAY_STORE_URL } from "@/hooks/useGoogleSpeechServices";

export type GoogleSpeechRecommendationModalProps = {
  visible: boolean;
  onClose: () => void;
  onContinueWithoutInstalling: () => void;
};

export default function GoogleSpeechRecommendationModal({
  visible,
  onClose,
  onContinueWithoutInstalling,
}: GoogleSpeechRecommendationModalProps) {
  const { rs } = useResponsive();

  const openPlayStore = () => {
    Linking.openURL(PLAY_STORE_URL);
    onClose();
  };

  const handleContinue = () => {
    onContinueWithoutInstalling();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinueWithoutInstalling}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { maxWidth: rs(480), padding: rs(28), borderRadius: rs(16) }]}>
          <Ionicons
            name="warning-outline"
            size={rs(64)}
            color="#F59E0B"
            style={styles.icon}
          />
          <Text style={[styles.title, { fontSize: rs(22), marginBottom: rs(16) }]}>
            Speech services recommendation
          </Text>
          <Text style={[styles.message, { fontSize: rs(16), lineHeight: rs(24), marginBottom: rs(24) }]}>
            This application works best with Speech Services by Google for consistent speech recognition and text-to-speech behaviour.
          </Text>
          <Text style={[styles.subMessage, { fontSize: rs(14), marginBottom: rs(28) }]}>
            You can install it from the Play Store or continue without it. The app remains fully usable either way.
          </Text>
          <View style={styles.buttonsRow}>
            <Pressable
              style={[
                styles.buttonSecondary,
                {
                  paddingVertical: rs(14),
                  paddingHorizontal: rs(24),
                  minHeight: TouchTarget.minSize,
                  borderRadius: rs(12),
                },
              ]}
              onPress={handleContinue}
            >
              <Text style={[styles.buttonSecondaryText, { fontSize: rs(16) }]}>
                Continue without installing
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                {
                  paddingVertical: rs(14),
                  paddingHorizontal: rs(24),
                  minHeight: TouchTarget.minSize,
                  borderRadius: rs(12),
                },
              ]}
              onPress={openPlayStore}
            >
              <Ionicons name="open-outline" size={rs(20)} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { fontSize: rs(16) }]}>
                Install Speech Services by Google
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Theme.colors.card,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
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
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
  },
  buttonSecondary: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  buttonSecondaryText: {
    color: Theme.colors.textSecondary,
    fontWeight: "600",
    fontFamily: Theme.fontFamily.semiBold,
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
