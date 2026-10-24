/**
 * `CheckboxInput` for `Form.Item`: Astryx's CheckboxInput, which honours the
 * item's `id`, without the field chrome the item owns (see
 * ../formControl.tsx). The text beside the control is `children`, as in
 * antd; the item's `<label htmlFor>` names it as well. `checked` is
 * accepted beside `value`, so `valuePropName="checked"` works.
 */
import {
  CheckboxInput as AstryxCheckboxInput,
  type CheckboxInputProps as AstryxCheckboxInputProps,
} from "@astryxdesign/core/CheckboxInput";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type CheckboxInputProps = Omit<
  AstryxCheckboxInputProps,
  FormControlChromeProps | "value" | "onChange" | "children"
> &
  FormControlProps & {
    value?: boolean | "indeterminate";
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: boolean | "indeterminate";
    /** antd's name for `defaultValue`. */
    defaultChecked?: boolean | "indeterminate";
    /** antd's name for the value, for `valuePropName="checked"`. */
    checked?: boolean | "indeterminate";
    onChange?: AstryxCheckboxInputProps["onChange"];
    /** The text beside the control. */
    children?: string;
  };

export function CheckboxInput({
  value,
  checked,
  defaultValue,
  defaultChecked,
  onChange,
  status,
  disabled,
  children,
  ...rest
}: CheckboxInputProps) {
  const { required, field, width } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    sizing: "CheckboxInput",
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue(
    checked ?? value,
    defaultChecked ?? defaultValue,
    onChange,
    false,
  );
  // With inline text the item's `<label htmlFor>` and the text both name
  // the control, so it takes no `aria-label`, which would drop the text.
  // Without it the name is the item's label or the caller's `aria-label`,
  // passed as `aria-label` so the two `<label>`s are not read twice.
  const inline = children !== undefined;
  const props = {
    ...rest,
    ...field,
    width,
    label: inline ? children : field.label,
    isLabelHidden: !inline,
    "aria-label": inline ? undefined : field["aria-label"],
    value: mergedValue,
    onChange: handleChange,
  } as AstryxCheckboxInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxCheckboxInput {...props} />
    </FormControlScope>
  );
}
