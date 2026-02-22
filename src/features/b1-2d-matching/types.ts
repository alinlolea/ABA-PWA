export type Stimulus = {
  id: string;
  label: string;
  image: any;
};

export type B1Config = {
  category: "colors" | "shapes" | "objects";
  targets: Stimulus[];
  distractorCount: number;
  /** Stimuli in this category to pick distractors from (excludes targets). */
  pool?: Stimulus[];
};

export type Trial = {
  topTargets: Stimulus[];
  bottomOptions: Stimulus[];
};

export type SessionState = {
  currentTrialIndex: number;
  trials: Trial[];
  score: number;
  completed: boolean;
};
