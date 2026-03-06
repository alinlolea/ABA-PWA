/**
 * Persist STT session state for recovery after reload/crash.
 * Web/PWA: localStorage. Native: AsyncStorage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { STT_SESSION_STORAGE_KEY } from "./constants";
import type { STTSessionState } from "./types";

export async function persistSession(state: STTSessionState | null): Promise<void> {
  const json = state ? JSON.stringify(state) : "";
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    if (json) localStorage.setItem(STT_SESSION_STORAGE_KEY, json);
    else localStorage.removeItem(STT_SESSION_STORAGE_KEY);
    return;
  }
  if (json) await AsyncStorage.setItem(STT_SESSION_STORAGE_KEY, json);
  else await AsyncStorage.removeItem(STT_SESSION_STORAGE_KEY);
}

export async function loadPersistedSession(): Promise<STTSessionState | null> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(STT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as STTSessionState;
    } catch {
      return null;
    }
  }
  try {
    const raw = await AsyncStorage.getItem(STT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as STTSessionState;
  } catch {
    return null;
  }
}
