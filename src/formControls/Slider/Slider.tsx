/**
 * `Slider` for `Form.Item`: Astryx's Slider without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). Its thumb is not reached by the item's
 * `<label htmlFor>`, so it takes the item's label text as its own, visually
 * hidden. With no value it starts at `min`; a range slider needs an initial
 * `[from, to]`, since nothing else tells it it is one.
 */
import type { ReactElement } from "react";
import {
  Slider as AstryxSlider,
  type SliderProps as AstryxSliderProps,
  type SliderRangeProps,
  type SliderSingleProps,
} from "@astryxdesign/core/Slider";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type FormControlValueProps,
} from "../formControl";

export type SliderProps = FormControlValueProps<AstryxSliderProps>;

// Overloads, not one union: without a `value` nothing tells the two apart, so
// an inline `onChange={(v) => …}` is typed by the first that fits, a single
// value, as the slider then renders.
export function Slider(props: FormControlValueProps<SliderSingleProps>): ReactElement;
export function Slider(props: FormControlValueProps<SliderRangeProps>): ReactElement;
export function Slider({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: SliderProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    namesItself: true,
  });
  const [mergedValue, handleChange] = useMergedValue(
    value,
    defaultValue,
    onChange,
    rest.min ?? 0,
  );
  const props = {
    ...rest,
    ...field,
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxSliderProps;
  return (
    <FormControlScope required={required}>
      <AstryxSlider {...props} />
    </FormControlScope>
  );
}
