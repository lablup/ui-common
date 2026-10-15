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
  noop,
  useFormControl,
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
    onChange?: AstryxDateInputProps["onChange"];
  };

export function DateInput({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: DateInputProps) {
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
  } as unknown as AstryxDateInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxDateInput {...props} />
    </FormControlScope>
  );
}
