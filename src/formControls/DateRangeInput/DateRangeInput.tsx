/**
 * `DateRangeInput` for `Form.Item`: Astryx's DateRangeInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). It is not reached by the item's `<label htmlFor>`, so it takes the item's label text as its own, visually hidden.
 */
import {
  DateRangeInput as AstryxDateRangeInput,
  type DateRangeInputProps as AstryxDateRangeInputProps,
} from "@astryxdesign/core/DateRangeInput";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type DateRangeInputProps = DistributiveOmit<
  AstryxDateRangeInputProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxDateRangeInputProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxDateRangeInputProps["value"];
    onChange?: AstryxDateRangeInputProps["onChange"];
  };

export function DateRangeInput({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  // Not allowed on the control's role; required is announced through the
  // required scope instead.
  "aria-required": ariaRequired,
  ...rest
}: DateRangeInputProps) {
  const { required, field, width } = useFormControl({
    status,
    disabled,
    ariaRequired,
    ariaLabel: rest["aria-label"],
    namesItself: true,
    sizing: "DateRangeInput",
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue(
    value,
    defaultValue,
    onChange,
    null,
  );
  const props = {
    ...rest,
    ...field,
    width,
    statusVariant: "detached",
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxDateRangeInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxDateRangeInput {...props} />
    </FormControlScope>
  );
}
