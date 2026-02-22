import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function SandwichIcon({
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
      <Path d="M4 6h16v2H4V6Z" />
      <Path d="M4 10h16v2H4v-2Z" />
      <Path d="M4 14h16v2H4v-2Z" />
      <Path d="M4 18h16v2H4v-2Z" />
      <Path d="M6 8h12M6 12h12M6 16h12" />
    </Svg>
  );
}
