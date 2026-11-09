/**
 * `Selector` for `Form.Item`: Astryx's Selector without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 *
 * An option's `disabled` also takes `{ reason }`: the option is disabled and
 * hovering its row says why (../optionDisabledReason.tsx).
 *
 * `onOpenChange` is MultiSelector's, which Astryx's Selector lacks: the
 * wrapper watches the trigger's `aria-expanded`, which follows the panel
 * however it opens or closes, and calls it on each change.
 */
import { useEffect, useRef, type Ref } from "react";

import { useMergedRefs } from "@astryxdesign/core/hooks";
import {
  Selector as AstryxSelector,
  SelectorOption,
  type SelectorDivider,
  type SelectorOptionData as AstryxSelectorOptionData,
  type SelectorOptionType as AstryxSelectorOptionType,
  type SelectorProps as AstryxSelectorProps,
  type SelectorSection as AstryxSelectorSection,
} from "@astryxdesign/core/Selector";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlValueProps,
} from "../formControl";
import { withOptionDisabledReason, type OptionDisabled } from "../optionDisabledReason";

/** Astryx's option, with `disabled` also taking `{ reason }`. */
export type SelectorOptionData = Omit<AstryxSelectorOptionData, "disabled"> & {
  /** `{ reason }` disables the option and shows why when its row is hovered. */
  disabled?: OptionDisabled;
};
export type SelectorSection = Omit<AstryxSelectorSection, "options"> & {
  options: SelectorOptionData[];
};
export type SelectorOptionType =
  string | SelectorOptionData | SelectorDivider | SelectorSection;

/** `renderOption` and `renderValue` get the option with a boolean `disabled`. */
export type SelectorProps<T extends SelectorOptionType = SelectorOptionType> =
  DistributiveOmit<
    FormControlValueProps<AstryxSelectorProps<AstryxSelectorOptionType>>,
    "options"
  > & {
    options: T[];
    /**
     * Called whenever the panel opens or closes, however it happened: the
     * trigger, the keyboard, a light dismiss or Escape. As MultiSelector's.
     */
    onOpenChange?: (isOpen: boolean) => void;
  };

/** Calls `onOpenChange` when the trigger's `aria-expanded` changes. */
function useOpenChange(
  onOpenChange: ((isOpen: boolean) => void) | undefined,
): Ref<HTMLButtonElement> {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    // The panel starts closed; `isDefaultOpen` may have opened it already.
    let isOpen = false;
    const sync = () => {
      const next = trigger.getAttribute("aria-expanded") === "true";
      if (next === isOpen) return;
      isOpen = next;
      onOpenChangeRef.current?.(next);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(trigger, { attributeFilter: ["aria-expanded"] });
    return () => observer.disconnect();
  }, []);
  return triggerRef;
}

export function Selector<T extends SelectorOptionType = SelectorOptionType>({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  options,
  onOpenChange,
  ...rest
}: SelectorProps<T>) {
  const openChangeRef = useOpenChange(onOpenChange);
  const triggerRef = useMergedRefs<HTMLButtonElement>(
    rest.ref as Ref<HTMLButtonElement> | undefined,
    openChangeRef,
  );
  const { required, field, width } = useFormControl({
    component: "Selector",
    caller: rest,
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
  const reasoned = withOptionDisabledReason<T, AstryxSelectorOptionData>({
    options,
    renderOption: rest.renderOption,
    renderDefault: (option) => (
      <SelectorOption
        icon={option.icon}
        label={option.label ?? option.value}
        description={option.description}
      />
    ),
  });
  const props = {
    ...rest,
    ...field,
    options: reasoned.options,
    statusVariant: "detached",
    width,
    // Without a placement Astryx lays the panel over the trigger, the selected
    // option on top of it, which hides the item's label above.
    placement: rest.placement ?? "below",
    value: mergedValue,
    onChange: handleChange,
    renderOption: reasoned.renderOption,
    ref: triggerRef,
  } as unknown as AstryxSelectorProps<AstryxSelectorOptionType>;
  return (
    <FormControlScope required={required}>
      <AstryxSelector {...props} />
    </FormControlScope>
  );
}
