import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function DogIcon({
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
      <Circle cx="8" cy="14" r="3" />
      <Path d="M11 14h6l2-4-2-2-2 2v4M14 10v2M16 12v2" />
      <Path d="M8 11V8c0-1 1-2 2-2h2l2 2v2" />
      <Path d="M5 16l2-2M19 10l-2 2" />
    </Svg>
  );
}
