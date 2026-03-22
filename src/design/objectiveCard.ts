import type { ViewStyle } from "react-native";

/**
 * Shared disabled styling for objective grid cards across dashboard areas.
 * Pair with `is*ObjectiveImplemented` helpers from `@/utils/objectiveTrialAvailability`.
 */
export const objectiveGridCardDisabledStyle: ViewStyle = { opacity: 0.5 };
