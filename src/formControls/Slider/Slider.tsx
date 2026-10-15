/**
 * `Slider` for `Form.Item`: Astryx's Slider without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). Its thumb is not reached by the item's
 * `<label htmlFor>`, so it takes the item's label text as its own, visually
 * hidden. With no value it starts at `min`; a range slider needs an initial
 * `[from, to]`, since nothing else tells it it is one.
 */
import {
  Slider as AstryxSlider,
  type SliderProps as AstryxSliderProps,
} from "@astryxdesign/core/Slider";

import {
  FormControlScope,
  useFormControl,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type SliderProps = DistributiveOmit<
  AstryxSliderProps,
  FormControlChromeProps | "value"
> &
  FormControlProps & {
    value?: AstryxSliderProps["value"];
  };

export function Slider({ value, status, disabled, ...rest }: SliderProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    namesItself: true,
  });
  const props = {
    ...rest,
    ...field,
    value: value ?? rest.min ?? 0,
  } as unknown as AstryxSliderProps;
  return (
    <FormControlScope required={required}>
      <AstryxSlider {...props} />
    </FormControlScope>
  );
}
