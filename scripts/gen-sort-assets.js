const fs = require("fs");
const path = require("path");

const base = "assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini";
const folders = ["caini", "copaci", "flori", "masini", "pasari", "pesti", "scaune"];
const idMap = {
  caini: "caini",
  copaci: "copaci",
  flori: "flori",
  masini: "masini",
  pasari: "pasari",
  pesti: "pesti",
  scaune: "scaune",
};

const categoryLabels = {
  caini: "Câini",
  copaci: "Copaci",
  flori: "Flori",
  masini: "Mașini",
  pasari: "Păsări",
  pesti: "Pești",
  scaune: "Scaune",
};

let out = "";
out += "/** Metro static requires for sort non-identical trial images. */\n";
out +=
  'export type SortNonIdenticalCategoryId =\n  | "' +
  Object.values(idMap).join('"\n  | "') +
  '";\n\n';
out += "export type SortPoolItem = { id: string; categoryId: SortNonIdenticalCategoryId; image: number };\n\n";

for (const f of folders) {
  const cid = idMap[f];
  const dir = path.join(__dirname, "..", base, f);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const files = fs.readdirSync(dir).filter((x) => x.endsWith(".png")).sort();
  out += `const POOL_${cid.toUpperCase()}: SortPoolItem[] = [\n`;
  for (const file of files) {
    const baseName = file.replace(/\.png$/, "");
    const reqPath = "../../../" + path.join(base, f, file).replace(/\\/g, "/");
    out += `  { id: "${baseName}", categoryId: "${cid}", image: require("${reqPath}") },\n`;
  }
  out += "];\n\n";
}

out += "export const SORT_POOL_BY_CATEGORY: Record<SortNonIdenticalCategoryId, SortPoolItem[]> = {\n";
for (const f of folders) {
  const cid = idMap[f];
  out += `  "${cid}": POOL_${cid.toUpperCase()},\n`;
}
out += "};\n\n";
out +=
  "export function getSortPool(categoryId: SortNonIdenticalCategoryId): SortPoolItem[] {\n";
out += "  return SORT_POOL_BY_CATEGORY[categoryId] ?? [];\n";
out += "}\n\n";
out += "export const SORT_CATEGORY_LABELS: Record<SortNonIdenticalCategoryId, string> = {\n";
for (const f of folders) {
  const cid = idMap[f];
  out += `  ${cid}: "${categoryLabels[cid]}",\n`;
}
out += "};\n";

const outPath = path.join(__dirname, "..", "src/features/sort-non-identical/sortNonIdenticalAssets.ts");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);
console.log("Wrote", outPath);
