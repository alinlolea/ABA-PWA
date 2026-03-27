/**
 * Play locally stored audio prompts (e.g. assets/audio/bravo.mp3).
 * Uses expo-av: load, play once, unload.
 */
import { Audio } from "expo-av";

const ASSET_MAP: Record<string, number> = {
  bravo: require("../../assets/audio/Bravo.mp3"),
  grozav: require("../../assets/audio/Grozav.mp3"),
  foarte_bine: require("../../assets/audio/Foarte bine.mp3"),
  "ce-culoare-este": require("../../assets/audio/Ce culoare este.mp3"),
  continua: require("../../assets/audio/Continua.mp3"),
  gresit: require("../../assets/audio/Gresit.mp3"),
  "mai-incearca": require("../../assets/audio/Mai incearca.mp3"),
  /** Alias (underscore) for prompts / code consistency */
  mai_incearca: require("../../assets/audio/Mai incearca.mp3"),
  "construieste-la-fel": require("../../assets/audio/Construieste la fel.mp3"),
  "construieste-turn": require("../../assets/audio/Construieste turn.mp3"),
  potriveste: require("../../assets/audio/Potrivește.mp3"),
  potriveste_perechea: require("../../assets/audio/Potriveste perechea.mp3"),
  "pune-la-fel": require("../../assets/audio/Pune la fel.mp3"),
  sorteaza: require("../../assets/audio/Sorteaza.mp3"),
};

export async function playAudio(name: string): Promise<void> {
  const source = ASSET_MAP[name];
  if (source == null) return;

  const { sound } = await Audio.Sound.createAsync(source);
  try {
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          resolve();
        }
      });
      sound.playAsync();
    });
  } finally {
    await sound.unloadAsync();
  }
}

const SUCCESS_FEEDBACK_KEYS = ["bravo", "grozav", "foarte_bine"] as const;
const ERROR_FEEDBACK_KEYS = ["gresit", "mai_incearca"] as const;

function pickRandomFeedbackKey<const T extends readonly string[]>(keys: T): T[number] {
  return keys[Math.floor(Math.random() * keys.length)]!;
}

/** Random positive reinforcement clip each time (no fixed cycle). */
export async function playSuccessAudio(): Promise<void> {
  await playAudio(pickRandomFeedbackKey(SUCCESS_FEEDBACK_KEYS));
}

/** Random error clip each time (no fixed alternation). */
export async function playErrorAudio(): Promise<void> {
  await playAudio(pickRandomFeedbackKey(ERROR_FEEDBACK_KEYS));
}
