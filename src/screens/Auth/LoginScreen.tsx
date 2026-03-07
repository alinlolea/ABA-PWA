import ScreenContainer from "@/components/layout/ScreenContainer";
import { useResponsive } from "@/utils/responsive";
import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const { width, rs } = useResponsive();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const formWidth = Math.min(width * 0.4, 500);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootContainer: { flex: 1 },
        keyboardAvoid: { flex: 1 },
        scrollContent: {
          flexGrow: 1,
          padding: rs(24),
          paddingBottom: rs(40),
        },
        mainContainer: { flex: 1, flexDirection: "row", minHeight: rs(400) },
        leftPanel: {
          width: "45%",
          backgroundColor: "#E8F1F2",
          justifyContent: "center",
          alignItems: "center",
          padding: rs(40),
        },
        logo: { width: rs(220), height: rs(100), resizeMode: "contain" as const },
        appName: {
          fontSize: rs(28),
          fontWeight: "600",
          color: "#2C6468",
          marginTop: rs(24),
          textAlign: "center",
        },
        tagline: {
          fontSize: rs(14),
          color: "#64748B",
          marginTop: rs(12),
          textAlign: "center",
          letterSpacing: 0.5,
        },
        rightPanel: {
          width: "55%",
          backgroundColor: "#F4F7F8",
          justifyContent: "center",
          alignItems: "center",
        },
        formCard: {
          width: formWidth,
          backgroundColor: "#FFFFFF",
          borderRadius: rs(20),
          padding: rs(32),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        title: {
          fontSize: rs(22),
          fontWeight: "600",
          color: "#1E293B",
          marginBottom: rs(24),
          textAlign: "center",
        },
        input: {
          height: rs(48),
          borderRadius: rs(10),
          borderWidth: 1,
          borderColor: "#DCE7EA",
          paddingHorizontal: rs(14),
          marginBottom: rs(16),
          fontSize: 16,
          color: "#1E293B",
        },
        passwordWrapper: { position: "relative" as const, marginBottom: rs(16) },
        inputPassword: {
          height: rs(48),
          borderRadius: rs(10),
          borderWidth: 1,
          borderColor: "#DCE7EA",
          paddingHorizontal: rs(14),
          paddingRight: rs(48),
          fontSize: 16,
          color: "#1E293B",
        },
        eyeButton: {
          position: "absolute" as const,
          right: rs(14),
          top: 0,
          bottom: 0,
          justifyContent: "center",
        },
        loginButton: {
          height: rs(52),
          borderRadius: rs(14),
          backgroundColor: "#2C6468",
          justifyContent: "center",
          alignItems: "center",
          marginTop: rs(12),
        },
        loginButtonDisabled: { opacity: 0.7 },
        loginButtonText: {
          color: "#FFFFFF",
          fontWeight: "600",
          fontSize: rs(16),
        },
        registerLink: {
          marginTop: rs(16),
          textAlign: "center",
          color: "#2C6468",
          fontSize: rs(15),
          fontWeight: "500",
        },
      }),
    [rs, formWidth]
  );

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

  const rootContainerStyle = useMemo(
    () => [
      styles.rootContainer,
      Platform.OS === "web" && { minHeight: "100vh" as const },
    ],
    []
  );

  return (
    <ScreenContainer>
      <View style={rootContainerStyle}>
        <KeyboardAvoidingView
          behavior="height"
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mainContainer}>
              <View style={styles.leftPanel}>
                <Image
                  source={require("../../../assets/images/digital-aba-therapy-logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>Digital ABA Therapy</Text>
                <Text style={styles.tagline}>Structured. Measurable. Professional.</Text>
              </View>

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
                        size={rs(22)}
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
}
