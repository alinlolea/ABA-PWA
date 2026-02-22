import React from "react";
import Svg, { Path } from "react-native-svg";
import { ICON_DEFAULTS, type ObjectIconProps } from "../types";

export default function CornIcon({
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
      <Path d="M12 2l-2 6 2 2 2-2-2-6Z" />
      <Path d="M10 8h4M12 6v4" />
      <Path d="M8 12l2 2 2-2M12 14l2 2 2-2M8 16l2 2 2-2" />
      <Path d="M6 20h12" />
    </Svg>
  );
}
