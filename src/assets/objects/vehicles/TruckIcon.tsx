import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function TruckIcon({
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
      <Path d="M2 12h4v6h12v-6h2l-2-6H8V6H2v6Z" />
      <Path d="M6 18v-4h8v4M14 14h4M6 14h4" />
      <Path d="M18 18h2v-2" />
    </Svg>
  );
}
