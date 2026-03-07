/**
 * Application version for display in the UI.
 * Format: v1.0.<buildNumber> when EXPO_PUBLIC_BUILD_VERSION is set (e.g. on Vercel);
 * v1.0.dev when running locally.
 *
 * Expo only exposes env vars prefixed with EXPO_PUBLIC_ to the client bundle.
 * Set during build: export EXPO_PUBLIC_BUILD_VERSION=$(git rev-list --count HEAD)
 */

const BASE_VERSION = "1.0";

export function getAppVersion(): string {
  const buildNumber =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BUILD_VERSION;
  if (buildNumber != null && String(buildNumber).trim() !== "") {
    return `v${BASE_VERSION}.${String(buildNumber).trim()}`;
  }
  return `v${BASE_VERSION}.dev`;
}
