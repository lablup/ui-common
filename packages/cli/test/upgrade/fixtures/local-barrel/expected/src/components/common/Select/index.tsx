import { Selector as BaseSelect } from "@lablup/ui-common/Selector";
import type { SelectorProps } from "@lablup/ui-common/Selector";

// Supplies the empty-search line the package cannot localise.
export function Select({ noOptionsLabel, ...rest }: SelectorProps) {
  return (
    // TODO(ui-common-upgrade): props spread into <BaseSelect> are not migrated; check them against Astryx Selector's props.
    <BaseSelect {...rest} emptyText={noOptionsLabel ?? "Nothing matches"} />
  );
}
