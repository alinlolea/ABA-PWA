import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function TrainIcon({
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
      <Path d="M4 8h16v8H4V8Z" />
      <Path d="M4 8V6c0-2 2-4 4-4h8c2 0 4 2 4 4v2" />
      <Path d="M8 12h2M14 12h2M8 16h8" />
      <Path d="M6 16h2M16 16h2M10 4v2M14 4v2" />
    </Svg>
  );
}
