/**
 * Generates src/version.json from Git commit count. Run before expo export.
 * On success: 1.0.<count>. On failure (e.g. not a repo): 1.0.dev.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const outPath = path.join(__dirname, "..", "src", "version.json");

try {
  try {
    execSync("git fetch --unshallow", { encoding: "utf-8", stdio: "pipe" });
  } catch {
    // Not shallow or fetch failed – continue
  }

  const commitCount = execSync("git rev-list --count HEAD").toString().trim();
  const version = `1.0.${commitCount}`;

  fs.writeFileSync(outPath, JSON.stringify({ version }, null, 2) + "\n", "utf-8");
  console.log("Generated version:", version);
} catch (err) {
  console.error("Version generation failed:", err);
  fs.writeFileSync(outPath, JSON.stringify({ version: "1.0.dev" }, null, 2) + "\n", "utf-8");
  console.log("Wrote fallback version: 1.0.dev");
}
