/**
 * Static require() map for receptive "Arată obiecte comune".
 * Metro requires fixed paths; add entries when new categories are added under
 * assets/programe/limbaj-receptiv/arata-obiecte-comune/{folder}/...
 */
import type { ReceptiveCategory } from "@/features/receptive-language/categories";

export type ReceptiveItemAsset = {
  /** Basename without extension, matches imagini/{id}.png and audio/arata {id}.mp3 */
  id: string;
  image: number;
  audio: number;
};

/** Maps config keys to on-disk folder names (hyphenated). */
export const RECEPTIVE_CATEGORY_FOLDER: Record<ReceptiveCategory, string> = {
  animale_domestice: "animale-domestice",
  animale_salbatice: "animale-salbatice",
  fructe: "fructe",
  legume: "legume",
  obiecte: "obiecte",
};

const ANIMALE_DOMESTICE: ReceptiveItemAsset[] = [
  {
    id: "cal",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/cal.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata cal.mp3"),
  },
  {
    id: "porc",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/porc.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata porc.mp3"),
  },
  {
    id: "oaie",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/oaie.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata oaie.mp3"),
  },
  {
    id: "curcan",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/curcan.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata curcan.mp3"),
  },
  {
    id: "rata",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/rata.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata rata.mp3"),
  },
  {
    id: "caine",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/caine.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata caine.mp3"),
  },
  {
    id: "iepure",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/iepure.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata iepure.mp3"),
  },
  {
    id: "pisica",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/pisica.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata pisica.mp3"),
  },
  {
    id: "capra",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/capra.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata capra.mp3"),
  },
  {
    id: "vaca",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/vaca.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata vaca.mp3"),
  },
  {
    id: "magar",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/magar.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata magar.mp3"),
  },
  {
    id: "gaina",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/imagini/gaina.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-domestice/audio/arata gaina.mp3"),
  },
];

const ITEMS_BY_CATEGORY: Record<ReceptiveCategory, ReceptiveItemAsset[]> = {
  animale_domestice: ANIMALE_DOMESTICE,
  animale_salbatice: [],
  fructe: [],
  legume: [],
  obiecte: [],
};

export function getReceptiveItemPool(category: ReceptiveCategory): ReceptiveItemAsset[] {
  return ITEMS_BY_CATEGORY[category] ?? [];
}

export function isReceptiveCategory(value: string): value is ReceptiveCategory {
  return (
    value === "animale_domestice" ||
    value === "animale_salbatice" ||
    value === "fructe" ||
    value === "legume" ||
    value === "obiecte"
  );
}
