/**
 * `@lablup/ui-common/SegmentedControl`: ui-common's `Form.Item` wrapper
 * (src/formControls) over its SegmentedControl fork, with the fork's
 * `SegmentedControlItem`, which reads the fork's context. Astryx's is
 * excluded (exports.exclude.json).
 */
export {
  SegmentedControlItem,
  type SegmentedControlItemProps,
  type SegmentedControlLayout,
  type SegmentedControlSize,
} from "../../forks/SegmentedControl";
export { SegmentedControl } from "./SegmentedControl";
export type { SegmentedControlProps } from "./SegmentedControl";
