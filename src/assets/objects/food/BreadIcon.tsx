import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function BreadIcon({
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
      <Path d="M6 10c0-2 2-4 6-4s6 2 6 4v8H6v-8Z" />
      <Path d="M8 12h8M10 14h4M12 10v8" />
    </Svg>
  );
}
