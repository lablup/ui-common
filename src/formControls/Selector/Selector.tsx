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
 *
 * `showSelectedOptionTooltip` reads the selected option's full label on the
 * trigger when the trigger cuts it off with an ellipsis (../triggerTooltip).
 */
import { useEffect, useMemo, useRef, useState, type Ref } from "react";

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
import { getSelectableOptions } from "@astryxdesign/core/Selector/utils";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlValueProps,
} from "../formControl";
import { withOptionDisabledReason, type OptionDisabled } from "../optionDisabledReason";
import { TriggerTooltip, useClippedContent } from "../triggerTooltip";

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
    /**
     * A tooltip on the trigger with the selected option's full label, shown on
     * hover or on focus (the keyboard's included) while the trigger cuts the
     * label off with an ellipsis. None while nothing is selected, while the
     * control is disabled, while the listbox is open, or with `renderValue`,
     * whose content the caller draws.
     * @default false
     */
    showSelectedOptionTooltip?: boolean;
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
  showSelectedOptionTooltip = false,
  onOpenChange,
  ...rest
}: SelectorProps<T>) {
  const openChangeRef = useOpenChange(onOpenChange);
  // Only with showSelectedOptionTooltip: the trigger element (state, so the
  // tooltip follows a replaced element) and the tooltip's id, which
  // TriggerTooltip reports.
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [tooltipId, setTooltipId] = useState<string>();
  const triggerRef = useMergedRefs<HTMLButtonElement>(
    rest.ref as Ref<HTMLButtonElement> | undefined,
    openChangeRef,
    showSelectedOptionTooltip ? setTrigger : undefined,
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
  // Astryx resolves the trigger's label from the same option list; a value
  // with no option has no trigger label and so no tooltip to show.
  const selectedOption = useMemo(
    () =>
      !showSelectedOptionTooltip || mergedValue == null
        ? undefined
        : getSelectableOptions(options as AstryxSelectorOptionType[]).find(
            (option) => option.value === mergedValue,
          ),
    [showSelectedOptionTooltip, options, mergedValue],
  );
  const hasTooltip = !!selectedOption && !field.isDisabled && !rest.renderValue;
  const isClipped = useClippedContent(trigger, hasTooltip);
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
    // React owns the attribute: the tooltip's id joins the caller's here.
    ...(tooltipId && {
      "aria-describedby": [rest["aria-describedby"], tooltipId]
        .filter(Boolean)
        .join(" "),
    }),
  } as unknown as AstryxSelectorProps<AstryxSelectorOptionType>;
  return (
    <FormControlScope required={required}>
      <AstryxSelector {...props} />
      {hasTooltip && trigger && isClipped ? (
        <TriggerTooltip
          trigger={trigger}
          renderContent={() => selectedOption?.label ?? selectedOption?.value ?? ""}
          onDescribedBy={setTooltipId}
        />
      ) : null}
    </FormControlScope>
  );
}
