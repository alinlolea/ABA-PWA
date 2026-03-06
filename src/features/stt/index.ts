/**
 * STT (Structured Teaching Trial) engine.
 * Tablet-first ABA therapy: fast single-tap trial recording, session recovery, batched Firestore sync.
 */
export { useTrialSession } from "./useTrialSession";
export { STTTrialScreen } from "./STTTrialScreen";
export { persistSession, loadPersistedSession } from "./storage";
export { TRIAL_RESULT_TYPES } from "./types";
export type {
  TrialResultType,
  TrialResultRecord,
  STTSessionState,
  SessionStatus,
} from "./types";
export { STT_SESSION_STORAGE_KEY, FIRESTORE_BATCH_SIZE } from "./constants";
