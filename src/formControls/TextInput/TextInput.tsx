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
  useFormControl,
  useMergedValue,
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
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxTextInputProps["value"];
    onChange?: AstryxTextInputProps["onChange"];
    /**
     * The native limit on the text's length, as antd's Input takes. Astryx
     * passes it to the `<input>` but does not declare it.
     */
    maxLength?: number;
  };

export function TextInput({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: TextInputProps) {
  const { required, field, width } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue(value, defaultValue, onChange, "");
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    width,
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxTextInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxTextInput {...props} />
    </FormControlScope>
  );
}
