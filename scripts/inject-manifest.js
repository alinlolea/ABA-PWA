/**
 * Injects PWA manifest link into dist/index.html after export.
 * Expo static export generates its own HTML; this ensures the manifest is loaded.
 */
const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "..", "dist", "index.html");
const manifestTag = '<link rel="manifest" href="/manifest.json" />';

try {
  let html = fs.readFileSync(distPath, "utf8");
  if (html.includes("manifest.json")) {
    console.log("Manifest link already present in index.html");
    process.exit(0);
    return;
  }
  html = html.replace("</head>", `${manifestTag}\n</head>`);
  fs.writeFileSync(distPath, html);
  console.log("Injected manifest link into dist/index.html");
} catch (err) {
  console.error("Failed to inject manifest:", err.message);
  process.exit(1);
}
