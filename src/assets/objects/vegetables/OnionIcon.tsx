import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function OnionIcon({
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
      <Circle cx="12" cy="12" r="6" />
      <Path d="M12 6v2M12 16v2M6 12h2M16 12h2" />
      <Path d="M8 8l1.5 1.5M14.5 14.5L16 16M14.5 8L16 6.5M8 14.5L6.5 16" />
      <Path d="M12 4v0M12 20v0" />
    </Svg>
  );
}
