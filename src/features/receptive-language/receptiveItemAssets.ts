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

const ANIMALE_SALBATICE: ReceptiveItemAsset[] = [
  {
    id: "cangur",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/cangur.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata cangur.mp3"),
  },
  {
    id: "crocodil",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/crocodil.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata crocodil.mp3"),
  },
  {
    id: "girafa",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/girafa.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata girafa.mp3"),
  },
  {
    id: "leu",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/leu.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata leu.mp3"),
  },
  {
    id: "lup",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/lup.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata lup.mp3"),
  },
  {
    id: "maimuta",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/maimuta.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata maimuta.mp3"),
  },
  {
    id: "tigru",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/tigru.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata tigru.mp3"),
  },
  {
    id: "urs",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/urs.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata urs.mp3"),
  },
  {
    id: "vulpe",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/vulpe.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata vulpe.mp3"),
  },
  {
    id: "zebra",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/imagini/zebra.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/animale-salbatice/audio/arata zebra.mp3"),
  },
];

const FRUCTE: ReceptiveItemAsset[] = [
  {
    id: "ananas",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/ananas.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata ananas.mp3"),
  },
  {
    id: "banana",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/banana.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata banana.mp3"),
  },
  {
    id: "capsuna",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/capsuna.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata capsuna.mp3"),
  },
  {
    id: "cireasa",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/cireasa.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata cireasa.mp3"),
  },
  {
    id: "kiwi",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/kiwi.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata kiwi.mp3"),
  },
  {
    id: "lubenita",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/lubenita.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata lubenita.mp3"),
  },
  {
    id: "mango",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/mango.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata mango.mp3"),
  },
  {
    id: "mar",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/mar.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata mar.mp3"),
  },
  {
    id: "para",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/para.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata para.mp3"),
  },
  {
    id: "pepene",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/pepene.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata pepene.mp3"),
  },
  {
    id: "piersica",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/piersica.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata piersica.mp3"),
  },
  {
    id: "portocala",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/portocala.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata portocala.mp3"),
  },
  {
    id: "pruna",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/pruna.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata pruna.mp3"),
  },
  {
    id: "struguri",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/struguri.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata struguri.mp3"),
  },
  {
    id: "zmeura",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/imagini/zmeura.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/fructe/audio/arata zmeura.mp3"),
  },
];

const LEGUME: ReceptiveItemAsset[] = [
  {
    id: "ardei",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/ardei.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata ardei.mp3"),
  },
  {
    id: "broccoli",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/broccoli.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata broccoli.mp3"),
  },
  {
    id: "cartof",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/cartof.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata cartof.mp3"),
  },
  {
    id: "castravete",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/castravete.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata castravete.mp3"),
  },
  {
    id: "ceapa",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/ceapa.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata ceapa.mp3"),
  },
  {
    id: "fasole",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/fasole.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata fasole.mp3"),
  },
  {
    id: "mazare",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/mazare.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata mazare.mp3"),
  },
  {
    id: "morcov",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/morcov.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata morcov.mp3"),
  },
  {
    id: "porumb",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/porumb.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata porumb.mp3"),
  },
  {
    id: "rosie",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/rosie.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata rosie.mp3"),
  },
  {
    id: "usturoi",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/usturoi.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata usturoi.mp3"),
  },
  {
    id: "vanata",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/vanata.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata vanata.mp3"),
  },
  {
    id: "varza",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/imagini/varza.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/legume/audio/arata varza.mp3"),
  },
];

const ITEMS_BY_CATEGORY: Record<ReceptiveCategory, ReceptiveItemAsset[]> = {
  animale_domestice: ANIMALE_DOMESTICE,
  animale_salbatice: ANIMALE_SALBATICE,
  fructe: FRUCTE,
  legume: LEGUME,
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
