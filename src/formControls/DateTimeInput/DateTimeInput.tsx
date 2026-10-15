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
  noop,
  useFormControl,
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
    onChange?: AstryxDateTimeInputProps["onChange"];
  };

export function DateTimeInput({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: DateTimeInputProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
  });
  const props = {
    ...rest,
    ...field,
    value: value,
    onChange: onChange ?? noop,
  } as unknown as AstryxDateTimeInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxDateTimeInput {...props} />
    </FormControlScope>
  );
}
