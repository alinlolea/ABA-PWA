import SpeechRecommendationProvider from "@/components/SpeechRecommendationProvider";
import { Theme } from "@/design/theme";
import { auth } from "@/config/firebase";
import { useAppResume } from "@/hooks/useAppResume";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Stack, usePathname, useRouter } from "expo-router";
import * as Font from "expo-font";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [fontsLoaded] = Font.useFonts({
    [Theme.fontFamily.regular]: Inter_400Regular,
    [Theme.fontFamily.medium]: Inter_500Medium,
    [Theme.fontFamily.semiBold]: Inter_600SemiBold,
  });
  const pathname = usePathname();
  const router = useRouter();
  const initialAuthRedirectDone = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    }
  }, []);

  // Register service worker for PWA installability (web only)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then(() => navigator.serviceWorker.ready)
          .catch((err) => console.log("SW registration failed", err));
      };
      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // On PWA resume: sync auth state and notify app to refresh session-dependent data
  const handleAppResume = useCallback(() => {
    const currentUser = auth.currentUser ?? null;
    setUser(currentUser);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("appresume"));
    }
  }, []);
  useAppResume(handleAppResume);

  // Initial route: authenticated → MainDashboard (once); not authenticated → login when on protected route.
  // Do not rely on restored navigation state.
  useEffect(() => {
    if (!authReady) return;
    if (user) {
      if (initialAuthRedirectDone.current) return;
      initialAuthRedirectDone.current = true;
      router.replace("/main-dashboard");
    } else {
      if (pathname !== "/login" && pathname !== "/register") {
        router.replace("/login");
      }
    }
  }, [authReady, user, pathname]);

  // Wait for fonts before rendering
  if (!fontsLoaded) {
    return null;
  }

  if (!authReady) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Se încarcă...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SpeechRecommendationProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SpeechRecommendationProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === "web"
      ? { width: "100vw" as const, height: "100vh" as const, overflow: "hidden" as const }
      : {}),
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
  },
});