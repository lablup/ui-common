/**
 * `Switch` for `Form.Item`: ui-common's Switch fork (src/forks/Switch, which honours
 * the item's `id`) without the field chrome the item owns (see
 * ../formControl.tsx). The text beside the control is `children`, as in
 * antd; the item's `<label htmlFor>` names it as well. `checked` is
 * accepted beside `value`, so `valuePropName="checked"` works.
 */
import { use } from "react";

import { FormItemInputContext } from "../../components/Form/context";
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
  // the control. Without it, in an item the item's label is the one name:
  // Astryx's own hidden label would be read as well, and `aria-label` lands
  // on the fork's root, not on the checkbox. Standalone, the caller's
  // `aria-label` is that hidden label.
  const inline = children !== undefined;
  const inItem = use(FormItemInputContext).isFormItemInput === true;
  const ariaLabel = typeof rest["aria-label"] === "string" ? rest["aria-label"] : "";
  const props = {
    ...rest,
    ...field,
    width,
    label: inline ? children : inItem ? "" : ariaLabel,
    isLabelHidden: !inline,
    "aria-label": undefined,
    value: mergedValue,
    onChange: handleChange,
  } as ForkSwitchProps;
  return (
    <FormControlScope required={required}>
      <ForkSwitch {...props} />
    </FormControlScope>
  );
}
