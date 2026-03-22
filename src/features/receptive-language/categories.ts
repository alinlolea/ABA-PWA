export type ReceptiveCategory =
  | "animale_domestice"
  | "animale_salbatice"
  | "fructe"
  | "legume"
  | "obiecte";

export const RECEPTIVE_CATEGORIES: {
  key: ReceptiveCategory;
  label: string;
}[] = [
  { key: "animale_domestice", label: "Animale domestice" },
  { key: "animale_salbatice", label: "Animale sălbatice" },
  { key: "fructe", label: "Fructe" },
  { key: "legume", label: "Legume" },
  { key: "obiecte", label: "Obiecte" },
];
