/**
 * Shared speech configuration and helpers for Romanian.
 * Used by both TTS and STT so all speech features default to Romanian.
 */

export const SPEECH_LANG = "ro-RO";

/** Speech style presets for therapy prompts (rate, pitch). */
export type SpeechStyle =
  | "praise"
  | "instruction"
  | "instructionSubtle"
  | "instructionCe"
  | "instructionRest"
  | "neutral";

export const SPEECH_STYLE_PRESETS: Record<
  SpeechStyle,
  { rate: number; pitch: number }
> = {
  praise: { rate: 1.1, pitch: 1.05 },
  instruction: { rate: 1.0, pitch: 0.95 },
  instructionSubtle: { rate: 0.93, pitch: 1.1 },
  /** Interrogative "Ce" – higher pitch. */
  instructionCe: { rate: 1.0, pitch: 1.2 },
  /** Rest of question " culoare este?" – lower pitch, slightly slower. */
  instructionRest: { rate: 0.95, pitch: 0.95 },
  neutral: { rate: 1.0, pitch: 1.0 },
};

const ROMANIAN_DIACRITICS: [RegExp, string][] = [
  [/ș/g, "s"], [/ş/g, "s"],
  [/ț/g, "t"], [/ţ/g, "t"],
  [/ă/g, "a"], [/â/g, "a"], [/î/g, "i"],
];

/**
 * Normalize speech recognition text for comparison.
 * - Converts to lowercase.
 * - Removes Romanian diacritics so e.g. "roșu" and "rosu" are equivalent.
 */
export function normalizeSpeechResult(text: string): string {
  if (typeof text !== "string") return "";
  let out = text.trim().toLowerCase();
  for (const [re, replacement] of ROMANIAN_DIACRITICS) {
    out = out.replace(re, replacement);
  }
  return out.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
