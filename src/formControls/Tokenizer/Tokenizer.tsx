/**
 * `Tokenizer` for `Form.Item`: Astryx's Tokenizer without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 */
import {
  Tokenizer as AstryxTokenizer,
  type TokenizerProps as AstryxTokenizerProps,
} from "@astryxdesign/core/Tokenizer";
import type { SearchableItem } from "@astryxdesign/core/Typeahead";

import {
  EMPTY_ARRAY,
  FormControlScope,
  noop,
  useFormControl,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type TokenizerProps<T extends SearchableItem> = DistributiveOmit<
  AstryxTokenizerProps<T>,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxTokenizerProps<T>["value"];
    onChange?: AstryxTokenizerProps<T>["onChange"];
  };

export function Tokenizer<T extends SearchableItem>({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: TokenizerProps<T>) {
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
  } as unknown as AstryxTokenizerProps<T>;
  return (
    <FormControlScope required={required}>
      <AstryxTokenizer<T> {...props} />
    </FormControlScope>
  );
}
