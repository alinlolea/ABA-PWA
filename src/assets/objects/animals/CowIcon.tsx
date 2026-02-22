import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function CowIcon({
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
      <Path d="M6 16c0-2 2-4 4-4h4c2 0 4 2 4 4v2H6v-2Z" />
      <Path d="M8 14h8M10 12v2M14 12v2" />
      <Circle cx="9" cy="8" r="3" />
      <Path d="M15 8c0 1.5 1 3 3 3M6 18h12M12 18v2" />
      <Path d="M4 20l2-2M20 20l-2-2" />
    </Svg>
  );
}
