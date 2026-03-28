/** Metro static requires for Sortare pe categorie trial images. */
export type SortPeCategorieCategoryId =
  | "animale_domestice"
  | "animale_salbatice"
  | "fructe"
  | "legume"
  | "haine";

export type SortPeCategoriePoolItem = { id: string; categoryId: SortPeCategorieCategoryId; image: number };

const POOL_ANIMALE_DOMESTICE: SortPeCategoriePoolItem[] = [
  { id: "caine", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/caine.png") },
  { id: "cal", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/cal.png") },
  { id: "capra", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/capra.png") },
  { id: "curcan", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/curcan.png") },
  { id: "gaina", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/gaina.png") },
  { id: "iepure", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/iepure.png") },
  { id: "magar", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/magar.png") },
  { id: "oaie", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/oaie.png") },
  { id: "pisica", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/pisica.png") },
  { id: "porc", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/porc.png") },
  { id: "rata", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/rata.png") },
  { id: "vaca", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-domestice/vaca.png") },
];

const POOL_ANIMALE_SALBATICE: SortPeCategoriePoolItem[] = [
  { id: "cangur", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/cangur.png") },
  { id: "crocodil", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/crocodil.png") },
  { id: "girafa", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/girafa.png") },
  { id: "leu", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/leu.png") },
  { id: "lup", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/lup.png") },
  { id: "maimuta", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/maimuta.png") },
  { id: "tigru", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/tigru.png") },
  { id: "urs", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/urs.png") },
  { id: "vulpe", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/vulpe.png") },
  { id: "zebra", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/animale-salbatice/zebra.png") },
];

const POOL_FRUCTE: SortPeCategoriePoolItem[] = [
  { id: "ananas", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/ananas.png") },
  { id: "banana", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/banana.png") },
  { id: "capsuna", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/capsuna.png") },
  { id: "cireasa", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/cireasa.png") },
  { id: "kiwi", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/kiwi.png") },
  { id: "lubenita", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/lubenita.png") },
  { id: "mango", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/mango.png") },
  { id: "mar", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/mar.png") },
  { id: "para", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/para.png") },
  { id: "pepene", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/pepene.png") },
  { id: "piersica", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/piersica.png") },
  { id: "portocala", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/portocala.png") },
  { id: "pruna", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/pruna.png") },
  { id: "struguri", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/struguri.png") },
  { id: "zmeura", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/fructe/zmeura.png") },
];

const POOL_LEGUME: SortPeCategoriePoolItem[] = [
  { id: "ardei", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/ardei.png") },
  { id: "broccoli", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/broccoli.png") },
  { id: "cartof", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/cartof.png") },
  { id: "castravete", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/castravete.png") },
  { id: "ceapa", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/ceapa.png") },
  { id: "fasole", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/fasole.png") },
  { id: "mazare", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/mazare.png") },
  { id: "morcov", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/morcov.png") },
  { id: "porumb", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/porumb.png") },
  { id: "rosie", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/rosie.png") },
  { id: "usturoi", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/usturoi.png") },
  { id: "vanata", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/vanata.png") },
  { id: "varza", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/legume/varza.png") },
];

const POOL_HAINE: SortPeCategoriePoolItem[] = [
  { id: "haine1", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine1.png") },
  { id: "haine2", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine2.png") },
  { id: "haine3", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine3.png") },
  { id: "haine4", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine4.png") },
  { id: "haine5", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine5.png") },
  { id: "haine6", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine6.png") },
  { id: "haine7", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine7.png") },
  { id: "haine8", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine8.png") },
  { id: "haine9", categoryId: "haine", image: require("../../../assets/programe/discriminare-vizuala/sortare-pe-categorie/imagini/haine/haine9.png") },
];

export const SORT_PE_CATEGORIE_POOL_BY_CATEGORY: Record<SortPeCategorieCategoryId, SortPeCategoriePoolItem[]> = {
  "animale_domestice": POOL_ANIMALE_DOMESTICE,
  "animale_salbatice": POOL_ANIMALE_SALBATICE,
  "fructe": POOL_FRUCTE,
  "legume": POOL_LEGUME,
  "haine": POOL_HAINE,
};

export function getSortPeCategoriePool(categoryId: SortPeCategorieCategoryId): SortPeCategoriePoolItem[] {
  return SORT_PE_CATEGORIE_POOL_BY_CATEGORY[categoryId] ?? [];
}

export const SORT_PE_CATEGORIE_LABELS: Record<SortPeCategorieCategoryId, string> = {
  animale_domestice: "Animale domestice",
  animale_salbatice: "Animale sălbatice",
  fructe: "Fructe",
  legume: "Legume",
  haine: "Haine",
};
