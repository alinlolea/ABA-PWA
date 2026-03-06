import { createContext, useCallback, useContext, useState } from "react";

const STORAGE_KEY = "speechEngineWarningDismissed";

export type SpeechRecommendationContextValue = {
  /** true when Google Speech Services is installed (or on web/iOS); false when not installed on Android */
  speechEngineRecommended: boolean;
  /** Open the recommendation modal (e.g. from dashboard icon) */
  showRecommendationModal: () => void;
  /** Whether the recommendation modal is visible */
  recommendationModalVisible: boolean;
  /** Close the modal (e.g. after Continue) */
  setRecommendationModalVisible: (visible: boolean) => void;
  /** Persist that user chose "Continue without installing" so we don't show modal on every startup */
  setDismissedPersisted: (dismissed: boolean) => void;
};

export const SpeechRecommendationContext = createContext<SpeechRecommendationContextValue>({
  speechEngineRecommended: true,
  showRecommendationModal: () => {},
  recommendationModalVisible: false,
  setRecommendationModalVisible: () => {},
  setDismissedPersisted: () => {},
});

export function useSpeechRecommendation() {
  return useContext(SpeechRecommendationContext);
}

export async function getSpeechRecommendationDismissed(): Promise<boolean> {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v === "true";
  } catch {
    return false;
  }
}

export async function setSpeechRecommendationDismissed(dismissed: boolean): Promise<void> {
  if (typeof localStorage !== "undefined") {
    if (dismissed) localStorage.setItem(STORAGE_KEY, "true");
    else localStorage.removeItem(STORAGE_KEY);
    return;
  }
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    if (dismissed) await AsyncStorage.setItem(STORAGE_KEY, "true");
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}
