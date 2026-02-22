import type { B1Config, Stimulus, Trial } from "../types";

const TRIAL_COUNT = 10;
const MAX_TOP_TARGETS = 3;

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDistractors(
  targets: Stimulus[],
  pool: Stimulus[],
  count: number
): Stimulus[] {
  const targetIds = new Set(targets.map((s) => s.id));
  const candidates = pool.filter((s) => !targetIds.has(s.id));
  const shuffled = shuffle(candidates);
  return shuffled.slice(0, count);
}

export function generateTrials(config: B1Config): Trial[] {
  const trials: Trial[] = [];

  for (let i = 0; i < TRIAL_COUNT; i++) {
    const topTargets = config.targets.slice(0, MAX_TOP_TARGETS).map((s) => ({ ...s }));
    const pool = config.pool ?? [];
    const randomDistractors = pickDistractors(
      config.targets,
      pool,
      config.distractorCount
    );
    const bottomOptions = shuffle([...topTargets, ...randomDistractors]);

    trials.push({
      topTargets,
      bottomOptions,
    });
  }

  return trials;
}
