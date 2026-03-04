/**
 * Injects PWA manifest link, meta tags, and service worker registration into dist/index.html after export.
 * Expo static export regenerates dist/index.html; this script runs after build so the manifest is linked.
 */
const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "..", "dist", "index.html");

const MANIFEST_LINK = '<link rel="manifest" href="/manifest.json">';
const headInject = [
  '<meta name="theme-color" content="#2563eb" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  MANIFEST_LINK,
].join("\n");

const swRegistrationScript =
  '<script>if(typeof window!=="undefined"&&"serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").then(function(){return navigator.serviceWorker.ready;}).catch(function(err){console.log("SW registration failed",err);});});}</script>';

function hasManifestLink(html) {
  return (
    html.includes('rel="manifest"') &&
    (html.includes('href="/manifest.json"') || html.includes("href='/manifest.json'"))
  );
}

try {
  let html = fs.readFileSync(distPath, "utf8");
  const needsHead = !hasManifestLink(html) || !html.includes("theme-color");
  const needsSw = !html.includes("serviceWorker");
  let updated = false;

  if (needsHead) {
    // Inject before </head> so the manifest link is inside <head>
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${headInject}\n</head>`);
      updated = true;
    } else {
      console.error("Could not find </head> in dist/index.html");
      process.exit(1);
    }
  }
  if (needsSw) {
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${swRegistrationScript}\n</body>`);
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(distPath, html);
    console.log("Injected PWA config into dist/index.html (manifest link is in <head>)");
  } else {
    console.log("PWA config already present in dist/index.html");
  }

  // Verify manifest link is in the output
  const finalHtml = fs.readFileSync(distPath, "utf8");
  if (!hasManifestLink(finalHtml)) {
    console.error("Verification failed: <link rel=\"manifest\" href=\"/manifest.json\"> not found in dist/index.html");
    process.exit(1);
  }
  console.log("Verified: manifest link present in dist/index.html");
} catch (err) {
  console.error("Failed to inject PWA config:", err.message);
  process.exit(1);
}
