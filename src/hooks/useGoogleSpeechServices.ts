import { useCallback, useEffect, useState } from "react";
import { NativeModules, Platform } from "react-native";

/** Package name for "Speech Services by Google" on Play Store. */
export const GOOGLE_SPEECH_PACKAGE = "com.google.android.tts";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${GOOGLE_SPEECH_PACKAGE}`;

export type GoogleSpeechCheckResult = {
  isAvailable: boolean;
  isLoading: boolean;
  error: boolean;
};

/**
 * On Android: checks if "Speech Services by Google" is installed.
 * On web/iOS: returns isAvailable true (no check).
 */
export function useGoogleSpeechServices(): GoogleSpeechCheckResult {
  const [state, setState] = useState<GoogleSpeechCheckResult>({
    isAvailable: true,
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    if (Platform.OS !== "android") {
      setState({ isAvailable: true, isLoading: false, error: false });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true }));

    const check = async () => {
      try {
        const PackageChecker = NativeModules.PackageChecker;
        if (!PackageChecker) {
          if (!cancelled) setState({ isAvailable: true, isLoading: false, error: false });
          return;
        }
        const available = await PackageChecker.isPackageAvailable(GOOGLE_SPEECH_PACKAGE);
        if (!cancelled) {
          setState({ isAvailable: !!available, isLoading: false, error: false });
        }
      } catch {
        if (!cancelled) {
          setState({ isAvailable: true, isLoading: false, error: true });
        }
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
