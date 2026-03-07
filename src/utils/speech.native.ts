import Tts from "react-native-tts";
import {
  SPEECH_LANG,
  type SpeechStyle,
  SPEECH_STYLE_PRESETS,
  normalizeSpeechResult,
} from "./speechConfig";

/**
 * Native (Android/iOS): use react-native-tts.
 */
export { SPEECH_LANG, normalizeSpeechResult };
export type { SpeechStyle };

export function getConfiguredSpeechRecognition(): null {
  return null;
}

export function initSpeech(): void {
  Tts.setDefaultLanguage("ro-RO");
  Tts.setDefaultRate(1.05);
}

export function stopSpeech(): void {
  Tts.stop();
}

/** Centralized speak(text, style). Applies same style presets as web. */
export function speak(text: string, style?: SpeechStyle): void {
  const preset = style ? SPEECH_STYLE_PRESETS[style] : null;
  const rate = preset?.rate ?? 1.05;
  const pitch = preset?.pitch ?? 0.95;
  Tts.speak(text, { rate, pitch });
}
