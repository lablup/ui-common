/**
 * `@lablup/ui-common/Selector`: Astryx's Selector subpath, with `Selector` and
 * `SelectorProps` replaced by ui-common's `Form.Item` wrapper (src/formControls),
 * and the option types widened so `disabled` takes `{ reason }`.
 * Astryx's is excluded (exports.exclude.json).
 */
export * from "@astryxdesign/core/Selector";
export { Selector } from "./Selector";
export type {
  SelectorOptionData,
  SelectorOptionType,
  SelectorProps,
  SelectorSection,
} from "./Selector";
