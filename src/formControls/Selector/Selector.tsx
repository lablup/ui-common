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
  useFormControl,
  useMergedValue,
  type FormControlValueProps,
} from "../formControl";

export type SelectorProps<T extends SelectorOptionType = SelectorOptionType> =
  FormControlValueProps<AstryxSelectorProps<T>>;

export function Selector<T extends SelectorOptionType = SelectorOptionType>({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: SelectorProps<T>) {
  const { required, field, width } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    sizing: "Selector",
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue(
    value,
    defaultValue,
    onChange,
    undefined,
  );
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    width,
    // Without a placement Astryx lays the panel over the trigger, the selected
    // option on top of it, which hides the item's label above.
    placement: rest.placement ?? "below",
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxSelectorProps<T>;
  return (
    <FormControlScope required={required}>
      <AstryxSelector<T> {...props} />
    </FormControlScope>
  );
}
