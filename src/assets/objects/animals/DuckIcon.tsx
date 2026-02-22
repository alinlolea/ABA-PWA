import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function DuckIcon({
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
      <Circle cx="10" cy="12" r="5" />
      <Path d="M15 12l4-2v2l-4 2v2H8v-4" />
      <Path d="M18 8c1 0 2 1 2 2s-1 2-2 2" />
      <Path d="M12 15v2M10 17h4" />
    </Svg>
  );
}
