/**
 * `@lablup/ui-common/CommandPalette`: Astryx's CommandPalette subpath, with
 * `CommandPalette` replaced by ui-common's, which is pinned to the top of the
 * viewport instead of centred. Astryx's is excluded (exports.exclude.json).
 */
export * from "@astryxdesign/core/CommandPalette";
export { CommandPalette } from "./CommandPalette";
export type { CommandPaletteProps } from "./CommandPalette";
