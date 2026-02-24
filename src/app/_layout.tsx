import { Theme } from "@/design/theme";
import { auth } from "@/services/firebaseConfig";
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
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
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
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}