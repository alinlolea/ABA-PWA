/**
 * Generates public/icon-192.png (192x192) and public/icon-512.png (512x512)
 * with background #2563eb and centered white text "ABA".
 */
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");

function createSvg(size) {
  const fontSize = Math.round(size * 0.35);
  const y = size * 0.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="${size / 2}" y="${y}" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif">ABA</text>
</svg>`;
}

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("Run: npm install --save-dev sharp");
    process.exit(1);
  }

  for (const size of [192, 512]) {
    const svg = createSvg(size);
    const outPath = path.join(publicDir, `icon-${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Created ${outPath} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
