import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function BicycleIcon({
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
      <Circle cx="6" cy="16" r="3" />
      <Circle cx="18" cy="16" r="3" />
      <Path d="M6 13v-4l4-2 2 4v2M18 13v-2l-4-6h-4l-2 4" />
      <Path d="M12 9h4l2 4" />
    </Svg>
  );
}
