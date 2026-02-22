import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function BusIcon({
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
      <Path d="M4 8h16v10h-2v-2H6v2H4V8Z" />
      <Path d="M4 8V6c0-2 2-4 4-4h8c2 0 4 2 4 4v2" />
      <Path d="M8 14h2M14 14h2M8 18h8" />
      <Path d="M6 18h2M16 18h2" />
    </Svg>
  );
}
