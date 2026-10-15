/**
 * `Switch` for `Form.Item`: ui-common's Switch fork (src/forks/Switch, which honours
 * the item's `id`) without the field chrome the item owns (see
 * ../formControl.tsx). The text beside the control is `children`, as in
 * antd; the item's `<label htmlFor>` names it as well. `checked` is
 * accepted beside `value`, so `valuePropName="checked"` works.
 */
import {
  Switch as ForkSwitch,
  type SwitchProps as ForkSwitchProps,
} from "../../forks/Switch/Switch";

import {
  FormControlScope,
  noop,
  useFormControl,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type SwitchProps = Omit<
  ForkSwitchProps,
  FormControlChromeProps | "value" | "onChange" | "children"
> &
  FormControlProps & {
    value?: boolean;
    /** antd's name for the value, for `valuePropName="checked"`. */
    checked?: boolean;
    onChange?: ForkSwitchProps["onChange"];
    /** The text beside the control. */
    children?: string;
  };

export function Switch({
  value,
  checked,
  onChange,
  status,
  disabled,
  children,
  ...rest
}: SwitchProps) {
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
  } as ForkSwitchProps;
  return (
    <FormControlScope required={required}>
      <ForkSwitch {...props} />
    </FormControlScope>
  );
}
