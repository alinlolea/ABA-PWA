import type { Stimulus } from "./types";

export type CategoryKey =
  | "colors"
  | "shapes"
  | "fruits"
  | "vegetables"
  | "animals"
  | "vehicles"
  | "food"
  | "objects";

const COLORS_AS_STIMULI: Stimulus[] = [
  { id: "color-red", label: "Roșu", image: "#E53935" },
  { id: "color-green", label: "Verde", image: "#43A047" },
  { id: "color-blue", label: "Albastru", image: "#1E88E5" },
  { id: "color-yellow", label: "Galben", image: "#FDD835" },
  { id: "color-orange", label: "Portocaliu", image: "#FB8C00" },
  { id: "color-purple", label: "Mov", image: "#8E24AA" },
  { id: "color-pink", label: "Roz", image: "#EC407A" },
  { id: "color-brown", label: "Maro", image: "#6D4C41" },
  { id: "color-black", label: "Negru", image: "#212121" },
  { id: "color-white", label: "Alb", image: "#FAFAFA" },
  { id: "color-gray", label: "Gri", image: "#757575" },
  { id: "color-beige", label: "Bej", image: "#D7C4A3" },
];

const SHAPE_FILL = "#4B5563";
const SHAPES_AS_STIMULI: Stimulus[] = [
  { id: "circle", label: "Cerc", image: { type: "shape", form: "circle", fill: SHAPE_FILL } },
  { id: "square", label: "Pătrat", image: { type: "shape", form: "square", fill: SHAPE_FILL } },
  { id: "triangle", label: "Triunghi", image: { type: "shape", form: "triangle", fill: SHAPE_FILL } },
  { id: "rectangle", label: "Dreptunghi", image: { type: "shape", form: "rectangle", fill: SHAPE_FILL } },
  { id: "oval", label: "Oval", image: { type: "shape", form: "oval", fill: SHAPE_FILL } },
  { id: "star", label: "Stea", image: { type: "shape", form: "star", fill: SHAPE_FILL } },
  { id: "diamond", label: "Romb", image: { type: "shape", form: "diamond", fill: SHAPE_FILL } },
];

function placeholderStimuli(
  items: { id: string; label: string }[]
): Stimulus[] {
  return items.map(({ id, label }) => ({
    id,
    label,
    image: { type: "placeholder" as const },
  }));
}

const FRUITS_AS_STIMULI: Stimulus[] = placeholderStimuli([
  { id: "apple", label: "Măr" },
  { id: "pear", label: "Pară" },
  { id: "banana", label: "Banană" },
  { id: "orange", label: "Portocală" },
  { id: "strawberry", label: "Căpșună" },
  { id: "grapes", label: "Struguri" },
  { id: "watermelon", label: "Pepene" },
  { id: "lemon", label: "Lămâie" },
  { id: "cherries", label: "Cireșe" },
  { id: "pineapple", label: "Ananas" },
  { id: "plum", label: "Prună" },
  { id: "raspberry", label: "Zmeură" },
]);

const VEGETABLES_AS_STIMULI: Stimulus[] = placeholderStimuli([
  { id: "carrot", label: "Morcov" },
  { id: "potato", label: "Cartof" },
  { id: "tomato", label: "Roșie" },
  { id: "cucumber", label: "Castravete" },
  { id: "pepper", label: "Ardei" },
  { id: "onion", label: "Ceapă" },
  { id: "garlic", label: "Usturoi" },
  { id: "eggplant", label: "Vânătă" },
  { id: "broccoli", label: "Broccoli" },
  { id: "corn", label: "Porumb" },
  { id: "lettuce", label: "Salată" },
  { id: "pumpkin", label: "Dovleac" },
]);

const ANIMALS_AS_STIMULI: Stimulus[] = placeholderStimuli([
  { id: "dog", label: "Câine" },
  { id: "cat", label: "Pisică" },
  { id: "horse", label: "Cal" },
  { id: "cow", label: "Vacă" },
  { id: "sheep", label: "Oaie" },
  { id: "pig", label: "Porc" },
  { id: "chicken", label: "Găină" },
  { id: "duck", label: "Rață" },
  { id: "lion", label: "Leu" },
  { id: "elephant", label: "Elefant" },
  { id: "bear", label: "Urs" },
  { id: "rabbit", label: "Iepure" },
]);

const VEHICLES_AS_STIMULI: Stimulus[] = placeholderStimuli([
  { id: "car", label: "Mașină" },
  { id: "bus", label: "Autobuz" },
  { id: "truck", label: "Camion" },
  { id: "bicycle", label: "Bicicletă" },
  { id: "motorcycle", label: "Motocicletă" },
  { id: "train", label: "Tren" },
  { id: "plane", label: "Avion" },
  { id: "ship", label: "Vapor" },
  { id: "tractor", label: "Tractor" },
  { id: "ambulance", label: "Ambulanță" },
  { id: "fire-truck", label: "Pompieri" },
  { id: "helicopter", label: "Helicopter" },
]);

const FOOD_AS_STIMULI: Stimulus[] = placeholderStimuli([
  { id: "bread", label: "Pâine" },
  { id: "milk", label: "Lapte" },
  { id: "egg", label: "Ou" },
  { id: "cheese", label: "Brânză" },
  { id: "pizza", label: "Pizza" },
  { id: "burger", label: "Burger" },
  { id: "soup", label: "Supă" },
  { id: "sandwich", label: "Sandviș" },
  { id: "cake", label: "Tort" },
  { id: "icecream", label: "Înghețată" },
  { id: "salad", label: "Salată" },
  { id: "coffee", label: "Cafea" },
]);

const OBJECTS_AS_STIMULI: Stimulus[] = placeholderStimuli([
  { id: "chair", label: "Scaun" },
  { id: "table", label: "Masă" },
  { id: "bed", label: "Pat" },
  { id: "mug", label: "Cană" },
  { id: "glass", label: "Pahar" },
  { id: "book", label: "Carte" },
  { id: "pencil", label: "Creion" },
  { id: "phone", label: "Telefon" },
  { id: "key", label: "Cheie" },
  { id: "ball", label: "Minge" },
  { id: "lamp", label: "Lampă" },
  { id: "clock", label: "Ceas" },
]);

export const STIMULI_BY_CATEGORY: Record<CategoryKey, Stimulus[]> = {
  colors: COLORS_AS_STIMULI,
  shapes: SHAPES_AS_STIMULI,
  fruits: FRUITS_AS_STIMULI,
  vegetables: VEGETABLES_AS_STIMULI,
  animals: ANIMALS_AS_STIMULI,
  vehicles: VEHICLES_AS_STIMULI,
  food: FOOD_AS_STIMULI,
  objects: OBJECTS_AS_STIMULI,
};
