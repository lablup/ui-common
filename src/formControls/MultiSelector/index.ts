/**
 * `@lablup/ui-common/MultiSelector`: Astryx's MultiSelector subpath, with `MultiSelector` and
 * `MultiSelectorProps` replaced by ui-common's `Form.Item` wrapper (src/formControls),
 * and the option types widened so `disabled` takes `{ reason }`.
 * Astryx's is excluded (exports.exclude.json).
 */
export * from "@astryxdesign/core/MultiSelector";
export { MultiSelector } from "./MultiSelector";
export type {
  MultiSelectorOptionData,
  MultiSelectorOptionType,
  MultiSelectorProps,
  MultiSelectorSection,
} from "./MultiSelector";
