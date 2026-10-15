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
  noop,
  useFormControl,
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
    onChange?: AstryxTextAreaProps["onChange"];
  };

export function TextArea({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: TextAreaProps) {
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
  } as unknown as AstryxTextAreaProps;
  return (
    <FormControlScope required={required}>
      <AstryxTextArea {...props} />
    </FormControlScope>
  );
}
