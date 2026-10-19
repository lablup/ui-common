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
  noop,
  useFormControl,
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
    onChange?: AstryxMultiSelectorProps<T>["onChange"];
  };

export function MultiSelector<
  T extends MultiSelectorOptionType = MultiSelectorOptionType,
>({ value, onChange, status, disabled, ...rest }: MultiSelectorProps<T>) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
  });
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    value: value ?? EMPTY_ARRAY,
    onChange: onChange ?? noop,
  } as unknown as AstryxMultiSelectorProps<T>;
  return (
    <FormControlScope required={required}>
      <AstryxMultiSelector<T> {...props} />
    </FormControlScope>
  );
}
