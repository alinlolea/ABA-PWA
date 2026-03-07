/**
 * Application version for display in the UI.
 * Read from src/version.json generated during build (scripts/generate-version.js).
 * Vercel: v1.0.<count>. Local/default: v1.0.dev.
 */

import versionData from "@/version.json";

export function getAppVersion(): string {
  const v = versionData?.version;
  return v != null && String(v).trim() !== "" ? `v${String(v).trim()}` : "v1.0.dev";
}
