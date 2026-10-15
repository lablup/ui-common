/**
 * `Selector` for `Form.Item`: Astryx's Selector without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  Selector as AstryxSelector,
  type SelectorProps as AstryxSelectorProps,
  type SelectorOptionType,
} from "@astryxdesign/core/Selector";

import {
  FormControlScope,
  noop,
  useFormControl,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type SelectorProps<T extends SelectorOptionType = SelectorOptionType> =
  DistributiveOmit<
    AstryxSelectorProps<T>,
    FormControlChromeProps | "value" | "onChange"
  > &
    FormControlProps & {
      value?: AstryxSelectorProps<T>["value"];
      onChange?: AstryxSelectorProps<T>["onChange"];
    };

export function Selector<T extends SelectorOptionType = SelectorOptionType>({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: SelectorProps<T>) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
  });
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    value: value,
    onChange: onChange ?? noop,
  } as unknown as AstryxSelectorProps<T>;
  return (
    <FormControlScope required={required}>
      <AstryxSelector<T> {...props} />
    </FormControlScope>
  );
}
