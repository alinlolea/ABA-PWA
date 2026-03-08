/**
 * Color labeling trial – "Numeste culori"
 * STT-based: child names the color shown. 10 trials, one color per trial.
 */
import { db } from "@/config/firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { playAudio } from "@/utils/audio";
import {
  getConfiguredSpeechRecognition,
  initSpeech,
  normalizeSpeechResult,
  stopSpeech,
} from "@/utils/speech";
import { TouchTarget } from "@/design/touch";
import { Theme } from "@/design/theme";

const TRIAL_COUNT = 10;
const INITIAL_DELAY_MS = 200;
const LISTEN_TIMEOUT_MS = 5000;
const COUNTDOWN_STABILIZATION_MS = 500;
const LISTEN_COUNTDOWN_SECONDS = 5;
const MIC_ICON_SIZE = 96;

const COLORS: { id: string; hex: string }[] = [
  { id: "rosu", hex: "#E74C3C" },
  { id: "verde", hex: "#27AE60" },
  { id: "albastru", hex: "#3498DB" },
  { id: "galben", hex: "#F1C40F" },
  { id: "mov", hex: "#9B59B6" },
  { id: "negru", hex: "#000000" },
  { id: "maro", hex: "#795548" },
  { id: "alb", hex: "#ECF0F1" },
  { id: "roz", hex: "#FD79A8" },
  { id: "gri", hex: "#95A5A6" },
];

export type ColorLabelingTrialProps = {
  sessionId: string;
  childId?: string;
  voiceEnabled?: boolean;
};

export default function ColorLabelingTrial({
  sessionId,
  childId,
  voiceEnabled = true,
}: ColorLabelingTrialProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [trialIndex, setTrialIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [phase, setPhase] = useState<"delay" | "prompt" | "listen" | "feedback">("delay");
  const [listeningActive, setListeningActive] = useState(false);
  const [countdown, setCountdown] = useState(LISTEN_COUNTDOWN_SECONDS);
  const [recognizedText, setRecognizedText] = useState("");
  const [trialResolved, setTrialResolved] = useState(false);
  const sequenceRef = useRef(false);
  const trialResolvedRef = useRef(false);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const resolveOnceRef = useRef<((result: boolean | "timeout") => Promise<void>) | null>(null);
  const correctLabelRef = useRef<string>("");
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const currentColor = COLORS[trialIndex] ?? null;
  const boxSize = Math.min(width * 0.5, height * 0.45, 320);

  const runTrialSequence = useCallback(async () => {
    if (sequenceRef.current || trialIndex >= TRIAL_COUNT) return;
    sequenceRef.current = true;
    setPhase("delay");

    await new Promise((r) => setTimeout(r, INITIAL_DELAY_MS));
    if (trialIndex >= TRIAL_COUNT) {
      sequenceRef.current = false;
      return;
    }

    const correctLabel = currentColor?.id ?? "";
    const clearListenState = () => {
      setListeningActive(false);
      setRecognizedText("");
      if (countdownStartTimeoutRef.current) {
        clearTimeout(countdownStartTimeoutRef.current);
        countdownStartTimeoutRef.current = null;
      }
      if (listenTimeoutRef.current) {
        clearTimeout(listenTimeoutRef.current);
        listenTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    if (voiceEnabled) {
      setPhase("prompt");
      stopSpeech();

      const recognition = recognitionRef.current;
      if (Platform.OS === "web" && recognition) {
        let resolved = false;
        trialResolvedRef.current = false;
        setTrialResolved(false);

        const resolveOnce = async (result: boolean | "timeout") => {
          if (resolved) return;
          resolved = true;
          trialResolvedRef.current = true;
          setTrialResolved(true);
          clearListenState();
          try {
            recognitionRef.current?.stop();
          } catch {}

          if (result === true) {
            setCorrectCount((c) => c + 1);
            setPhase("feedback");
            stopSpeech();
            await playAudio("bravo");
          } else if (result === false) {
            setIncorrectCount((i) => i + 1);
            setPhase("feedback");
            stopSpeech();
            await playAudio("gresit");
          }
          setTrialIndex((i) => i + 1);
          sequenceRef.current = false;
        };

        resolveOnceRef.current = resolveOnce;
        correctLabelRef.current = correctLabel;
      }

      await playAudio("ce-culoare-este");
      if (trialIndex >= TRIAL_COUNT) {
        sequenceRef.current = false;
        return;
      }

      if (recognition) {
        setPhase("listen");
        recognition.start();
        setCountdown(LISTEN_COUNTDOWN_SECONDS);
        setListeningActive(true);
        setRecognizedText("");
        countdownStartTimeoutRef.current = setTimeout(() => {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setCountdown(LISTEN_COUNTDOWN_SECONDS);
          countdownIntervalRef.current = setInterval(() => {
            if (trialResolvedRef.current) return;
            setCountdown((c) => (c > 0 ? c - 1 : 0));
          }, 1000);
        }, COUNTDOWN_STABILIZATION_MS);
        listenTimeoutRef.current = setTimeout(() => {
          if (trialResolvedRef.current) return;
          resolveOnceRef.current?.(false);
        }, LISTEN_TIMEOUT_MS);
        return;
      }
    }

    setPhase("listen");
    const recognitionFallback = recognitionRef.current;
    if (Platform.OS === "web" && recognitionFallback) {
      let resolved = false;
      trialResolvedRef.current = false;
      setTrialResolved(false);

      const resolveOnce = async (result: boolean | "timeout") => {
        if (resolved) return;
        resolved = true;
        trialResolvedRef.current = true;
        setTrialResolved(true);
        clearListenState();
        try {
          recognitionRef.current?.stop();
        } catch {}

        if (result === true) {
          setCorrectCount((c) => c + 1);
          if (voiceEnabled) {
            setPhase("feedback");
            stopSpeech();
            await playAudio("bravo");
          }
        } else if (result === false) {
          setIncorrectCount((i) => i + 1);
          if (voiceEnabled) {
            setPhase("feedback");
            stopSpeech();
            await playAudio("gresit");
          }
        }
        setTrialIndex((i) => i + 1);
        sequenceRef.current = false;
      };

      resolveOnceRef.current = resolveOnce;
      correctLabelRef.current = correctLabel;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountdown(LISTEN_COUNTDOWN_SECONDS);
      setListeningActive(true);
      setRecognizedText("");
      countdownIntervalRef.current = setInterval(() => {
        if (trialResolvedRef.current) return;
        setCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);

      recognitionFallback.start();
      listenTimeoutRef.current = setTimeout(() => {
        if (trialResolvedRef.current) return;
        if (!resolved) {
          resolveOnceRef.current?.(false);
        }
      }, LISTEN_TIMEOUT_MS);
      return;
    }

    setTrialIndex((i) => i + 1);
    sequenceRef.current = false;
  }, [trialIndex, currentColor?.id, voiceEnabled]);

  useEffect(() => {
    if (!listeningActive) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [listeningActive, pulseAnim]);

  useEffect(() => {
    initSpeech();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const recognition = getConfiguredSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.interimResults = true;
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          console.log(event.results);
          if (trialResolvedRef.current) return;
          const resolveOnce = resolveOnceRef.current;
          const correctLabel = correctLabelRef.current;
          if (!resolveOnce) return;
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0]?.transcript ?? "";
          }
          const transcript = fullTranscript.trim();
          setRecognizedText(transcript);

          const normalized = normalizeSpeechResult(transcript)
            .replace(/[^\p{L}\s]/gu, "")
            .replace(/\s+/g, " ")
            .trim();
          const words = normalized.split(/\s+/).filter(Boolean);

          if (words.length !== 1) {
            const last = event.results[event.results.length - 1];
            if (last?.isFinal) resolveOnce(false);
            return;
          }
          const singleWord = normalizeSpeechResult(words[0]);
          const correctNormalized = normalizeSpeechResult(correctLabel);
          if (singleWord === correctNormalized) {
            resolveOnce(true);
            return;
          }
          const last = event.results[event.results.length - 1];
          if (last?.isFinal) resolveOnce(false);
        };
        recognition.onerror = () => {
          if (!trialResolvedRef.current) resolveOnceRef.current?.(false);
        };
        recognition.onend = () => {
          // Web Speech API fires onend frequently; do not resolve trial here.
        };
      }
    }
    return () => {
      if (countdownStartTimeoutRef.current) clearTimeout(countdownStartTimeoutRef.current);
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      try {
        recognitionRef.current?.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (trialIndex >= TRIAL_COUNT) {
      setSessionComplete(true);
      return;
    }
    runTrialSequence();
  }, [trialIndex, runTrialSequence]);

  useEffect(() => {
    if (!sessionComplete) return;
    const total = correctCount + incorrectCount;
    updateDoc(doc(db, "sessions", sessionId), {
      completedAt: serverTimestamp(),
      correctTrials: correctCount,
      totalTrials: TRIAL_COUNT,
      correctAttempts: correctCount,
      totalAttempts: total,
      accuracy: total > 0 ? correctCount / total : 0,
    }).catch(() => {});
  }, [sessionComplete, sessionId, correctCount, incorrectCount]);

  if (sessionComplete) {
    const total = correctCount + incorrectCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>Sesiune încheiată</Text>
        <Text style={styles.subtitle}>Numeste culori</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Corecte: {correctCount}</Text>
          <Text style={styles.statText}>Incorecte: {incorrectCount}</Text>
          <Text style={styles.statText}>Acuratețe: {accuracy}%</Text>
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
            onPress={() => router.replace("/main-dashboard")}
          >
            <Text style={styles.buttonText}>Înapoi la panou</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.7],
  });

  return (
    <View style={[styles.screen, styles.centered]}>
      <View style={styles.trialColumn}>
        <View
          style={[
            styles.colorBox,
            {
              width: boxSize,
              height: boxSize,
              backgroundColor: currentColor?.hex ?? "#EEE",
              borderWidth: currentColor?.id === "alb" ? 1 : 0,
              borderColor: "#DDD",
            },
          ]}
        />
        {listeningActive && (
          <View style={styles.micSection}>
            <Animated.View
              style={[
                styles.micWrapper,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            >
              <Ionicons
                name="mic"
                size={MIC_ICON_SIZE}
                color={Theme.colors.primary}
              />
            </Animated.View>
            <Text style={styles.ascultLabel}>ASCULT...</Text>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.debugLabel}>Text detectat:</Text>
            <Text style={styles.debugText} numberOfLines={2}>
              {recognizedText ? `"${recognizedText}"` : "—"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7F8",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  trialColumn: {
    alignItems: "center",
    justifyContent: "center",
  },
  colorBox: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  micSection: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  micWrapper: {
    width: MIC_ICON_SIZE + 24,
    height: MIC_ICON_SIZE + 24,
    borderRadius: (MIC_ICON_SIZE + 24) / 2,
    backgroundColor: "rgba(44, 100, 104, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  ascultLabel: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
    letterSpacing: 1,
  },
  countdownText: {
    marginTop: 12,
    fontSize: 48,
    fontWeight: "700",
    color: Theme.colors.primary,
    fontFamily: Theme.fontFamily.semiBold,
  },
  debugLabel: {
    marginTop: 16,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
  },
  debugText: {
    marginTop: 4,
    fontSize: 16,
    fontStyle: "italic",
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.medium,
    minHeight: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 32,
  },
  statText: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.medium,
  },
  buttonRow: {
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: TouchTarget.minSize,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.primary,
    fontFamily: Theme.fontFamily.semiBold,
  },
});
