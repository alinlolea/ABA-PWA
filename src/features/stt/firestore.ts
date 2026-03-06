/**
 * Firestore sync for STT sessions and trials.
 * Batched writes to keep UI fast; session doc created at start, trials batched.
 */
import { auth, db } from "@/config/firebase";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { COLLECTIONS } from "./constants";
import type { STTSessionState, TrialResultRecord } from "./types";

/** Create session document with auto ID; returns the new session ID. */
export async function createSession(params: {
  studentId: string;
  objectiveId: string;
  therapistId: string;
  trialCount: number;
}): Promise<string> {
  const ref = doc(collection(db, COLLECTIONS.sessions));
  const sessionId = ref.id;
  await setDoc(ref, {
    studentId: params.studentId,
    therapistId: params.therapistId,
    objectiveId: params.objectiveId,
    trialCount: params.trialCount,
    startTime: serverTimestamp(),
    status: "active",
  });
  return sessionId;
}

export async function writeTrialsBatch(
  sessionId: string,
  trials: TrialResultRecord[]
): Promise<void> {
  if (trials.length === 0) return;
  const trialsRef = collection(db, COLLECTIONS.sessions, sessionId, COLLECTIONS.trials);
  const batch = writeBatch(db);
  for (const t of trials) {
    const docRef = doc(trialsRef);
    batch.set(docRef, {
      trialIndex: t.trialIndex,
      result: t.result,
      timestamp: t.timestamp,
      ...(t.promptLevel != null && { promptLevel: t.promptLevel }),
      ...(t.latencyMs != null && { latencyMs: t.latencyMs }),
      ...(t.notes != null && { notes: t.notes }),
    });
  }
  await batch.commit();
}

export async function markSessionCompleted(sessionId: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.sessions, sessionId);
  await updateDoc(ref, { status: "completed", completedAt: serverTimestamp() });
}
