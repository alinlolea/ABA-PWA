/**
 * Generates public/icon-192.png and public/icon-512.png from the app logo
 * (same asset as the sidebar / login screen), centered on a white square.
 *
 * Run: node scripts/generate-pwa-icons.js
 * (requires devDependency `sharp`)
 */
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const logoPath = path.join(
  __dirname,
  "..",
  "assets",
  "images",
  "digital-aba-therapy-logo.png"
);

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("Run: npm install (devDependency sharp)");
    process.exit(1);
  }

  if (!fs.existsSync(logoPath)) {
    console.error("Logo not found:", logoPath);
    process.exit(1);
  }

  for (const size of [192, 512]) {
    const inner = Math.max(32, Math.floor(size * 0.82));
    const logoBuf = await sharp(logoPath)
      .resize({
        width: inner,
        height: inner,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    const outPath = path.join(publicDir, `icon-${size}.png`);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: logoBuf, gravity: "center" }])
      .png()
      .toFile(outPath);
    console.log(`Created ${outPath} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
