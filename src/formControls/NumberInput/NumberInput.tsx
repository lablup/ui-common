/**
 * `NumberInput` for `Form.Item`: Astryx's NumberInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  NumberInput as AstryxNumberInput,
  type NumberInputProps as AstryxNumberInputProps,
} from "@astryxdesign/core/NumberInput";

import {
  FormControlScope,
  noop,
  useFormControl,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type NumberInputProps = DistributiveOmit<
  AstryxNumberInputProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxNumberInputProps["value"];
    onChange?: AstryxNumberInputProps["onChange"];
  };

export function NumberInput({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: NumberInputProps) {
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
  } as unknown as AstryxNumberInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxNumberInput {...props} />
    </FormControlScope>
  );
}
