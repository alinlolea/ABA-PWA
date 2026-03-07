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
 * Registers the service worker (web only) and silently reloads when a new version is available.
 * On load: getRegistration() + update(); if a waiting worker exists, activate it and reload once.
 */
export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const didTriggerReloadRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const triggerReloadOnce = (registration: ServiceWorkerRegistration) => {
      if (didTriggerReloadRef.current || !registration.waiting) return;
      didTriggerReloadRef.current = true;
      triggerReloadWithNewWorker(registration);
    };

    const checkAndReloadIfWaiting = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        triggerReloadOnce(registration);
        return;
      }
      if (registration.installing) {
        registration.installing.addEventListener("statechange", () => {
          if (registration.waiting) triggerReloadOnce(registration);
        });
      }
    };

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          registrationRef.current = registration;
          checkAndReloadIfWaiting(registration);
          return registration.update().then(() => registration);
        })
        .then((registration) => {
          if (registration && !didTriggerReloadRef.current) {
            checkAndReloadIfWaiting(registration);
          }
        })
        .catch((err) => console.log("SW registration failed", err));
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    const periodicCheck = () => {
      if (didTriggerReloadRef.current) return;
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (!reg) return undefined;
          return reg.update().then(() => reg);
        })
        .then((reg) => {
          if (!reg || didTriggerReloadRef.current) return;
          if (reg.waiting) {
            triggerReloadOnce(reg);
            return;
          }
          if (reg.installing) {
            reg.installing.addEventListener("statechange", () => {
              if (reg.waiting) triggerReloadOnce(reg);
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
