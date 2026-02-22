import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function PigIcon({
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
      <Path d="M6 14c0-2 2-4 4-4h4c2 0 4 2 4 4v4H6v-4Z" />
      <Circle cx="9" cy="12" r="1.5" />
      <Circle cx="15" cy="12" r="1.5" />
      <Path d="M12 10V8c1 0 2-1 2-2 0-1-1-2-2-2s-2 1-2 2v2" />
      <Path d="M18 14l2-2M4 14l-2-2M12 16v2" />
    </Svg>
  );
}
