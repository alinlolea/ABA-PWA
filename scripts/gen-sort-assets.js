const fs = require("fs");
const path = require("path");

const base = "assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini";
const folders = [
  "animale-domestice",
  "animale-salbatice",
  "caini",
  "copaci",
  "flori",
  "fructe",
  "legume",
  "pasari",
];
const idMap = {
  "animale-domestice": "animale_domestice",
  "animale-salbatice": "animale_salbatice",
  caini: "caini",
  copaci: "copaci",
  flori: "flori",
  fructe: "fructe",
  legume: "legume",
  pasari: "pasari",
};

let out = "";
out += "/** Metro static requires for sort non-identical trial images. */\n";
out +=
  'export type SortCategoryId =\n  | "' +
  Object.values(idMap).join('"\n  | "') +
  '";\n\n';
out += "export type SortPoolItem = { id: string; categoryId: SortCategoryId; image: number };\n\n";

for (const f of folders) {
  const cid = idMap[f];
  const dir = path.join(__dirname, "..", base, f);
  const files = fs.readdirSync(dir).filter((x) => x.endsWith(".png")).sort();
  out += `const POOL_${cid.toUpperCase()}: SortPoolItem[] = [\n`;
  for (const file of files) {
    const baseName = file.replace(/\.png$/, "");
    const reqPath = "../../../" + path.join(base, f, file).replace(/\\/g, "/");
    out += `  { id: "${baseName}", categoryId: "${cid}", image: require("${reqPath}") },\n`;
  }
  out += "];\n\n";
}

out += "export const SORT_POOL_BY_CATEGORY: Record<SortCategoryId, SortPoolItem[]> = {\n";
for (const f of folders) {
  const cid = idMap[f];
  out += `  "${cid}": POOL_${cid.toUpperCase()},\n`;
}
out += "};\n\n";
out += "export function getSortPool(categoryId: SortCategoryId): SortPoolItem[] {\n";
out += "  return SORT_POOL_BY_CATEGORY[categoryId] ?? [];\n";
out += "}\n";

const outPath = path.join(__dirname, "..", "src/features/sort-non-identical/sortNonIdenticalAssets.ts");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);
console.log("Wrote", outPath);
