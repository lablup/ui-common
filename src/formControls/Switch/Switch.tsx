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
  useFormControl,
  useMergedValue,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type SwitchProps = Omit<
  ForkSwitchProps,
  FormControlChromeProps | "value" | "onChange" | "children"
> &
  FormControlProps & {
    value?: boolean;
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: boolean;
    /** antd's name for `defaultValue`. */
    defaultChecked?: boolean;
    /** antd's name for the value, for `valuePropName="checked"`. */
    checked?: boolean;
    onChange?: ForkSwitchProps["onChange"];
    /** The text beside the control. */
    children?: string;
  };

export function Switch({
  value,
  checked,
  defaultValue,
  defaultChecked,
  onChange,
  status,
  disabled,
  children,
  // The fork spreads the rest onto its root, a plain div: the item's
  // `aria-required` and `aria-invalid` belong on the checkbox, which Astryx
  // sets from the required scope and the status.
  "aria-required": ariaRequired,
  "aria-invalid": _ariaInvalid,
  ...rest
}: SwitchProps) {
  const { required, field, width } = useFormControl({
    status,
    disabled,
    ariaRequired,
    ariaLabel: rest["aria-label"],
    sizing: "Switch",
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
  // passed as `aria-label` (the fork puts it on the checkbox) so the two
  // `<label>`s are not read twice.
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
  } as ForkSwitchProps;
  return (
    <FormControlScope required={required}>
      <ForkSwitch {...props} />
    </FormControlScope>
  );
}
