/**
 * `Typeahead` for `Form.Item`: Astryx's Typeahead without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  Typeahead as AstryxTypeahead,
  type TypeaheadProps as AstryxTypeaheadProps,
  type SearchableItem,
} from "@astryxdesign/core/Typeahead";

import {
  FormControlScope,
  noop,
  useFormControl,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type TypeaheadProps<T extends SearchableItem> = DistributiveOmit<
  AstryxTypeaheadProps<T>,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxTypeaheadProps<T>["value"];
    onChange?: AstryxTypeaheadProps<T>["onChange"];
  };

export function Typeahead<T extends SearchableItem>({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: TypeaheadProps<T>) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
  });
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    value: value ?? null,
    onChange: onChange ?? noop,
  } as unknown as AstryxTypeaheadProps<T>;
  return (
    <FormControlScope required={required}>
      <AstryxTypeahead<T> {...props} />
    </FormControlScope>
  );
}
