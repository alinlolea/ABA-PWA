const fs = require("fs");
const path = require("path");

const base = "assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini";
const folders = ["animale-domestice", "animale-salbatice", "fructe", "legume", "haine"];
const idMap = {
  "animale-domestice": "animale_domestice",
  "animale-salbatice": "animale_salbatice",
  fructe: "fructe",
  legume: "legume",
  haine: "haine",
};

const categoryLabels = {
  animale_domestice: "Animale domestice",
  animale_salbatice: "Animale sălbatice",
  fructe: "Fructe",
  legume: "Legume",
  haine: "Haine",
};

let out = "";
out += "/** Metro static requires for Sortare pe categorie trial images. */\n";
out +=
  'export type SortPeCategorieCategoryId =\n  | "' +
  Object.values(idMap).join('"\n  | "') +
  '";\n\n';
out += "export type SortPeCategoriePoolItem = { id: string; categoryId: SortPeCategorieCategoryId; image: number };\n\n";

for (const f of folders) {
  const cid = idMap[f];
  const dir = path.join(__dirname, "..", base, f);
  const files = fs.readdirSync(dir).filter((x) => x.endsWith(".png")).sort();
  out += `const POOL_${cid.toUpperCase()}: SortPeCategoriePoolItem[] = [\n`;
  for (const file of files) {
    const baseName = file.replace(/\.png$/, "");
    const reqPath = "../../../" + path.join(base, f, file).replace(/\\/g, "/");
    out += `  { id: "${baseName}", categoryId: "${cid}", image: require("${reqPath}") },\n`;
  }
  out += "];\n\n";
}

out += "export const SORT_PE_CATEGORIE_POOL_BY_CATEGORY: Record<SortPeCategorieCategoryId, SortPeCategoriePoolItem[]> = {\n";
for (const f of folders) {
  const cid = idMap[f];
  out += `  "${cid}": POOL_${cid.toUpperCase()},\n`;
}
out += "};\n\n";
out +=
  "export function getSortPeCategoriePool(categoryId: SortPeCategorieCategoryId): SortPeCategoriePoolItem[] {\n";
out += "  return SORT_PE_CATEGORIE_POOL_BY_CATEGORY[categoryId] ?? [];\n";
out += "}\n\n";
out += "export const SORT_PE_CATEGORIE_LABELS: Record<SortPeCategorieCategoryId, string> = {\n";
for (const f of folders) {
  const cid = idMap[f];
  out += `  ${cid}: "${categoryLabels[cid]}",\n`;
}
out += "};\n";

const outPath = path.join(__dirname, "..", "src/features/sort-pe-categorie/sortPeCategorieAssets.ts");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);
console.log("Wrote", outPath);
