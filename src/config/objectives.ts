export type ObjectiveDefinition = {
  id: number;
  title: string;
  enabled: boolean;
  categories: {
    id: string;
    label: string;
  }[];
};

export const OBJECTIVES: ObjectiveDefinition[] = [
  {
    id: 1,
    title: "Potriviri 2D la 2D",
    enabled: true,
    categories: [
      { id: "colors", label: "Culori" },
      { id: "shapes", label: "Forme" },
      { id: "fruits", label: "Fructe" },
      { id: "vegetables", label: "Legume" },
      { id: "animals", label: "Animale" },
      { id: "vehicles", label: "Vehicule" },
      { id: "food", label: "Alimente" },
      { id: "objects", label: "Obiecte" },
    ],
  },
  { id: 2, title: "Sortare itemi non-identici", enabled: false, categories: [] },
  { id: 3, title: "Construcție cuburi peste model", enabled: false, categories: [] },
  { id: 4, title: "Construcție cuburi la fel", enabled: false, categories: [] },
  { id: 5, title: "Reproducere pattern", enabled: false, categories: [] },
  { id: 6, title: "Continuare pattern", enabled: false, categories: [] },
  { id: 7, title: "Asociere logică imagini", enabled: false, categories: [] },
  { id: 8, title: "Sortare după funcție", enabled: false, categories: [] },
  { id: 9, title: "Sortare după caracteristică", enabled: false, categories: [] },
  { id: 10, title: "Sortare pe categorie", enabled: false, categories: [] },
  { id: 11, title: "Găsește item dispărut", enabled: false, categories: [] },
  { id: 12, title: "Reproduce secvență obiecte", enabled: false, categories: [] },
  { id: 13, title: "Ordonează după criteriu", enabled: false, categories: [] },
  { id: 14, title: "Aranjare cronologică", enabled: false, categories: [] },
];

export const RECEPTIVE_LANGUAGE_OBJECTIVES: ObjectiveDefinition[] = [
  { id: 100, title: "Identify common items", enabled: true, categories: [] },
  { id: 101, title: "Identify parts of items", enabled: true, categories: [] },
  { id: 102, title: "Identify adjectives", enabled: true, categories: [] },
  { id: 103, title: "Identify actions", enabled: true, categories: [] },
  { id: 104, title: "Identify object by function", enabled: true, categories: [] },
  { id: 105, title: "Identify object by characteristic", enabled: true, categories: [] },
  { id: 106, title: "Identify object by category", enabled: true, categories: [] },
  { id: 107, title: "Identify two items", enabled: true, categories: [] },
  { id: 108, title: "Identify two items in order", enabled: true, categories: [] },
  { id: 109, title: "Identify jobs", enabled: true, categories: [] },
  { id: 110, title: "Identify sounds", enabled: true, categories: [] },
  { id: 111, title: "Identify identical items", enabled: true, categories: [] },
  { id: 112, title: "Identify item by two characteristics", enabled: true, categories: [] },
  { id: 113, title: "Identify all items by characteristics", enabled: true, categories: [] },
  { id: 114, title: "Identify all items by two characteristics", enabled: true, categories: [] },
  { id: 115, title: "Identify image of location", enabled: true, categories: [] },
  { id: 116, title: "Identify emotions", enabled: true, categories: [] },
  { id: 117, title: "Identify similarity", enabled: true, categories: [] },
  { id: 118, title: "Identify difference", enabled: true, categories: [] },
  { id: 119, title: "Identify different from group", enabled: true, categories: [] },
  { id: 120, title: "Identify social images", enabled: true, categories: [] },
];
