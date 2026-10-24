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
  type SliderBaseProps as AstryxSliderBaseProps,
  type SliderProps as AstryxSliderProps,
  type SliderRangeProps as AstryxSliderRangeProps,
  type SliderSingleProps as AstryxSliderSingleProps,
} from "@astryxdesign/core/Slider";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type FormControlChromeProps,
  type FormControlProps,
  type FormControlValueProps,
} from "../formControl";

/** What both branches take: Astryx's base without the field chrome. */
export type SliderBaseProps = Omit<AstryxSliderBaseProps, FormControlChromeProps> &
  FormControlProps;
/** A single-thumb slider: `value` is a number. */
export type SliderSingleProps = FormControlValueProps<AstryxSliderSingleProps>;
/** A range slider: `value` is `[from, to]`. */
export type SliderRangeProps = FormControlValueProps<AstryxSliderRangeProps>;
export type SliderProps = SliderSingleProps | SliderRangeProps;

// Overloads, not one union: without a `value` nothing tells the two apart, so
// an inline `onChange={(v) => …}` is typed by the first that fits, a single
// value, as the slider then renders.
export function Slider(props: SliderSingleProps): ReactElement;
export function Slider(props: SliderRangeProps): ReactElement;
export function Slider({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: SliderProps) {
  const { required, field } = useFormControl({
    component: "Slider",
    caller: rest,
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
