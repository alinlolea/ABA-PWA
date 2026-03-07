import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export type PWAUpdateState = {
  updateAvailable: boolean;
  reloadApp: () => void;
};

/**
 * Registers the service worker (web only) and detects when a new worker enters the "waiting" state.
 * Exposes updateAvailable and reloadApp() so the root layout can show an update banner.
 */
export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const checkWaiting = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) setUpdateAvailable(true);
      if (registration.installing) {
        registration.installing.addEventListener("statechange", () => {
          if (registration.waiting) setUpdateAvailable(true);
        });
      }
    };

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          registrationRef.current = registration;
          checkWaiting(registration);
        })
        .catch((err) => console.log("SW registration failed", err));
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    const interval = setInterval(() => {
      registrationRef.current?.update().then(() => {
        const reg = registrationRef.current;
        if (reg) checkWaiting(reg);
      });
    }, 60 * 1000);

    return () => {
      window.removeEventListener("load", register);
      clearInterval(interval);
    };
  }, []);

  const reloadApp = useCallback(() => {
    const reg = registrationRef.current;
    if (!reg?.waiting) {
      window.location.reload();
      return;
    }
    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }, []);

  return { updateAvailable, reloadApp };
}
