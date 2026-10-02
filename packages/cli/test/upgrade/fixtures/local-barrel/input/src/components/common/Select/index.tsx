import { Select as BaseSelect } from "@lablup/ui-common/components/Select";
import type { SelectProps } from "@lablup/ui-common/components/Select";

// Supplies the empty-search line the package cannot localise.
export function Select({ noOptionsLabel, ...rest }: SelectProps) {
  return <BaseSelect {...rest} noOptionsLabel={noOptionsLabel ?? "Nothing matches"} />;
}
