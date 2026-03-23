import type { ImageSourcePropType } from "react-native";

/** Metro `require("*.png")`: native = number; web often = { uri } or `{ default }` from bundler. */
export function isRasterImageSource(image: unknown): image is ImageSourcePropType {
  if (typeof image === "number") return true;
  if (typeof image === "object" && image !== null) {
    const o = image as Record<string, unknown>;
    if (typeof o.uri === "string") return true;
    if (typeof o.default === "number") return true;
    if (typeof o.default === "object" && o.default !== null && "uri" in (o.default as object)) {
      return true;
    }
  }
  return false;
}

export function normalizeRasterSource(src: ImageSourcePropType): ImageSourcePropType {
  if (typeof src === "object" && src !== null && !Array.isArray(src) && "default" in src) {
    return (src as { default: ImageSourcePropType }).default;
  }
  return src;
}
