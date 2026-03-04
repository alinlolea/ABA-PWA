import Tts from "react-native-tts";

/**
 * Native (Android/iOS): use react-native-tts.
 */

export function initSpeech(): void {
  Tts.setDefaultLanguage("ro-RO");
  Tts.setDefaultRate(0.5);
}

export function stopSpeech(): void {
  Tts.stop();
}

export function speak(
  text: string,
  options?: { pitch?: number; rate?: number }
): void {
  Tts.speak(text, {
    pitch: options?.pitch ?? 1.0,
    rate: options?.rate ?? 0.5,
  });
}
