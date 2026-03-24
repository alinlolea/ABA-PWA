/**
 * Shared stimulus / image container sizing for visual trials.
 * Matches Potriviri (B1) rules: usable width 90% of screen, inter-item gap 2% of that band, 70–120px clamp.
 */

export const TRIAL_USABLE_WIDTH_RATIO = 0.9;
/** Gap between items, as a fraction of the usable width (same as B1 `usableWidth * 0.02`). */
export const TRIAL_INTER_ITEM_GAP_RATIO = 0.02;
export const TRIAL_STIMULUS_MIN = 70;
export const TRIAL_STIMULUS_MAX = 120;
/** Densest B1 row (max bottom options) — reference for one “standard” cell size across trials. */
export const TRIAL_REFERENCE_COLUMN_COUNT = 6;
/** Cap single stimulus height vs screen so top/bottom areas stay usable (landscape tablets). */
export const TRIAL_STIMULUS_MAX_HEIGHT_RATIO = 0.28;

function clampSize(raw: number): number {
  return Math.min(TRIAL_STIMULUS_MAX, Math.max(TRIAL_STIMULUS_MIN, Math.floor(raw)));
}

/**
 * Potriviri-style cell size for a given number of columns in one row (same math as former B1 `ITEM_SIZE`).
 */
export function stimulusSizeForColumnCount(screenWidth: number, columnCount: number): number {
  const usable = screenWidth * TRIAL_USABLE_WIDTH_RATIO;
  const gap = usable * TRIAL_INTER_ITEM_GAP_RATIO;
  const cols = Math.max(1, columnCount);
  const raw = (usable - gap * (cols - 1)) / cols;
  return clampSize(raw);
}

/**
 * Canonical size aligned to a 6-column Potriviri row, then capped by screen height so layouts stay on-screen.
 */
export function getUnifiedTrialStimulusSize(screenWidth: number, screenHeight: number): number {
  let size = stimulusSizeForColumnCount(screenWidth, TRIAL_REFERENCE_COLUMN_COUNT);
  const maxByHeight = Math.floor(screenHeight * TRIAL_STIMULUS_MAX_HEIGHT_RATIO);
  size = Math.min(size, maxByHeight);
  return clampSize(size);
}

/**
 * B1 matching: same unified cap across the app, but never larger than what the current row needs to fit.
 */
export function getB1MatchingItemSize(
  screenWidth: number,
  screenHeight: number,
  topCount: number,
  bottomCount: number
): number {
  const columns = Math.max(1, topCount, bottomCount);
  const rowFit = stimulusSizeForColumnCount(screenWidth, columns);
  const unified = getUnifiedTrialStimulusSize(screenWidth, screenHeight);
  return Math.min(unified, rowFit);
}
