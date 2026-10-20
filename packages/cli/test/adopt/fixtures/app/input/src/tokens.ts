import * as stylex from "@stylexjs/stylex";
import { colorVars, spacingVars } from "@astryxdesign/core/theme/tokens.stylex";

export type { ButtonProps } from "@astryxdesign/core/Button";
export { Badge as StatusBadge } from "@astryxdesign/core/Badge";

export type ToastModule = typeof import("@astryxdesign/core/Toast");

export const loadTable = () => import("@astryxdesign/core/Table");

// The package names this file talks about are data, not imports.
export const ASTRYX_PACKAGES = ["@astryxdesign/core", "@astryxdesign/lab"];

export const styles = stylex.create({
  panel: { color: colorVars["--color-text"], padding: spacingVars["--spacing-4"] },
});
