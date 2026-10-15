/**
 * `TextInput` for `Form.Item`: Astryx's TextInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  TextInput as AstryxTextInput,
  type TextInputProps as AstryxTextInputProps,
} from "@astryxdesign/core/TextInput";

import {
  FormControlScope,
  noop,
  useFormControl,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type TextInputProps = DistributiveOmit<
  AstryxTextInputProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxTextInputProps["value"];
    onChange?: AstryxTextInputProps["onChange"];
  };

export function TextInput({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: TextInputProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
  });
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    value: value ?? "",
    onChange: onChange ?? noop,
  } as unknown as AstryxTextInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxTextInput {...props} />
    </FormControlScope>
  );
}
