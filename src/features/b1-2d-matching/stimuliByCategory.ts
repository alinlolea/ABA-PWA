import type { Stimulus } from "./types";

export type CategoryKey =
  | "colors"
  | "shapes"
  | "fruits"
  | "vegetables"
  | "animals_domestic"
  | "animals_wild"
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
  { id: "ananas", label: "ananas", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/ananas.png") },
  { id: "banana", label: "banana", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/banana.png") },
  { id: "capsuna", label: "capsuna", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/capsuna.png") },
  { id: "cireasa", label: "cireasa", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/cireasa.png") },
  { id: "kiwi", label: "kiwi", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/kiwi.png") },
  { id: "lubenita", label: "lubenita", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/lubenita.png") },
  { id: "mango", label: "mango", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/mango.png") },
  { id: "mar", label: "mar", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/mar.png") },
  { id: "para", label: "para", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/para.png") },
  { id: "pepene", label: "pepene", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/pepene.png") },
  { id: "piersica", label: "piersica", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/piersica.png") },
  { id: "portocala", label: "portocala", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/portocala.png") },
  { id: "pruna", label: "pruna", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/pruna.png") },
  { id: "struguri", label: "struguri", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/struguri.png") },
  { id: "zmeura", label: "zmeura", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/fructe/zmeura.png") },
];

const VEGETABLES_AS_STIMULI: Stimulus[] = [
  { id: "ardei", label: "ardei", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/ardei.png") },
  { id: "broccoli", label: "broccoli", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/broccoli.png") },
  { id: "cartof", label: "cartof", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/cartof.png") },
  { id: "castravete", label: "castravete", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/castravete.png") },
  { id: "ceapa", label: "ceapa", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/ceapa.png") },
  { id: "fasole", label: "fasole", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/fasole.png") },
  { id: "mazare", label: "mazare", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/mazare.png") },
  { id: "morcov", label: "morcov", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/morcov.png") },
  { id: "porumb", label: "porumb", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/porumb.png") },
  { id: "rosie", label: "rosie", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/rosie.png") },
  { id: "usturoi", label: "usturoi", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/usturoi.png") },
  { id: "vanata", label: "vanata", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/vanata.png") },
  { id: "varza", label: "varza", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/legume/varza.png") },
];

const ANIMALE_DOMESTICE_AS_STIMULI: Stimulus[] = [
  { id: "caine", label: "caine", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/caine.png") },
  { id: "cal", label: "cal", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/cal.png") },
  { id: "capra", label: "capra", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/capra.png") },
  { id: "curcan", label: "curcan", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/curcan.png") },
  { id: "gaina", label: "gaina", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/gaina.png") },
  { id: "iepure", label: "iepure", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/iepure.png") },
  { id: "magar", label: "magar", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/magar.png") },
  { id: "oaie", label: "oaie", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/oaie.png") },
  { id: "pisica", label: "pisica", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/pisica.png") },
  { id: "porc", label: "porc", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/porc.png") },
  { id: "rata", label: "rata", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/rata.png") },
  { id: "vaca", label: "vaca", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-domestice/vaca.png") },
];

const ANIMALE_SALBATICE_AS_STIMULI: Stimulus[] = [
  { id: "cangur", label: "cangur", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/cangur.png") },
  { id: "crocodil", label: "crocodil", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/crocodil.png") },
  { id: "girafa", label: "girafa", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/girafa.png") },
  { id: "leu", label: "leu", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/leu.png") },
  { id: "lup", label: "lup", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/lup.png") },
  { id: "maimuta", label: "maimuta", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/maimuta.png") },
  { id: "tigru", label: "tigru", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/tigru.png") },
  { id: "urs", label: "urs", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/urs.png") },
  { id: "vulpe", label: "vulpe", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/vulpe.png") },
  { id: "zebra", label: "zebra", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/animale-salbatice/zebra.png") },
];

const OBJECTS_AS_STIMULI: Stimulus[] = [
  { id: "balon", label: "balon", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/balon.png") },
  { id: "caciula", label: "caciula", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/caciula.png") },
  { id: "cana", label: "cana", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/cana.png") },
  { id: "ceas", label: "ceas", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/ceas.png") },
  { id: "clopotel", label: "clopotel", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/clopotel.png") },
  { id: "cos", label: "cos", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/cos.png") },
  {
    id: "cos_gunoi",
    label: "cos gunoi",
    image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/cos gunoi.png"),
  },
  { id: "cuburi", label: "cuburi", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/cuburi.png") },
  { id: "cutit", label: "cutit", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/cutit.png") },
  { id: "dulap", label: "dulap", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/dulap.png") },
  { id: "farfurie", label: "farfurie", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/farfurie.png") },
  { id: "frigider", label: "frigider", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/frigider.png") },
  { id: "galeata", label: "galeata", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/galeata.png") },
  { id: "geaca", label: "geaca", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/geaca.png") },
  { id: "ghiozdan", label: "ghiozdan", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/ghiozdan.png") },
  { id: "laptop", label: "laptop", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/laptop.png") },
  { id: "leagan", label: "leagan", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/leagan.png") },
  { id: "lego", label: "lego", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/lego.png") },
  { id: "masa", label: "masa", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/masa.png") },
  { id: "matura", label: "matura", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/matura.png") },
  { id: "minge", label: "minge", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/minge.png") },
  { id: "oala", label: "oala", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/oala.png") },
  { id: "oglinda", label: "oglinda", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/oglinda.png") },
  { id: "pantaloni", label: "pantaloni", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/pantaloni.png") },
  { id: "pantofi", label: "pantofi", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/pantofi.png") },
  { id: "pat", label: "pat", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/pat.png") },
  { id: "pieptene", label: "pieptene", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/pieptene.png") },
  { id: "prosop", label: "prosop", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/prosop.png") },
  { id: "robinet", label: "robinet", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/robinet.png") },
  { id: "scaun", label: "scaun", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/scaun.png") },
  { id: "sosete", label: "sosete", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/sosete.png") },
  { id: "sticla", label: "sticla", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/sticla.png") },
  { id: "tobogan", label: "tobogan", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/tobogan.png") },
  { id: "tricicleta", label: "tricicleta", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/tricicleta.png") },
  { id: "tricou", label: "tricou", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/tricou.png") },
  { id: "trotineta", label: "trotineta", image: require("../../../assets/programe/discriminare-vizuala/potriviri/imagini/obiecte/trotineta.png") },
];

export const STIMULI_BY_CATEGORY: Record<CategoryKey, Stimulus[]> = {
  colors: COLORS_AS_STIMULI,
  shapes: SHAPES_AS_STIMULI,
  fruits: FRUITS_AS_STIMULI,
  vegetables: VEGETABLES_AS_STIMULI,
  animals_domestic: ANIMALE_DOMESTICE_AS_STIMULI,
  animals_wild: ANIMALE_SALBATICE_AS_STIMULI,
  objects: OBJECTS_AS_STIMULI,
};
