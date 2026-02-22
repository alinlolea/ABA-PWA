import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function BallIcon({
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
      <Circle cx="12" cy="12" r="8" />
      <Path d="M4 12h16M12 4c2 2 4 4 4 8s-2 6-4 8c-2-2-4-4-4-8s2-6 4-8Z" />
      <Path d="M12 4c-2 2-4 4-4 8s2 6 4 8c2-2 4-4 4-8s-2-6-4-8Z" />
    </Svg>
  );
}
