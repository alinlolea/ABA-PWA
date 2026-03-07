/**
 * Web: use browser Web Speech API. TTS and STT configured for Romanian (ro-RO).
 */
import { SPEECH_LANG, normalizeSpeechResult } from "./speechConfig";

export { SPEECH_LANG, normalizeSpeechResult };

let cachedRomanianVoice: SpeechSynthesisVoice | null = null;

function getRomanianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ro = voices.filter((v) => v.lang === "ro-RO" || v.lang.startsWith("ro-"));
  if (ro.length === 0) return null;
  const googleFirst = [...ro].sort((a, b) => {
    const aGoogle = /google/i.test(a.name || "");
    const bGoogle = /google/i.test(b.name || "");
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

/** Default TTS values enforced so device settings don't override app behavior. */
const DEFAULT_RATE = 1.1;
const DEFAULT_PITCH = 1.0;
const DEFAULT_VOLUME = 1;

/**
 * Speak text using app TTS configuration. Use this for all speech in the app.
 * Enforces Romanian voice, rate, pitch, and volume regardless of device defaults.
 */
export function speak(
  text: string,
  options?: { pitch?: number; rate?: number; volume?: number }
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (!cachedRomanianVoice) cachedRomanianVoice = getRomanianVoice();
  if (cachedRomanianVoice) utterance.voice = cachedRomanianVoice;
  utterance.lang = SPEECH_LANG;
  utterance.rate = options?.rate ?? DEFAULT_RATE;
  utterance.pitch = options?.pitch ?? DEFAULT_PITCH;
  utterance.volume = options?.volume ?? DEFAULT_VOLUME;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
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
