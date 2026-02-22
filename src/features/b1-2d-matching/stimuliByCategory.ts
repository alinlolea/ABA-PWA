import type { Stimulus } from "./types";
import {
  AppleIcon,
  PearIcon,
  BananaIcon,
  OrangeIcon,
  StrawberryIcon,
  GrapesIcon,
  WatermelonIcon,
  LemonIcon,
  CherriesIcon,
  PineappleIcon,
} from "@/assets/objects/fruits";
import {
  CarrotIcon,
  PotatoIcon,
  TomatoIcon,
  CucumberIcon,
  PepperIcon,
  OnionIcon,
  GarlicIcon,
  EggplantIcon,
  BroccoliIcon,
  CornIcon,
} from "@/assets/objects/vegetables";
import {
  DogIcon,
  CatIcon,
  HorseIcon,
  CowIcon,
  SheepIcon,
  PigIcon,
  ChickenIcon,
  DuckIcon,
  LionIcon,
  ElephantIcon,
} from "@/assets/objects/animals";
import {
  CarIcon,
  BusIcon,
  TruckIcon,
  BicycleIcon,
  MotorcycleIcon,
  TrainIcon,
  PlaneIcon,
  ShipIcon,
  TractorIcon,
  AmbulanceIcon,
} from "@/assets/objects/vehicles";
import {
  BreadIcon,
  MilkIcon,
  EggIcon,
  CheeseIcon,
  PizzaIcon,
  BurgerIcon,
  SoupIcon,
  SandwichIcon,
  CakeIcon,
  IcecreamIcon,
} from "@/assets/objects/food";
import {
  ChairIcon,
  TableIcon,
  BedIcon,
  MugIcon,
  GlassIcon,
  BookIcon,
  PencilIcon,
  PhoneIcon,
  KeyIcon,
  BallIcon,
} from "@/assets/objects/objects";

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

const FRUITS_AS_STIMULI: Stimulus[] = [
  { id: "apple", label: "Măr", image: { type: "svg", icon: AppleIcon } },
  { id: "pear", label: "Pară", image: { type: "svg", icon: PearIcon } },
  { id: "banana", label: "Banană", image: { type: "svg", icon: BananaIcon } },
  { id: "orange", label: "Portocală", image: { type: "svg", icon: OrangeIcon } },
  { id: "strawberry", label: "Căpșună", image: { type: "svg", icon: StrawberryIcon } },
  { id: "grapes", label: "Struguri", image: { type: "svg", icon: GrapesIcon } },
  { id: "watermelon", label: "Pepene", image: { type: "svg", icon: WatermelonIcon } },
  { id: "lemon", label: "Lămâie", image: { type: "svg", icon: LemonIcon } },
  { id: "cherries", label: "Cireșe", image: { type: "svg", icon: CherriesIcon } },
  { id: "pineapple", label: "Ananas", image: { type: "svg", icon: PineappleIcon } },
];

const VEGETABLES_AS_STIMULI: Stimulus[] = [
  { id: "carrot", label: "Morcov", image: { type: "svg", icon: CarrotIcon } },
  { id: "potato", label: "Cartof", image: { type: "svg", icon: PotatoIcon } },
  { id: "tomato", label: "Roșie", image: { type: "svg", icon: TomatoIcon } },
  { id: "cucumber", label: "Castravete", image: { type: "svg", icon: CucumberIcon } },
  { id: "pepper", label: "Ardei", image: { type: "svg", icon: PepperIcon } },
  { id: "onion", label: "Ceapă", image: { type: "svg", icon: OnionIcon } },
  { id: "garlic", label: "Usturoi", image: { type: "svg", icon: GarlicIcon } },
  { id: "eggplant", label: "Vânătă", image: { type: "svg", icon: EggplantIcon } },
  { id: "broccoli", label: "Broccoli", image: { type: "svg", icon: BroccoliIcon } },
  { id: "corn", label: "Porumb", image: { type: "svg", icon: CornIcon } },
];

const ANIMALS_AS_STIMULI: Stimulus[] = [
  { id: "dog", label: "Câine", image: { type: "svg", icon: DogIcon } },
  { id: "cat", label: "Pisică", image: { type: "svg", icon: CatIcon } },
  { id: "horse", label: "Cal", image: { type: "svg", icon: HorseIcon } },
  { id: "cow", label: "Vacă", image: { type: "svg", icon: CowIcon } },
  { id: "sheep", label: "Oaie", image: { type: "svg", icon: SheepIcon } },
  { id: "pig", label: "Porc", image: { type: "svg", icon: PigIcon } },
  { id: "chicken", label: "Găină", image: { type: "svg", icon: ChickenIcon } },
  { id: "duck", label: "Rață", image: { type: "svg", icon: DuckIcon } },
  { id: "lion", label: "Leu", image: { type: "svg", icon: LionIcon } },
  { id: "elephant", label: "Elefant", image: { type: "svg", icon: ElephantIcon } },
];

const VEHICLES_AS_STIMULI: Stimulus[] = [
  { id: "car", label: "Mașină", image: { type: "svg", icon: CarIcon } },
  { id: "bus", label: "Autobuz", image: { type: "svg", icon: BusIcon } },
  { id: "truck", label: "Camion", image: { type: "svg", icon: TruckIcon } },
  { id: "bicycle", label: "Bicicletă", image: { type: "svg", icon: BicycleIcon } },
  { id: "motorcycle", label: "Motocicletă", image: { type: "svg", icon: MotorcycleIcon } },
  { id: "train", label: "Tren", image: { type: "svg", icon: TrainIcon } },
  { id: "plane", label: "Avion", image: { type: "svg", icon: PlaneIcon } },
  { id: "ship", label: "Vapor", image: { type: "svg", icon: ShipIcon } },
  { id: "tractor", label: "Tractor", image: { type: "svg", icon: TractorIcon } },
  { id: "ambulance", label: "Ambulanță", image: { type: "svg", icon: AmbulanceIcon } },
];

const FOOD_AS_STIMULI: Stimulus[] = [
  { id: "bread", label: "Pâine", image: { type: "svg", icon: BreadIcon } },
  { id: "milk", label: "Lapte", image: { type: "svg", icon: MilkIcon } },
  { id: "egg", label: "Ou", image: { type: "svg", icon: EggIcon } },
  { id: "cheese", label: "Brânză", image: { type: "svg", icon: CheeseIcon } },
  { id: "pizza", label: "Pizza", image: { type: "svg", icon: PizzaIcon } },
  { id: "burger", label: "Burger", image: { type: "svg", icon: BurgerIcon } },
  { id: "soup", label: "Supă", image: { type: "svg", icon: SoupIcon } },
  { id: "sandwich", label: "Sandviș", image: { type: "svg", icon: SandwichIcon } },
  { id: "cake", label: "Tort", image: { type: "svg", icon: CakeIcon } },
  { id: "icecream", label: "Înghețată", image: { type: "svg", icon: IcecreamIcon } },
];

const OBJECTS_AS_STIMULI: Stimulus[] = [
  { id: "chair", label: "Scaun", image: { type: "svg", icon: ChairIcon } },
  { id: "table", label: "Masă", image: { type: "svg", icon: TableIcon } },
  { id: "bed", label: "Pat", image: { type: "svg", icon: BedIcon } },
  { id: "mug", label: "Cană", image: { type: "svg", icon: MugIcon } },
  { id: "glass", label: "Pahar", image: { type: "svg", icon: GlassIcon } },
  { id: "book", label: "Carte", image: { type: "svg", icon: BookIcon } },
  { id: "pencil", label: "Creion", image: { type: "svg", icon: PencilIcon } },
  { id: "phone", label: "Telefon", image: { type: "svg", icon: PhoneIcon } },
  { id: "key", label: "Cheie", image: { type: "svg", icon: KeyIcon } },
  { id: "ball", label: "Minge", image: { type: "svg", icon: BallIcon } },
];

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
