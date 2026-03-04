import { Theme } from "@/design/theme";
import { auth } from "@/config/firebase";
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
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

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
          .register("/sw.js")
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
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
});