/**
 * STT trial recording UI: large tap targets for Correct / Incorrect / Prompt / No Response.
 * Tablet-first; target <1s per trial.
 */
import { Theme } from "@/design/theme";
import { TouchTarget } from "@/design/touch";
import { useResponsive } from "@/utils/responsive";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTrialSession } from "./useTrialSession";
import type { TrialResultType } from "./types";
import { Colors } from "@/design/colors";

const RESULT_BUTTONS: { key: TrialResultType; label: string; color: string }[] = [
  { key: "correct", label: "Corect", color: Colors.correct },
  { key: "incorrect", label: "Incorect", color: Colors.incorrect },
  { key: "prompted", label: "Prompt", color: "#F59E0B" },
  { key: "no_response", label: "Fără răspuns", color: "#64748B" },
];

export default function STTTrialScreen() {
  const router = useRouter();
  const { rs } = useResponsive();
  const params = useLocalSearchParams<{
    studentId?: string;
    objectiveId?: string;
    objectiveName?: string;
    trialCount?: string;
  }>();
  const {
    session,
    trialIndex,
    trialCount,
    trialResults,
    isComplete,
    isSyncing,
    recordResult,
    startSession,
    resumeSession,
    endSession,
  } = useTrialSession();
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    resumeSession().then((restored) => {
      if (restored) return;
      const studentId = params.studentId;
      const objectiveId = params.objectiveId ?? "default";
      const n = params.trialCount ? parseInt(params.trialCount, 10) : 10;
      const trialCountParam = Number.isNaN(n) || n < 1 ? 10 : Math.min(200, n);
      if (studentId && trialCountParam > 0) {
        startSession({
          studentId,
          objectiveId,
          objectiveName: params.objectiveName,
          trialCount: trialCountParam,
        }).catch(() => router.replace("/main-dashboard"));
      } else {
        router.replace("/main-dashboard");
      }
    });
  }, []);

  const handleResult = useCallback(
    (result: TrialResultType) => {
      void recordResult(result);
    },
    [recordResult]
  );

  const handleEndSession = useCallback(() => {
    endSession();
    router.replace("/main-dashboard");
  }, [endSession, router]);

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.title, { fontSize: rs(22) }]}>Se încarcă sesiunea...</Text>
      </View>
    );
  }

  if (isComplete) {
    const correct = trialResults.filter((r) => r.result === "correct").length;
    return (
      <View style={[styles.root, { padding: rs(24) }]}>
        <Text style={[styles.title, { fontSize: rs(24), marginBottom: rs(16) }]}>Sesiune încheiată</Text>
        <Text style={[styles.body, { fontSize: rs(18), marginBottom: rs(8) }]}>
          {session.objectiveName ?? "Obiectiv"}
        </Text>
        <Text style={[styles.body, { fontSize: rs(16), marginBottom: rs(24) }]}>
          {correct} / {trialCount} corecte
        </Text>
        <Pressable
          style={[styles.primaryButton, { paddingVertical: rs(16), paddingHorizontal: rs(32), minHeight: TouchTarget.minSize }]}
          onPress={handleEndSession}
        >
          <Text style={styles.primaryButtonText}>Înapoi la panou</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { padding: rs(24) }]}>
      <View style={styles.header}>
        <Text style={[styles.progress, { fontSize: rs(18) }]}>
          Încercare {trialIndex + 1} / {trialCount}
        </Text>
        <Text style={[styles.objective, { fontSize: rs(16) }]} numberOfLines={1}>
          {session.objectiveName ?? session.objectiveId}
        </Text>
        {isSyncing && (
          <Text style={[styles.syncHint, { fontSize: rs(12) }]}>Se salvează...</Text>
        )}
      </View>

      <View style={styles.buttons}>
        {RESULT_BUTTONS.map(({ key, label, color }) => (
          <Pressable
            key={key}
            style={[
              styles.resultButton,
              {
                backgroundColor: color,
                paddingVertical: rs(20),
                paddingHorizontal: rs(24),
                minHeight: Math.max(TouchTarget.minSize * 1.5, rs(80)),
                borderRadius: rs(16),
              },
            ]}
            onPress={() => handleResult(key)}
          >
            <Text style={[styles.resultButtonText, { fontSize: rs(20) }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
  },
  header: {
    marginBottom: 24,
  },
  progress: {
    fontWeight: "600",
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
  },
  objective: {
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
    marginTop: 4,
  },
  syncHint: {
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  title: {
    fontWeight: "600",
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.semiBold,
  },
  body: {
    color: Theme.colors.textPrimary,
    fontFamily: Theme.fontFamily.regular,
  },
  buttons: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    alignContent: "center",
  },
  resultButton: {
    minWidth: 160,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: Theme.fontFamily.semiBold,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: Theme.fontFamily.semiBold,
  },
});
