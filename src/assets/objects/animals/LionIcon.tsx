import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function LionIcon({
  width = 24,
  height = 24,
  color = "currentColor",
}: ObjectIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={ICON_DEFAULTS.viewBox}
      fill="none"
      stroke={color}
      strokeWidth={ICON_DEFAULTS.strokeWidth}
      strokeLinecap={ICON_DEFAULTS.strokeLinecap}
      strokeLinejoin={ICON_DEFAULTS.strokeLinejoin}
    >
      <Circle cx="12" cy="11" r="5" />
      <Path d="M4 8l2 2M20 8l-2 2M6 6l2 2M18 6l-2 2M8 4l1 2M16 4l-1 2" />
      <Path d="M12 16v3M10 19h4" />
      <Path d="M9 14h6M12 12v2" />
      <Path d="M7 18l2 2M17 18l-2 2" />
    </Svg>
  );
}
