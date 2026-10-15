/**
 * `CheckboxInput` for `Form.Item`: ui-common's CheckboxInput fork (src/forks/CheckboxInput, which honours
 * the item's `id`) without the field chrome the item owns (see
 * ../formControl.tsx). The text beside the control is `children`, as in
 * antd; the item's `<label htmlFor>` names it as well. `checked` is
 * accepted beside `value`, so `valuePropName="checked"` works.
 */
import {
  CheckboxInput as ForkCheckboxInput,
  type CheckboxInputProps as ForkCheckboxInputProps,
} from "../../forks/CheckboxInput/CheckboxInput";

import {
  FormControlScope,
  noop,
  useFormControl,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type CheckboxInputProps = Omit<
  ForkCheckboxInputProps,
  FormControlChromeProps | "value" | "onChange" | "children"
> &
  FormControlProps & {
    value?: boolean | "indeterminate";
    /** antd's name for the value, for `valuePropName="checked"`. */
    checked?: boolean | "indeterminate";
    onChange?: ForkCheckboxInputProps["onChange"];
    /** The text beside the control. */
    children?: string;
  };

export function CheckboxInput({
  value,
  checked,
  onChange,
  status,
  disabled,
  children,
  ...rest
}: CheckboxInputProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
  });
  const props = {
    ...rest,
    ...field,
    label: children ?? "",
    isLabelHidden: children === undefined,
    value: checked ?? value ?? false,
    onChange: onChange ?? noop,
  } as ForkCheckboxInputProps;
  return (
    <FormControlScope required={required}>
      <ForkCheckboxInput {...props} />
    </FormControlScope>
  );
}
