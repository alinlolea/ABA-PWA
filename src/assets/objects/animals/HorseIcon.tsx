import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function HorseIcon({
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
      <Path d="M6 18c2 0 4-2 4-4V10c0-2 2-4 4-4h2l2 4-2 2v4c0 2-2 4-4 4H6Z" />
      <Path d="M10 10h4M12 8v4M16 12v2M6 14h4" />
      <Path d="M14 4l2 2M18 8l2-2" />
    </Svg>
  );
}
