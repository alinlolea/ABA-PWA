import ScreenContainer from "@/components/layout/ScreenContainer";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Colors } from "@/design/colors";
import { Spacing } from "@/design/spacing";
import { Typography } from "@/design/typography";
import { auth } from "@/config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert("Eroare", "Completează toate câmpurile.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Eroare", "Parolele nu coincid.");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/main-dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Înregistrare eșuată.";
      Alert.alert("Eroare", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.wrapper}
      >
        <View style={styles.box}>
          <Text style={styles.title}>Înregistrare</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Parolă"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmare parolă"
            placeholderTextColor={Colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
          <PrimaryButton title="Creează cont" onPress={handleRegister} />
          <Text
            style={styles.link}
            onPress={() => !loading && router.push("/login")}
          >
            Ai deja cont? Autentificare
          </Text>
        </View>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  box: {
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  link: {
    fontSize: Typography.body,
    color: Colors.accent,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
