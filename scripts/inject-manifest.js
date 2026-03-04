/**
 * Injects PWA manifest link, meta tags, and service worker registration into dist/index.html after export.
 * Expo static export generates its own HTML; this ensures PWA install works.
 */
const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "..", "dist", "index.html");

const headInject = [
  '<meta name="theme-color" content="#2563eb" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<link rel="manifest" href="/manifest.json" />',
].join("\n");

const swRegistrationScript =
  '<script>if(typeof window!=="undefined"&&"serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(err){console.log("SW registration failed",err);});});}</script>';

try {
  let html = fs.readFileSync(distPath, "utf8");
  const needsHead = !html.includes("manifest.json") || !html.includes("theme-color");
  const needsSw = !html.includes("serviceWorker");

  if (needsHead) {
    html = html.replace("</head>", `${headInject}\n</head>`);
  }
  if (needsSw) {
    html = html.replace("</body>", `${swRegistrationScript}\n</body>`);
  }

  if (needsHead || needsSw) {
    fs.writeFileSync(distPath, html);
    console.log("Injected PWA manifest, meta tags, and service worker into dist/index.html");
  } else {
    console.log("PWA tags already present in index.html");
  }
} catch (err) {
  console.error("Failed to inject PWA config:", err.message);
  process.exit(1);
}
