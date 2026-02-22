import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function AmbulanceIcon({
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
      <Path d="M4 14v4h2v-2h12v2h2v-4H4Z" />
      <Path d="M6 14V8l2-4h8l2 4v6" />
      <Path d="M8 8h8M9 12h2M13 12h2" />
      <Path d="M12 4v4M10 6h4" />
      <Path d="M6 16h2M16 16h2" />
    </Svg>
  );
}
