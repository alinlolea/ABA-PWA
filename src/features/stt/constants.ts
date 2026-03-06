/**
 * STT engine constants.
 */

/** localStorage key for persisting active session (PWA recovery). */
export const STT_SESSION_STORAGE_KEY = "aba_stt_session";

/** Number of trials to record before flushing a batch to Firestore. */
export const FIRESTORE_BATCH_SIZE = 5;

/** Firestore collection names. */
export const COLLECTIONS = {
  sessions: "sessions",
  trials: "trials",
} as const;
