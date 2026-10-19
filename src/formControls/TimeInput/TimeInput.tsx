/**
 * `TimeInput` for `Form.Item`: Astryx's TimeInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  TimeInput as AstryxTimeInput,
  type TimeInputProps as AstryxTimeInputProps,
} from "@astryxdesign/core/TimeInput";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type TimeInputProps = DistributiveOmit<
  AstryxTimeInputProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxTimeInputProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxTimeInputProps["value"];
    onChange?: AstryxTimeInputProps["onChange"];
  };

export function TimeInput({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: TimeInputProps) {
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
  } as unknown as AstryxTimeInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxTimeInput {...props} />
    </FormControlScope>
  );
}
