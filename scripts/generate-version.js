/**
 * Generates src/version.json with version from Git commit count.
 * Run before expo export so the bundle gets the deployment version.
 * On Vercel: 1.0.<count>. If git fails (e.g. not a repo): 1.0.dev.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const outPath = path.join(__dirname, "..", "src", "version.json");

try {
  execSync("git fetch --unshallow", { encoding: "utf-8", stdio: "pipe" });
} catch {
  // Not a shallow clone, or not a git repo, or fetch failed – continue
}

let buildNumber;
try {
  buildNumber = execSync("git rev-list --count HEAD", { encoding: "utf-8" }).trim();
} catch {
  buildNumber = "dev";
}

const version = buildNumber === "dev" ? "1.0.dev" : `1.0.${buildNumber}`;
const content = JSON.stringify({ version }, null, 2) + "\n";

fs.writeFileSync(outPath, content, "utf-8");
console.log("Generated", outPath, "→", version);
