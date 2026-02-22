declare module "*.svg" {
  import type { ComponentType } from "react";
  const content: ComponentType<{ width?: number; height?: number; color?: string }>;
  export default content;
}
