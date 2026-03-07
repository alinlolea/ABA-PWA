import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export type PWAUpdateState = {
  updateAvailable: boolean;
  reloadApp: () => void;
};

function triggerReloadWithNewWorker(registration: ServiceWorkerRegistration): void {
  const worker = registration.waiting;
  if (!worker) return;
  const onControllerChange = () => {
    navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    window.location.reload();
  };
  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
  worker.postMessage({ type: "SKIP_WAITING" });
}

/**
 * Registers the service worker (web only), shows banner when a waiting worker exists on load,
 * and runs a 10-minute periodic check that auto-reloads when a new deployment is detected.
 */
export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const checkWaitingForBanner = (registration: ServiceWorkerRegistration) => {
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
          checkWaitingForBanner(registration);
        })
        .catch((err) => console.log("SW registration failed", err));
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    const periodicCheck = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (!reg) return undefined;
          return reg.update().then(() => reg);
        })
        .then((reg) => {
          if (!reg) return;
          if (reg.waiting) {
            triggerReloadWithNewWorker(reg);
            return;
          }
          if (reg.installing) {
            reg.installing.addEventListener("statechange", () => {
              if (reg.waiting) triggerReloadWithNewWorker(reg);
            });
          }
        })
        .catch(() => {});
    };

    const interval = setInterval(periodicCheck, CHECK_INTERVAL_MS);

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
    triggerReloadWithNewWorker(reg);
  }, []);

  return { updateAvailable, reloadApp };
}
