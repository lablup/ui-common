/**
 * ui-common's copy of Astryx's CheckboxInput: a passed `id` reaches the native
 * checkbox. Not exported as is: `@lablup/ui-common/CheckboxInput` is the Form.Item
 * wrapper in src/formControls/CheckboxInput, which renders this. ui-common's own
 * components import it from here.
 */
export { CheckboxInput } from "./CheckboxInput";
export type { CheckboxInputProps, CheckboxInputSize } from "./CheckboxInput";
