/**
 * `RadioList` for `Form.Item`: Astryx's RadioList without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). It is not reached by the item's `<label htmlFor>`, so it takes the item's label text as its own, visually hidden.
 *
 * An empty field is Astryx's `""`, its "nothing selected" (it also keys the
 * group's tab stop on it), so a `RadioListItem` whose value is `""` reads as
 * selected while the field is empty. Give every option a non-empty value.
 */
import {
  RadioList as AstryxRadioList,
  type RadioListProps as AstryxRadioListProps,
} from "@astryxdesign/core/RadioList";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type RadioListProps = DistributiveOmit<
  AstryxRadioListProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxRadioListProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxRadioListProps["value"];
    onChange?: AstryxRadioListProps["onChange"];
  };

export function RadioList({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: RadioListProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    namesItself: true,
  });
  const [mergedValue, handleChange] = useMergedValue(value, defaultValue, onChange, "");
  const props = {
    ...rest,
    ...field,
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxRadioListProps;
  return (
    <FormControlScope required={required}>
      <AstryxRadioList {...props} />
    </FormControlScope>
  );
}
