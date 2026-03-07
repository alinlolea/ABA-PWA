/**
 * Generates version.json at project root from Vercel build id or fallbacks.
 * Run before expo export. Each deployment gets a unique version.
 */
const fs = require("fs");
const path = require("path");

let version = "1.0.dev";

try {
  const buildId =
    process.env.VERCEL_BUILD_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    Date.now().toString();

  const short = buildId.toString().substring(0, 6);

  version = `1.0.${short}`;
} catch (err) {
  console.error("Version generation failed:", err);
}

fs.writeFileSync(
  path.join(__dirname, "..", "version.json"),
  JSON.stringify({ version }, null, 2)
);

console.log("Generated version:", version);
