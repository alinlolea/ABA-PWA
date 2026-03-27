/** Metro static requires for sort non-identical trial images. */
export type SortNonIdenticalCategoryId =
  | "caini"
  | "copaci"
  | "flori"
  | "pasari";

export type SortPoolItem = { id: string; categoryId: SortNonIdenticalCategoryId; image: number };

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

export const SORT_POOL_BY_CATEGORY: Record<SortNonIdenticalCategoryId, SortPoolItem[]> = {
  "caini": POOL_CAINI,
  "copaci": POOL_COPACI,
  "flori": POOL_FLORI,
  "pasari": POOL_PASARI,
};

export function getSortPool(categoryId: SortNonIdenticalCategoryId): SortPoolItem[] {
  return SORT_POOL_BY_CATEGORY[categoryId] ?? [];
}

export const SORT_CATEGORY_LABELS: Record<SortNonIdenticalCategoryId, string> = {
  caini: "Câini",
  copaci: "Copaci",
  flori: "Flori",
  pasari: "Păsări",
};
