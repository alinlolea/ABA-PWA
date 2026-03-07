/**
 * Web: use browser Web Speech API. TTS and STT configured for Romanian (ro-RO).
 */
import {
  SPEECH_LANG,
  type SpeechStyle,
  SPEECH_STYLE_PRESETS,
  normalizeSpeechResult,
} from "./speechConfig";

export { SPEECH_LANG, normalizeSpeechResult };
export type { SpeechStyle };

let cachedRomanianVoice: SpeechSynthesisVoice | null = null;

/** Filter Romanian (ro-RO), prefer voices containing "Google". */
function getRomanianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ro = voices.filter((v) => v.lang === "ro-RO");
  if (ro.length === 0) return null;
  const googleFirst = [...ro].sort((a, b) => {
    const aGoogle = (a.name || "").toLowerCase().includes("google");
    const bGoogle = (b.name || "").toLowerCase().includes("google");
    if (aGoogle && !bGoogle) return -1;
    if (!aGoogle && bGoogle) return 1;
    return 0;
  });
  return googleFirst[0] ?? null;
}

export function initSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedRomanianVoice = getRomanianVoice();
  } else {
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        cachedRomanianVoice = getRomanianVoice();
      },
      { once: true }
    );
  }
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** Default TTS for natural Romanian (consistent across devices). */
const DEFAULT_RATE = 1.05;
const DEFAULT_PITCH = 0.95;
const DEFAULT_VOLUME = 1;

/**
 * Centralized speak(text, style). Use for all therapy prompts.
 * Selects Romanian voice (prefer Google), applies style preset, then speechSynthesis.speak().
 */
export function speak(text: string, style?: SpeechStyle): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const preset = style ? SPEECH_STYLE_PRESETS[style] : null;
  const rate = preset?.rate ?? DEFAULT_RATE;
  const pitch = preset?.pitch ?? DEFAULT_PITCH;
  const utterance = new SpeechSynthesisUtterance(text);
  if (!cachedRomanianVoice) cachedRomanianVoice = getRomanianVoice();
  if (cachedRomanianVoice) utterance.voice = cachedRomanianVoice;
  utterance.lang = SPEECH_LANG;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = DEFAULT_VOLUME;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/** Speak and resolve when TTS ends. Use to sequence TTS then STT without overlap. */
export function speakAndWait(text: string, style?: SpeechStyle): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
  const preset = style ? SPEECH_STYLE_PRESETS[style] : null;
  const rate = preset?.rate ?? DEFAULT_RATE;
  const pitch = preset?.pitch ?? DEFAULT_PITCH;
  const utterance = new SpeechSynthesisUtterance(text);
  if (!cachedRomanianVoice) cachedRomanianVoice = getRomanianVoice();
  if (cachedRomanianVoice) utterance.voice = cachedRomanianVoice;
  utterance.lang = SPEECH_LANG;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = DEFAULT_VOLUME;
  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

const RecognitionCtor =
  typeof window !== "undefined"
    ? (window.SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
          .webkitSpeechRecognition)
    : null;

/**
 * Returns a SpeechRecognition instance configured for Romanian (ro-RO).
 * Use for all STT in the app. Returns null if the API is not available.
 */
export function getConfiguredSpeechRecognition(): SpeechRecognition | null {
  if (!RecognitionCtor) return null;
  const recognition = new RecognitionCtor();
  recognition.lang = SPEECH_LANG;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;
  return recognition;
}
