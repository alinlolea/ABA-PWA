import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function CatIcon({
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
      <Circle cx="9" cy="12" r="4" />
      <Path d="M13 12h6l1-3-2-1-1 2v2M15 10v2M17 10v2" />
      <Path d="M9 8V6c0-1 1-2 2-2h1M6 18l2-2M20 12l-2 2" />
      <Path d="M8 16v2M10 16v2" />
    </Svg>
  );
}
