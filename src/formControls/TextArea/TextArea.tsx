/**
 * `TextArea` for `Form.Item`: Astryx's TextArea without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  TextArea as AstryxTextArea,
  type TextAreaProps as AstryxTextAreaProps,
} from "@astryxdesign/core/TextArea";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type TextAreaProps = DistributiveOmit<
  AstryxTextAreaProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxTextAreaProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxTextAreaProps["value"];
    onChange?: AstryxTextAreaProps["onChange"];
  };

export function TextArea({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: TextAreaProps) {
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
  } as unknown as AstryxTextAreaProps;
  return (
    <FormControlScope required={required}>
      <AstryxTextArea {...props} />
    </FormControlScope>
  );
}
