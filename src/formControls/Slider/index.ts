/**
 * `@lablup/ui-common/Slider`: Astryx's Slider subpath, with `Slider` and its
 * props types replaced by ui-common's `Form.Item` wrapper (src/formControls):
 * no field chrome, and `status` the border only. Astryx's is excluded
 * (exports.exclude.json).
 */
export * from "@astryxdesign/core/Slider";
export { Slider } from "./Slider";
export type {
  SliderBaseProps,
  SliderProps,
  SliderRangeProps,
  SliderSingleProps,
} from "./Slider";
