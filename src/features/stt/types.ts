/**
 * STT (Structured Teaching Trial) engine types.
 * Tablet-first ABA therapy: fast single-tap trial recording.
 */

export const TRIAL_RESULT_TYPES = [
  "correct",
  "incorrect",
  "prompted",
  "no_response",
] as const;

export type TrialResultType = (typeof TRIAL_RESULT_TYPES)[number];

export type TrialResultRecord = {
  trialIndex: number;
  result: TrialResultType;
  timestamp: number;
  /** Optional: prompt level (future) */
  promptLevel?: string;
  /** Optional: latency in ms (future) */
  latencyMs?: number;
  /** Optional: therapist notes (future) */
  notes?: string;
};

export type SessionStatus = "active" | "completed" | "paused";

export type STTSessionState = {
  sessionId: string;
  studentId: string;
  objectiveId: string;
  objectiveName?: string;
  therapistId: string;
  trialCount: number;
  trialIndex: number;
  trialResults: TrialResultRecord[];
  startTime: number;
  status: SessionStatus;
};

export type STTSessionMeta = Pick<
  STTSessionState,
  "sessionId" | "studentId" | "objectiveId" | "therapistId" | "trialCount" | "startTime" | "status"
>;
