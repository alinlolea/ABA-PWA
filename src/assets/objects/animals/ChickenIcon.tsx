import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function ChickenIcon({
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
      <Circle cx="12" cy="10" r="5" />
      <Path d="M12 15v4M10 19h4" />
      <Path d="M17 8l2-2M19 10l-2 2" />
      <Path d="M8 12c-2 0-4 1-4 3v2h4v-2c0-1 1-2 2-2" />
      <Path d="M16 12c2 0 4 1 4 3v2h-4v-2c0-1-1-2-2-2" />
    </Svg>
  );
}
