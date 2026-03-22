import { Audio } from "expo-av";

/**
 * Play a bundled audio module once, then unload. Serialized use avoids overlap.
 */
export async function playAudioModule(assetModule: number): Promise<void> {
  const { sound } = await Audio.Sound.createAsync(assetModule);
  try {
    await new Promise<void>((resolve, reject) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if ("error" in status && status.error) {
          reject(new Error(String(status.error)));
          return;
        }
        if (status.didJustFinish) {
          resolve();
        }
      });
      sound.playAsync().catch(reject);
    });
  } finally {
    await sound.unloadAsync().catch(() => {});
  }
}
