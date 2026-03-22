/**
 * Trim transparent borders from logical-association PNGs (and other rasters) so
 * assets have a tight bounding box. Run: npm run trim:images
 *
 * Optional: TRIM_MAX_SIDE=512 — after trim, scale so longest side ≤ 512 (fit: inside, no upscale).
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IMAGES_DIR = path.join(
  __dirname,
  "..",
  "assets",
  "programe",
  "discriminare-vizuala",
  "asociere-logica-imagini",
  "imagini"
);

const EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function processFile(filePath, baseName) {
  const ext = path.extname(baseName).toLowerCase();
  const maxSide = parseInt(process.env.TRIM_MAX_SIDE || "0", 10);

  let pipeline = sharp(filePath).trim();

  if (Number.isFinite(maxSide) && maxSide > 0) {
    pipeline = pipeline.resize(maxSide, maxSide, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let buffer;
  if (ext === ".png") {
    buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  } else if (ext === ".jpg" || ext === ".jpeg") {
    buffer = await pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  } else if (ext === ".webp") {
    buffer = await pipeline.webp({ quality: 92 }).toBuffer();
  } else {
    buffer = await pipeline.toBuffer();
  }

  fs.writeFileSync(filePath, buffer);
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error("Directory not found:", IMAGES_DIR);
    process.exit(1);
  }

  const names = fs.readdirSync(IMAGES_DIR);
  const files = names.filter((n) => EXTENSIONS.has(path.extname(n).toLowerCase()));

  if (files.length === 0) {
    console.log("No images found in", IMAGES_DIR);
    return;
  }

  console.log("Trimming", files.length, "file(s) in", IMAGES_DIR);
  if (process.env.TRIM_MAX_SIDE) {
    console.log("TRIM_MAX_SIDE=", process.env.TRIM_MAX_SIDE, "(fit: inside, no enlargement)");
  }

  for (const name of files) {
    const filePath = path.join(IMAGES_DIR, name);
    try {
      const meta = await sharp(filePath).metadata();
      await processFile(filePath, name);
      const metaAfter = await sharp(filePath).metadata();
      console.log(
        "OK",
        name,
        `(${meta.width}×${meta.height} → ${metaAfter.width}×${metaAfter.height})`
      );
    } catch (err) {
      console.error("FAIL", name, err.message);
      process.exitCode = 1;
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
