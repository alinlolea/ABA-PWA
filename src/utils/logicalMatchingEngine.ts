/**
 * Trial engine for "Asociere logică imagini": pair dataset, selection without replacement
 * across trials (until pool exhausted), random top/bottom split per pair, shuffled rows.
 */

import type { ImageSourcePropType } from "react-native";

export type LogicalImagePairDef = {
  id: string;
  a: ImageSourcePropType;
  b: ImageSourcePropType;
};

/** Full catalog of logic-association image pairs (A ↔ B). */
export const LOGICAL_IMAGE_PAIRS: LogicalImagePairDef[] = [
  {
    id: "acuarele-pensula",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/acuarele.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/pensula.png"),
  },
  {
    id: "ascutitoare-creion",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/ascutitoare.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/creion.png"),
  },
  {
    id: "bancnote-portofel",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/bancnote.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/portofel.png"),
  },
  {
    id: "barca-marea",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/barca.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/marea.png"),
  },
  {
    id: "biblioteca-carte",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/biblioteca.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/carte.png"),
  },
  {
    id: "bulgare-manusi",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/bulgare.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/manusi.png"),
  },
  {
    id: "cheie-usa",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/cheie.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/usa.png"),
  },
  {
    id: "drum-masina",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/drum.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/masina.png"),
  },
  {
    id: "foarfeca-hartie",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/foarfeca.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/hartie.png"),
  },
  {
    id: "foc-pompier",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/foc.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/pompier.png"),
  },
  {
    id: "furculita-paste",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/furculita.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/paste.png"),
  },
  {
    id: "lingura-supa",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/lingura.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/supa.png"),
  },
  {
    id: "maini-sapun",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/maini.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/sapun.png"),
  },
  {
    id: "medic-spital",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/medic.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/spital.png"),
  },
  {
    id: "ochelari-soare",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/ochelari.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/soare.png"),
  },
  {
    id: "pasta-dinti-periuta-dinti",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/pasta dinti.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/periuta dinti.png"),
  },
  {
    id: "ploaie-umbrela",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/ploaie.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/umbrela.png"),
  },
  {
    id: "sine-tren",
    a: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/sine.png"),
    b: require("../../assets/programe/discriminare-vizuala/asociere-logica-imagini/imagini/tren.png"),
  },
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function clampPairCount(n: number): number {
  const max = LOGICAL_IMAGE_PAIRS.length;
  return Math.min(max, Math.max(1, Math.floor(Number.isFinite(n) ? n : 3)));
}

/** One image instance on the top (draggable) or bottom (target) row; match = same pairId. */
export type LogicalTrialImage = {
  id: string;
  image: ImageSourcePropType;
  pairId: string;
};

export type LogicalTrialGenerationResult = {
  topImages: LogicalTrialImage[];
  bottomTargets: LogicalTrialImage[];
  /** Pair ids selected for this trial (for persistence / no-repeat logic). */
  selectedPairIds: string[];
};

/**
 * Effective "used pairs" set for drawing the next trial.
 * If not enough unused pairs remain for N, returns an empty set (full pool available) —
 * callers should clear their persisted completed ids to match (see sync helper below).
 */
export function effectiveCompletedPairSet(
  completedPairIds: ReadonlySet<string> | readonly string[],
  pairCount: number
): Set<string> {
  const n = clampPairCount(pairCount);
  const completed = new Set(completedPairIds);
  const available = LOGICAL_IMAGE_PAIRS.filter((p) => !completed.has(p.id));
  if (available.length < n) {
    return new Set();
  }
  return completed;
}

/** True when persisted completed ids should be cleared (pool exhausted for this N). */
export function shouldClearPersistedCompletedPairIds(
  completedPairIds: readonly string[],
  pairCount: number
): boolean {
  const n = clampPairCount(pairCount);
  if (completedPairIds.length === 0) return false;
  const completed = new Set(completedPairIds);
  const available = LOGICAL_IMAGE_PAIRS.filter((p) => !completed.has(p.id));
  return available.length < n;
}

/**
 * Build one trial: pick N unique pairs not in effectiveCompletedPairIds,
 * assign exactly one image to top and one to bottom per pair at random, shuffle both rows.
 */
export function generateLogicalMatchingTrial(
  pairCount: number,
  effectiveCompletedPairIds: ReadonlySet<string>
): LogicalTrialGenerationResult {
  const n = clampPairCount(pairCount);
  const completed = new Set(effectiveCompletedPairIds);
  const available = LOGICAL_IMAGE_PAIRS.filter((p) => !completed.has(p.id));
  const selectedPairs = shuffle(available).slice(0, n);

  const topScratch: LogicalTrialImage[] = [];
  const bottomScratch: LogicalTrialImage[] = [];

  for (const def of selectedPairs) {
    const imageOnTopIsA = Math.random() < 0.5;
    if (imageOnTopIsA) {
      topScratch.push({
        id: `${def.id}#top-a`,
        image: def.a,
        pairId: def.id,
      });
      bottomScratch.push({
        id: `${def.id}#bottom-b`,
        image: def.b,
        pairId: def.id,
      });
    } else {
      topScratch.push({
        id: `${def.id}#top-b`,
        image: def.b,
        pairId: def.id,
      });
      bottomScratch.push({
        id: `${def.id}#bottom-a`,
        image: def.a,
        pairId: def.id,
      });
    }
  }

  return {
    topImages: shuffle(topScratch),
    bottomTargets: shuffle(bottomScratch),
    selectedPairIds: selectedPairs.map((p) => p.id),
  };
}

/** For future validation: correct pairing is the same pairId on dragged image and target column. */
export function pairIdsMatch(a: string, b: string): boolean {
  return a === b;
}
