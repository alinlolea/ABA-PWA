import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function ElephantIcon({
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
      <Path d="M8 18v2h2v-2M14 18v2h2v-2" />
      <Path d="M6 18c0-2 2-4 4-4h4c2 0 4 2 4 4v2" />
      <Path d="M12 14V8c0-2 2-4 4-4 0-2-2-4-4-4s-4 2-4 4v6" />
      <Path d="M14 8h4l2-4-2-2h-2v2" />
      <Path d="M10 12h4M12 10v4" />
      <Path d="M8 20h8" />
    </Svg>
  );
}
