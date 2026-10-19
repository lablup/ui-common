/**
 * `DateInput` for `Form.Item`: Astryx's DateInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  DateInput as AstryxDateInput,
  type DateInputProps as AstryxDateInputProps,
} from "@astryxdesign/core/DateInput";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type DateInputProps = DistributiveOmit<
  AstryxDateInputProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxDateInputProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxDateInputProps["value"];
    onChange?: AstryxDateInputProps["onChange"];
  };

export function DateInput({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: DateInputProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
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
    statusVariant: "detached",
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxDateInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxDateInput {...props} />
    </FormControlScope>
  );
}
