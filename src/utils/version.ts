/**
 * Application version for display in the UI.
 * Format: v1.0.<buildNumber> when APP_BUILD_VERSION is set (e.g. on Vercel);
 * v1.0.dev when running locally.
 *
 * Set APP_BUILD_VERSION during build, e.g.:
 *   APP_BUILD_VERSION=$(git rev-list --count HEAD) npx expo export --platform web
 */

const BASE_VERSION = "1.0";

export function getAppVersion(): string {
  const buildNumber =
    typeof process !== "undefined" && process.env?.APP_BUILD_VERSION;
  if (buildNumber != null && String(buildNumber).trim() !== "") {
    return `v${BASE_VERSION}.${String(buildNumber).trim()}`;
  }
  return `v${BASE_VERSION}.dev`;
}
