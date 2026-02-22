import { MOCK_STIMULI } from "./mockStimuli";
import type { Stimulus, Trial } from "./types";

const TRIAL_COUNT = 10;
const OPTIONS_PER_TRIAL = 3;
const DISTRACTOR_COUNT = OPTIONS_PER_TRIAL - 1;

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDistractors(target: Stimulus, pool: Stimulus[], count: number): Stimulus[] {
  const others = pool.filter((s) => s.id !== target.id);
  const shuffled = shuffle(others);
  return shuffled.slice(0, count);
}

export function generateTrials(_itemCount: number): Trial[] {
  const pool = MOCK_STIMULI;
  if (pool.length < OPTIONS_PER_TRIAL) {
    throw new Error("Not enough stimuli for trials (need at least 3).");
  }

  const trials: Trial[] = [];

  for (let i = 0; i < TRIAL_COUNT; i++) {
    const target = pool[Math.floor(Math.random() * pool.length)];
    const distractors = pickDistractors(target, pool, DISTRACTOR_COUNT);
    const options = shuffle([target, ...distractors]);
    const correctIndex = options.findIndex((s) => s.id === target.id);

    trials.push({
      target,
      options,
      correctIndex,
    });
  }

  return trials;
}
