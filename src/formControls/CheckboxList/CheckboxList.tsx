/**
 * `CheckboxList` for `Form.Item`: Astryx's CheckboxList without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). It is not reached by the item's `<label htmlFor>`, so it takes the item's label text as its own, visually hidden.
 */
import {
  CheckboxList as AstryxCheckboxList,
  type CheckboxListProps as AstryxCheckboxListProps,
} from "@astryxdesign/core/CheckboxList";

import {
  EMPTY_ARRAY,
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type CheckboxListProps = DistributiveOmit<
  AstryxCheckboxListProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxCheckboxListProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxCheckboxListProps["value"];
    onChange?: AstryxCheckboxListProps["onChange"];
  };

export function CheckboxList({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: CheckboxListProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    namesItself: true,
  });
  const [mergedValue, handleChange] = useMergedValue(
    value,
    defaultValue,
    onChange,
    EMPTY_ARRAY,
  );
  const props = {
    ...rest,
    ...field,
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxCheckboxListProps;
  return (
    <FormControlScope required={required}>
      <AstryxCheckboxList {...props} />
    </FormControlScope>
  );
}
