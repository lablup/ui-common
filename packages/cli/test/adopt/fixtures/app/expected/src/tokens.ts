import * as stylex from "@stylexjs/stylex";
import { colorVars, spacingVars } from "@lablup/ui-common/theme/tokens.stylex";

export type { ButtonProps } from "@lablup/ui-common/Button";
export { Badge as StatusBadge } from "@lablup/ui-common/Badge";

export type ToastModule = typeof import("@lablup/ui-common/Toast");

export const loadTable = () => import("@lablup/ui-common/Table");

// The package names this file talks about are data, not imports.
export const ASTRYX_PACKAGES = ["@astryxdesign/core", "@astryxdesign/lab"];

export const styles = stylex.create({
  panel: { color: colorVars["--color-text"], padding: spacingVars["--spacing-4"] },
});
