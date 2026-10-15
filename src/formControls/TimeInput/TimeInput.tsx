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
  noop,
  useFormControl,
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
    onChange?: AstryxTimeInputProps["onChange"];
  };

export function TimeInput({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: TimeInputProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
  });
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    value: value,
    onChange: onChange ?? noop,
  } as unknown as AstryxTimeInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxTimeInput {...props} />
    </FormControlScope>
  );
}
