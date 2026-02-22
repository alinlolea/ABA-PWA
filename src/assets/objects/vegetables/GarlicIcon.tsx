import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function GarlicIcon({
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
      <Path d="M12 2c-1 2 0 5 0 7 0 2 1 4 1 6s0 4-1 5c-1 1-3 1-4 0-1-1-1-3 0-5 1-2 1-4 1-6s0-5 0-7c1-2 3-2 4 0Z" />
      <Path d="M10 8h4M11 12h2M10 16h4" />
    </Svg>
  );
}
