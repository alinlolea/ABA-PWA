import ScreenContainer from "@/components/layout/ScreenContainer";
import { auth } from "@/services/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Eroare", "Introdu email și parola.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/main-dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Autentificare eșuată.";
      Alert.alert("Eroare", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.mainContainer}
      >
        {/* Left panel – branding */}
        <View style={styles.leftPanel}>
          <Image
            source={require("../../../assets/images/digital-aba-therapy-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Digital ABA Therapy</Text>
          <Text style={styles.tagline}>Structured. Measurable. Professional.</Text>
        </View>

        {/* Right panel – login form */}
        <View style={styles.rightPanel}>
          <View style={styles.formCard}>
            <Text style={styles.title}>Autentificare</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Parolă"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                editable={!loading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setPasswordVisible((v) => !v)}
                hitSlop={12}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#2C6468"
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Autentificare</Text>
              )}
            </Pressable>

            <Text
              style={styles.registerLink}
              onPress={() => !loading && router.push("/register")}
            >
              Nu ai cont? Înregistrează-te
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: "45%",
    backgroundColor: "#E8F1F2",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  logo: {
    width: 220,
    height: 100,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 28,
    fontWeight: "600",
    color: "#2C6468",
    marginTop: 24,
    textAlign: "center",
  },
  rightPanel: {
    width: "55%",
    backgroundColor: "#F4F7F8",
    justifyContent: "center",
    alignItems: "center",
  },
  formCard: {
    width: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 24,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE7EA",
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 16,
    color: "#1E293B",
  },
  passwordWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  inputPassword: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE7EA",
    paddingHorizontal: 14,
    paddingRight: 48,
    fontSize: 16,
    color: "#1E293B",
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2C6468",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  registerLink: {
    marginTop: 16,
    textAlign: "center",
    color: "#2C6468",
    fontSize: 15,
    fontWeight: "500",
  },
});
