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

/** Detect Google speech from synthesis voice names (e.g. "Google", "Google US English"). */
function hasGoogleVoice(voices: SpeechSynthesisVoice[]): boolean {
  return voices.some((v) => /google/i.test(v.name || ""));
}

/**
 * PWA / Web: capability-based detection.
 * - Checks window.speechSynthesis and window.SpeechRecognition / webkitSpeechRecognition.
 * - Uses speechSynthesis.getVoices() (and voiceschanged) to detect a Google voice.
 * Native: uses package check from useGoogleSpeechServices.
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
    const Recognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    const hasRecognition = typeof Recognition !== "undefined";
    const speechCapabilityDegraded = !hasSynth || !hasRecognition;

    const resolve = (recommended: boolean) => {
      setWebState({
        speechEngineRecommended: recommended,
        isLoading: false,
        speechCapabilityDegraded,
      });
    };

    let resolved = false;
    const checkVoices = () => {
      if (resolved) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolved = true;
        resolve(hasGoogleVoice(voices));
      }
    };

    checkVoices();
    window.speechSynthesis.addEventListener("voiceschanged", checkVoices);
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, 3000);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", checkVoices);
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
