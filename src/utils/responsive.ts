import { useWindowDimensions } from "react-native";

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 800;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

  const rs = (size: number) => Math.round(size * scale);

  return { width, height, scale, rs };
}
