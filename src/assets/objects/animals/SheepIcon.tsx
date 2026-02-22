import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function SheepIcon({
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
      <Path d="M8 14c-2 0-4 2-4 4v2h16v-2c0-2-2-4-4-4H8Z" />
      <Path d="M12 10c2 0 4-2 4-4s-2-4-4-4-4 2-4 4 2 4 4 4Z" />
      <Path d="M10 12h4M12 10v4M8 16h8" />
      <Path d="M6 18l2-2M18 18l-2-2" />
    </Svg>
  );
}
