/**
 * `@lablup/ui-common/SegmentedControl`: Astryx's SegmentedControl subpath,
 * with `SegmentedControl` and its props type replaced by ui-common's
 * `Form.Item` wrapper (src/formControls). Astryx's is excluded
 * (exports.exclude.json).
 */
export * from "@astryxdesign/core/SegmentedControl";
export { SegmentedControl } from "./SegmentedControl";
export type { SegmentedControlProps } from "./SegmentedControl";
