import { useEffect, useState } from "react";

/** Package name for "Speech Services by Google" on Play Store. */
export const GOOGLE_SPEECH_PACKAGE = "com.google.android.tts";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${GOOGLE_SPEECH_PACKAGE}`;

export type GoogleSpeechCheckResult = {
  isAvailable: boolean;
  isLoading: boolean;
  error: boolean;
};

/**
 * On web: not used for recommendation (useSpeechEngineRecommendation uses capability/voices).
 * On native: package detection was removed (react-native-package-checker); treat as available.
 */
export function useGoogleSpeechServices(): GoogleSpeechCheckResult {
  const [state, setState] = useState<GoogleSpeechCheckResult>({
    isAvailable: true,
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    setState({ isAvailable: true, isLoading: false, error: false });
  }, []);

  return state;
}
