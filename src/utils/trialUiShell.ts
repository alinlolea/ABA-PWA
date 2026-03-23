import { Platform, type ViewStyle } from "react-native";

/**
 * Trial surfaces: block browser long-press / selection / image callouts on web while
 * keeping `touchAction: "none"` so custom pan/drag gestures stay primary.
 */
export const trialUiRootShellStyle: ViewStyle = {
  touchAction: "none",
  ...(Platform.OS === "web"
    ? ({
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      } as ViewStyle)
    : {}),
};
