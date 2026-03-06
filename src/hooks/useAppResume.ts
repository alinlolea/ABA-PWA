import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

/**
 * Listens for the app returning to the foreground (PWA / web).
 * Only runs when visibility changes from hidden to visible to avoid unnecessary reloads.
 */
export function useAppResume(onResume: () => void) {
  const onResumeRef = useRef(onResume);
  const previousVisibilityRef = useRef<string | null>(null);

  onResumeRef.current = onResume;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      const wasHidden = previousVisibilityRef.current === "hidden";
      previousVisibilityRef.current = document.visibilityState;

      if (wasHidden && visible) {
        onResumeRef.current();
      }
    };

    previousVisibilityRef.current = document.visibilityState;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
