import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function BroccoliIcon({
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
      <Path d="M12 2v4c0 2 2 4 4 4 2 0 4 2 4 6s-2 6-6 6H10c-4 0-6-3-6-6s2-6 4-6c2 0 4-2 4-4V2h4Z" />
      <Path d="M8 12c2 0 4 2 4 4M16 12c-2 0-4 2-4 4M12 10v4" />
    </Svg>
  );
}
