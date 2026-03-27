/** Metro static requires for sort non-identical trial images. */
export type SortCategoryId =
  | "animale_domestice"
  | "animale_salbatice"
  | "caini"
  | "copaci"
  | "flori"
  | "fructe"
  | "legume"
  | "pasari";

export type SortPoolItem = { id: string; categoryId: SortCategoryId; image: number };

const POOL_ANIMALE_DOMESTICE: SortPoolItem[] = [
  { id: "caine", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/caine.png") },
  { id: "cal", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/cal.png") },
  { id: "capra", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/capra.png") },
  { id: "curcan", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/curcan.png") },
  { id: "gaina", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/gaina.png") },
  { id: "iepure", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/iepure.png") },
  { id: "magar", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/magar.png") },
  { id: "oaie", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/oaie.png") },
  { id: "pisica", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/pisica.png") },
  { id: "porc", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/porc.png") },
  { id: "rata", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/rata.png") },
  { id: "vaca", categoryId: "animale_domestice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-domestice/vaca.png") },
];

const POOL_ANIMALE_SALBATICE: SortPoolItem[] = [
  { id: "cangur", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/cangur.png") },
  { id: "crocodil", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/crocodil.png") },
  { id: "girafa", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/girafa.png") },
  { id: "leu", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/leu.png") },
  { id: "lup", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/lup.png") },
  { id: "maimuta", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/maimuta.png") },
  { id: "tigru", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/tigru.png") },
  { id: "urs", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/urs.png") },
  { id: "vulpe", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/vulpe.png") },
  { id: "zebra", categoryId: "animale_salbatice", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/animale-salbatice/zebra.png") },
];

const POOL_CAINI: SortPoolItem[] = [
  { id: "caine1", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine1.png") },
  { id: "caine10", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine10.png") },
  { id: "caine2", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine2.png") },
  { id: "caine3", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine3.png") },
  { id: "caine4", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine4.png") },
  { id: "caine5", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine5.png") },
  { id: "caine6", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine6.png") },
  { id: "caine7", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine7.png") },
  { id: "caine8", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine8.png") },
  { id: "caine9", categoryId: "caini", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/caini/caine9.png") },
];

const POOL_COPACI: SortPoolItem[] = [
  { id: "copac1", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac1.png") },
  { id: "copac10", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac10.png") },
  { id: "copac2", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac2.png") },
  { id: "copac3", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac3.png") },
  { id: "copac4", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac4.png") },
  { id: "copac5", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac5.png") },
  { id: "copac6", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac6.png") },
  { id: "copac7", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac7.png") },
  { id: "copac8", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac8.png") },
  { id: "copac9", categoryId: "copaci", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/copaci/copac9.png") },
];

const POOL_FLORI: SortPoolItem[] = [
  { id: "floare1", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare1.png") },
  { id: "floare10", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare10.png") },
  { id: "floare2", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare2.png") },
  { id: "floare3", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare3.png") },
  { id: "floare4", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare4.png") },
  { id: "floare5", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare5.png") },
  { id: "floare6", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare6.png") },
  { id: "floare7", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare7.png") },
  { id: "floare8", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare8.png") },
  { id: "floare9", categoryId: "flori", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/flori/floare9.png") },
];

const POOL_FRUCTE: SortPoolItem[] = [
  { id: "ananas", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/ananas.png") },
  { id: "banana", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/banana.png") },
  { id: "capsuna", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/capsuna.png") },
  { id: "cireasa", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/cireasa.png") },
  { id: "kiwi", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/kiwi.png") },
  { id: "lubenita", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/lubenita.png") },
  { id: "mango", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/mango.png") },
  { id: "mar", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/mar.png") },
  { id: "para", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/para.png") },
  { id: "pepene", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/pepene.png") },
  { id: "piersica", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/piersica.png") },
  { id: "portocala", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/portocala.png") },
  { id: "pruna", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/pruna.png") },
  { id: "struguri", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/struguri.png") },
  { id: "zmeura", categoryId: "fructe", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/fructe/zmeura.png") },
];

const POOL_LEGUME: SortPoolItem[] = [
  { id: "ardei", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/ardei.png") },
  { id: "broccoli", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/broccoli.png") },
  { id: "cartof", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/cartof.png") },
  { id: "castravete", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/castravete.png") },
  { id: "ceapa", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/ceapa.png") },
  { id: "fasole", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/fasole.png") },
  { id: "mazare", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/mazare.png") },
  { id: "morcov", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/morcov.png") },
  { id: "porumb", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/porumb.png") },
  { id: "rosie", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/rosie.png") },
  { id: "usturoi", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/usturoi.png") },
  { id: "vanata", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/vanata.png") },
  { id: "varza", categoryId: "legume", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/legume/varza.png") },
];

const POOL_PASARI: SortPoolItem[] = [
  { id: "pasare1", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare1.png") },
  { id: "pasare10", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare10.png") },
  { id: "pasare11", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare11.png") },
  { id: "pasare2", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare2.png") },
  { id: "pasare3", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare3.png") },
  { id: "pasare4", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare4.png") },
  { id: "pasare5", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare5.png") },
  { id: "pasare6", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare6.png") },
  { id: "pasare7", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare7.png") },
  { id: "pasare8", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare8.png") },
  { id: "pasare9", categoryId: "pasari", image: require("../../../assets/programe/discriminare-vizuala/sortare-itemi-non-identici/imagini/pasari/pasare9.png") },
];

export const SORT_POOL_BY_CATEGORY: Record<SortCategoryId, SortPoolItem[]> = {
  "animale_domestice": POOL_ANIMALE_DOMESTICE,
  "animale_salbatice": POOL_ANIMALE_SALBATICE,
  "caini": POOL_CAINI,
  "copaci": POOL_COPACI,
  "flori": POOL_FLORI,
  "fructe": POOL_FRUCTE,
  "legume": POOL_LEGUME,
  "pasari": POOL_PASARI,
};

export function getSortPool(categoryId: SortCategoryId): SortPoolItem[] {
  return SORT_POOL_BY_CATEGORY[categoryId] ?? [];
}

export const SORT_CATEGORY_LABELS: Record<SortCategoryId, string> = {
  animale_domestice: "Animale domestice",
  animale_salbatice: "Animale sălbatice",
  caini: "Câini",
  copaci: "Copaci",
  flori: "Flori",
  fructe: "Fructe",
  legume: "Legume",
  pasari: "Păsări",
};
