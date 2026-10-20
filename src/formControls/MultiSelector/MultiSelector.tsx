/**
 * `MultiSelector` for `Form.Item`: Astryx's MultiSelector without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  MultiSelector as AstryxMultiSelector,
  type MultiSelectorProps as AstryxMultiSelectorProps,
  type MultiSelectorOptionType,
} from "@astryxdesign/core/MultiSelector";

import {
  EMPTY_ARRAY,
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type MultiSelectorProps<
  T extends MultiSelectorOptionType = MultiSelectorOptionType,
> = DistributiveOmit<
  AstryxMultiSelectorProps<T>,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxMultiSelectorProps<T>["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxMultiSelectorProps<T>["value"];
    onChange?: AstryxMultiSelectorProps<T>["onChange"];
  };

export function MultiSelector<
  T extends MultiSelectorOptionType = MultiSelectorOptionType,
>({ value, defaultValue, onChange, status, disabled, ...rest }: MultiSelectorProps<T>) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
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
    statusVariant: "detached",
    width: rest.width ?? "100%",
    // The selection itself, as antd's multiple Select shows it, not a count.
    triggerDisplay: rest.triggerDisplay ?? "labels",
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxMultiSelectorProps<T>;
  return (
    <FormControlScope required={required}>
      <AstryxMultiSelector<T> {...props} />
    </FormControlScope>
  );
}
