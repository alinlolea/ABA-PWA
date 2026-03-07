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
import { initSpeech, speak, speakAndWait, stopSpeech } from "@/utils/speech";
import { getConfiguredSpeechRecognition, normalizeSpeechResult } from "@/utils/speech";
import { TouchTarget } from "@/design/touch";
import { Theme } from "@/design/theme";

const TRIAL_COUNT = 10;
const INITIAL_DELAY_MS = 500;
const DELAY_AFTER_TTS_MS = 500;
const LISTEN_TIMEOUT_MS = 5000;
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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

    if (voiceEnabled) {
      setPhase("prompt");
      stopSpeech();
      await speakAndWait("Ce", "instructionEmphasis");
      await speakAndWait("culoare este?", "instruction");
    }
    await new Promise((r) => setTimeout(r, DELAY_AFTER_TTS_MS));
    if (trialIndex >= TRIAL_COUNT) {
      sequenceRef.current = false;
      return;
    }

    setPhase("listen");
    const correctLabel = currentColor?.id ?? "";

    const clearListenState = () => {
      setListeningActive(false);
      setRecognizedText("");
      if (listenTimeoutRef.current) {
        clearTimeout(listenTimeoutRef.current);
        listenTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const recognition = getConfiguredSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        let resolved = false;
        trialResolvedRef.current = false;
        setTrialResolved(false);
        setListeningActive(true);
        setRecognizedText("");
        setCountdown(LISTEN_COUNTDOWN_SECONDS);
        recognition.interimResults = true;
        countdownIntervalRef.current = setInterval(() => {
          if (trialResolvedRef.current) return;
          setCountdown((c) => (c > 0 ? c - 1 : 0));
        }, 1000);

        const resolveOnce = async (result: boolean | "timeout") => {
          if (resolved) return;
          resolved = true;
          trialResolvedRef.current = true;
          setTrialResolved(true);
          clearListenState();
          try {
            recognition.stop();
          } catch {}
          recognitionRef.current = null;

          if (result === true) {
            setCorrectCount((c) => c + 1);
            if (voiceEnabled) {
              setPhase("feedback");
              stopSpeech();
              await speakAndWait("Bravo!", "praise");
            }
          } else if (result === false) {
            setIncorrectCount((i) => i + 1);
            if (voiceEnabled) {
              setPhase("feedback");
              stopSpeech();
              await speakAndWait("Greșit!", "neutral");
            }
          }
          setTrialIndex((i) => i + 1);
          sequenceRef.current = false;
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (trialResolvedRef.current) return;
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0]?.transcript ?? "";
          }
          setRecognizedText(fullTranscript.trim());
          const result = event.results[event.results.length - 1];
          if (!result?.isFinal) return;
          const transcript = result[0]?.transcript ?? "";
          const normalized = normalizeSpeechResult(transcript).replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").trim();
          const words = normalized.split(/\s+/);
          const match = words.some((w) => normalizeSpeechResult(w) === correctLabel);
          resolveOnce(match);
        };
        recognition.onerror = () => {
          if (!trialResolvedRef.current) resolveOnce(false);
        };
        recognition.onend = () => {
          if (!resolved && !trialResolvedRef.current) resolveOnce(false);
        };
        recognition.start();
        listenTimeoutRef.current = setTimeout(() => {
          if (trialResolvedRef.current) return;
          if (!resolved) {
            resolved = true;
            clearListenState();
            try {
              recognition.stop();
            } catch {}
            recognitionRef.current = null;
            setTrialIndex((i) => i + 1);
            sequenceRef.current = false;
          }
        }, LISTEN_TIMEOUT_MS);
        return;
      }
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
    return () => {
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      try {
        recognitionRef.current?.stop();
      } catch {}
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
