/**
 * STT trial session hook: in-memory state, local persist, batched Firestore sync.
 * Target: <1s per trial tap; session recovery on reload.
 */
import { auth } from "@/config/firebase";
import { useCallback, useRef, useState } from "react";
import {
  createSession,
  markSessionCompleted,
  writeTrialsBatch,
} from "./firestore";
import { persistSession, loadPersistedSession } from "./storage";
import { FIRESTORE_BATCH_SIZE } from "./constants";
import type { STTSessionState, TrialResultRecord, TrialResultType } from "./types";

type StartSessionParams = {
  studentId: string;
  objectiveId: string;
  objectiveName?: string;
  trialCount: number;
};

export function useTrialSession() {
  const [session, setSession] = useState<STTSessionState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const pendingSyncRef = useRef<TrialResultRecord[]>([]);
  const syncInProgressRef = useRef(false);

  const flushPendingTrials = useCallback(async (sessionId: string, trials: TrialResultRecord[]) => {
    if (trials.length === 0) return;
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    setIsSyncing(true);
    try {
      await writeTrialsBatch(sessionId, trials);
      pendingSyncRef.current = pendingSyncRef.current.filter(
        (t) => !trials.some((w) => w.trialIndex === t.trialIndex)
      );
    } catch {
      pendingSyncRef.current = [...pendingSyncRef.current, ...trials];
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const startSession = useCallback(async (params: StartSessionParams) => {
    const uid = auth?.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    const sessionId = await createSession({
      studentId: params.studentId,
      objectiveId: params.objectiveId,
      therapistId: uid,
      trialCount: params.trialCount,
    });
    const state: STTSessionState = {
      sessionId,
      studentId: params.studentId,
      objectiveId: params.objectiveId,
      objectiveName: params.objectiveName,
      therapistId: uid,
      trialCount: params.trialCount,
      trialIndex: 0,
      trialResults: [],
      startTime: Date.now(),
      status: "active",
    };
    setSession(state);
    pendingSyncRef.current = [];
    await persistSession(state);
  }, []);

  const resumeSession = useCallback(async (): Promise<boolean> => {
    const restored = await loadPersistedSession();
    if (!restored || restored.status !== "active") return false;
    setSession(restored);
    pendingSyncRef.current = [];
    return true;
  }, []);

  const recordResult = useCallback(
    async (result: TrialResultType) => {
      const s = session;
      if (!s || s.status !== "active") return;
      const trialIndex = s.trialIndex;
      if (trialIndex >= s.trialCount) return;

      const record: TrialResultRecord = {
        trialIndex,
        result,
        timestamp: Date.now(),
      };
      const newResults = [...s.trialResults, record];
      const newIndex = trialIndex + 1;
      const isComplete = newIndex >= s.trialCount;
      const newState: STTSessionState = {
        ...s,
        trialIndex: newIndex,
        trialResults: newResults,
        status: isComplete ? "completed" : "active",
      };
      setSession(newState);
      await persistSession(newState);

      pendingSyncRef.current = [...pendingSyncRef.current, record];
      if (pendingSyncRef.current.length >= FIRESTORE_BATCH_SIZE) {
        const toWrite = pendingSyncRef.current.splice(0, FIRESTORE_BATCH_SIZE);
        void flushPendingTrials(s.sessionId, toWrite);
      }
      if (isComplete) {
        await flushPendingTrials(s.sessionId, [...pendingSyncRef.current]);
        pendingSyncRef.current = [];
        await markSessionCompleted(s.sessionId);
        await persistSession(null);
      }
    },
    [session, flushPendingTrials]
  );

  const endSession = useCallback(() => {
    setSession(null);
    pendingSyncRef.current = [];
    void persistSession(null);
  }, []);

  return {
    session,
    trialIndex: session?.trialIndex ?? 0,
    trialResults: session?.trialResults ?? [],
    trialCount: session?.trialCount ?? 0,
    isComplete: session?.status === "completed",
    isSyncing,
    recordResult,
    startSession,
    resumeSession,
    endSession,
  };
}
