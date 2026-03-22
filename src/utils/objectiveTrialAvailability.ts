/**
 * Single source of truth for which dashboard objectives reach a working screen in
 * `src/app/trial.tsx`. When you add a new trial branch there, update the helpers below.
 */
import type { ObjectiveDefinition } from "@/config/objectives";

/** `trialType` values handled by `TrialScreen` (before the default B1 branch). */
export const SUPPORTED_SPECIAL_TRIAL_TYPES = [
  "tower_over_model",
  "tower-copy",
  "pattern-reproduction",
  "pattern-continuation",
  "logical-image-association",
] as const;

export type SupportedSpecialTrialType = (typeof SUPPORTED_SPECIAL_TRIAL_TYPES)[number];

const SPECIAL_TRIAL_TYPE_SET = new Set<string>(SUPPORTED_SPECIAL_TRIAL_TYPES);

export function isSpecialTrialTypeImplemented(
  trialType: ObjectiveDefinition["trialType"]
): trialType is SupportedSpecialTrialType {
  return trialType != null && SPECIAL_TRIAL_TYPE_SET.has(trialType);
}

/**
 * Visual skills list (`OBJECTIVES`): B1 2D matching (category drawer) or a supported `trialType`.
 */
export function isVisualSkillsObjectiveImplemented(obj: ObjectiveDefinition): boolean {
  if (!obj.enabled) return false;
  if (isSpecialTrialTypeImplemented(obj.trialType)) return true;
  if (obj.categories.length > 0 && obj.trialType == null) return true;
  return false;
}

/** Receptive dashboard card ids that map to a dedicated `TrialScreen` branch. */
const RECEPTIVE_IMPLEMENTED_IDS = new Set<string>(["show_common_objects"]);

export function isReceptiveDashboardObjectiveImplemented(objectiveId: string): boolean {
  return RECEPTIVE_IMPLEMENTED_IDS.has(objectiveId);
}

const LABELING_IMPLEMENTED_IDS = new Set<string>(["numeste-culori"]);

export function isLabelingObjectiveImplemented(objectiveId: string): boolean {
  return LABELING_IMPLEMENTED_IDS.has(objectiveId);
}

/**
 * Reading: only flows that configure B1 params correctly in `reading.tsx` and use that trial.
 * Non-configurable objectives currently have no working start path.
 */
const READING_IMPLEMENTED_IDS = new Set<string>(["receptive_letters"]);

export function isReadingObjectiveImplemented(objectiveId: string): boolean {
  return READING_IMPLEMENTED_IDS.has(objectiveId);
}
