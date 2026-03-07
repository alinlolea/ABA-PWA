import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useGoogleSpeechServices } from "@/hooks/useGoogleSpeechServices";

export type SpeechEngineRecommendationResult = {
  /** true when Google speech engine is detected (or on native when package present); false otherwise */
  speechEngineRecommended: boolean;
  /** true while detection is in progress */
  isLoading: boolean;
  /** true when speech APIs (speechSynthesis or SpeechRecognition) are missing (web only) */
  speechCapabilityDegraded: boolean;
};

/** True if any voice is Google and Romanian (ro-RO). */
function hasGoogleRomanianVoice(voices: SpeechSynthesisVoice[]): boolean {
  return voices.some(
    (v) =>
      (v.name || "").toLowerCase().includes("google") &&
      (v.lang || "").startsWith("ro")
  );
}

/**
 * PWA / Web: capability-based detection.
 * Runs only after voices are loaded (voiceschanged). Re-runs when voices change
 * so the warning disappears after the user installs Speech Services by Google.
 */
export function useSpeechEngineRecommendation(): SpeechEngineRecommendationResult {
  const nativeCheck = useGoogleSpeechServices();
  const [webState, setWebState] = useState<SpeechEngineRecommendationResult>({
    speechEngineRecommended: true,
    isLoading: true,
    speechCapabilityDegraded: false,
  });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const hasSynth = typeof window.speechSynthesis !== "undefined";
    const Recognition =
      window.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    const hasRecognition = typeof Recognition !== "undefined";
    const speechCapabilityDegraded = !hasSynth || !hasRecognition;

    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      const recommended = hasGoogleRomanianVoice(voices);
      setWebState({
        speechEngineRecommended: recommended,
        isLoading: false,
        speechCapabilityDegraded,
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", checkVoices);
    document.addEventListener("visibilitychange", onVisibilityChange);
    checkVoices();
    const timeout = setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) checkVoices();
      else
        setWebState((s) => ({
          ...s,
          isLoading: false,
          speechEngineRecommended: false,
        }));
    }, 4000);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", checkVoices);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(timeout);
    };
  }, []);

  if (Platform.OS === "web") {
    return webState;
  }

  return {
    speechEngineRecommended: nativeCheck.isAvailable,
    isLoading: nativeCheck.isLoading,
    speechCapabilityDegraded: false,
  };
}
