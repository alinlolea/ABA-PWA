import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function TomatoIcon({
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
      <Circle cx="12" cy="12" r="7" />
      <Path d="M12 5v2M12 17v2M5 12h2M17 12h2M7.76 7.76l1.41 1.41M14.83 14.83l1.41 1.41M7.76 16.24l1.41-1.41M14.83 9.17l1.41-1.41" />
      <Path d="M10 20h4" />
    </Svg>
  );
}
