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

const OBIECTE: ReceptiveItemAsset[] = [
  {
    id: "balon",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/balon.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata balon.mp3"),
  },
  {
    id: "caciula",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/caciula.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata caciula.mp3"),
  },
  {
    id: "cana",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/cana.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata cana.mp3"),
  },
  {
    id: "ceas",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/ceas.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata ceas.mp3"),
  },
  {
    id: "clopotel",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/clopotel.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata clopotel.mp3"),
  },
  {
    id: "cos",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/cos.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata cos.mp3"),
  },
  {
    id: "cos_gunoi",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/cos gunoi.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata cos gunoi.mp3"),
  },
  {
    id: "cuburi",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/cuburi.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata cuburi.mp3"),
  },
  {
    id: "cutit",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/cutit.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata cutit.mp3"),
  },
  {
    id: "dulap",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/dulap.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata dulap.mp3"),
  },
  {
    id: "farfurie",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/farfurie.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata farfurie.mp3"),
  },
  {
    id: "frigider",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/frigider.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata frigider.mp3"),
  },
  {
    id: "galeata",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/galeata.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata galeata.mp3"),
  },
  {
    id: "geaca",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/geaca.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata geaca.mp3"),
  },
  {
    id: "ghiozdan",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/ghiozdan.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata ghiozdan.mp3"),
  },
  {
    id: "laptop",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/laptop.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata laptop.mp3"),
  },
  {
    id: "leagan",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/leagan.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata leagan.mp3"),
  },
  {
    id: "lego",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/lego.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata lego.mp3"),
  },
  {
    id: "masa",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/masa.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata masa.mp3"),
  },
  {
    id: "matura",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/matura.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata matura.mp3"),
  },
  {
    id: "minge",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/minge.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata minge.mp3"),
  },
  {
    id: "oala",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/oala.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata oala.mp3"),
  },
  {
    id: "oglinda",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/oglinda.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata oglinda.mp3"),
  },
  {
    id: "pantaloni",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/pantaloni.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata pantaloni.mp3"),
  },
  {
    id: "pantofi",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/pantofi.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata pantofi.mp3"),
  },
  {
    id: "pat",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/pat.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata pat.mp3"),
  },
  {
    id: "pieptene",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/pieptene.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata pieptene.mp3"),
  },
  {
    id: "prosop",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/prosop.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata prosop.mp3"),
  },
  {
    id: "robinet",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/robinet.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata robinet.mp3"),
  },
  {
    id: "scaun",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/scaun.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata scaun.mp3"),
  },
  {
    id: "sosete",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/sosete.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata sosete.mp3"),
  },
  {
    id: "sticla",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/sticla.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata sticla.mp3"),
  },
  {
    id: "tobogan",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/tobogan.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata tobogan.mp3"),
  },
  {
    id: "tricicleta",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/tricicleta.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata tricicleta.mp3"),
  },
  {
    id: "tricou",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/tricou.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata tricou.mp3"),
  },
  {
    id: "trotineta",
    image: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/imagini/trotineta.png"),
    audio: require("../../../assets/programe/limbaj-receptiv/arata-obiecte-comune/obiecte/audio/arata trotineta.mp3"),
  },
];

const ITEMS_BY_CATEGORY: Record<ReceptiveCategory, ReceptiveItemAsset[]> = {
  animale_domestice: ANIMALE_DOMESTICE,
  animale_salbatice: ANIMALE_SALBATICE,
  fructe: FRUCTE,
  legume: LEGUME,
  obiecte: OBIECTE,
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
