import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function TractorIcon({
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
      <Path d="M4 14h8v4H4v-4Z" />
      <Circle cx="7" cy="18" r="2" />
      <Path d="M12 14h6l2-4V8h-4l-2 4" />
      <Circle cx="17" cy="18" r="2" />
      <Path d="M14 10h4M8 14V10M12 12v2" />
    </Svg>
  );
}
