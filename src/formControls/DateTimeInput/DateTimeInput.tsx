/**
 * `DateTimeInput` for `Form.Item`: Astryx's DateTimeInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  DateTimeInput as AstryxDateTimeInput,
  type DateTimeInputProps as AstryxDateTimeInputProps,
} from "@astryxdesign/core/DateTimeInput";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type DateTimeInputProps = DistributiveOmit<
  AstryxDateTimeInputProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxDateTimeInputProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxDateTimeInputProps["value"];
    onChange?: AstryxDateTimeInputProps["onChange"];
  };

export function DateTimeInput({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: DateTimeInputProps) {
  const { required, field, width } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    sizing: "DateTimeInput",
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue(
    value,
    defaultValue,
    onChange,
    undefined,
  );
  const props = {
    ...rest,
    ...field,
    width,
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxDateTimeInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxDateTimeInput {...props} />
    </FormControlScope>
  );
}
