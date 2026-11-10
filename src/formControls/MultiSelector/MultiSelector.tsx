/**
 * `MultiSelector` for `Form.Item`: Astryx's MultiSelector without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 *
 * An option's `disabled` also takes `{ reason }`: the option is disabled and
 * hovering its row says why (../optionDisabledReason.tsx).
 *
 * `showTooltip` lists the selected labels in a tooltip on the trigger.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MultiSelector as AstryxMultiSelector,
  type MultiSelectorDivider,
  type MultiSelectorOptionData as AstryxMultiSelectorOptionData,
  type MultiSelectorOptionType as AstryxMultiSelectorOptionType,
  type MultiSelectorProps as AstryxMultiSelectorProps,
  type MultiSelectorSection as AstryxMultiSelectorSection,
} from "@astryxdesign/core/MultiSelector";
import { useMergedRefs } from "@astryxdesign/core/hooks";
import { useTooltip } from "@astryxdesign/core/Tooltip";

import {
  EMPTY_ARRAY,
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";
import { withOptionDisabledReason, type OptionDisabled } from "../optionDisabledReason";

/** Astryx's option, with `disabled` also taking `{ reason }`. */
export type MultiSelectorOptionData = Omit<
  AstryxMultiSelectorOptionData,
  "disabled"
> & {
  /** `{ reason }` disables the option and shows why when its row is hovered. */
  disabled?: OptionDisabled;
};
export type MultiSelectorSection = Omit<AstryxMultiSelectorSection, "options"> & {
  options: MultiSelectorOptionData[];
};
export type MultiSelectorOptionType =
  string | MultiSelectorOptionData | MultiSelectorDivider | MultiSelectorSection;

type AstryxProps = AstryxMultiSelectorProps<AstryxMultiSelectorOptionType>;

/** `renderOption` gets the option with a boolean `disabled`. */
export type MultiSelectorProps<
  T extends MultiSelectorOptionType = MultiSelectorOptionType,
> = DistributiveOmit<
  AstryxProps,
  FormControlChromeProps | "value" | "onChange" | "options"
> &
  FormControlProps & {
    options: T[];
    value?: AstryxProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxProps["value"];
    onChange?: AstryxProps["onChange"];
    /**
     * Lists every selected option's label in a tooltip on the trigger, held
     * shut while the listbox is open. None while disabled or with `renderTrigger`.
     * @default false
     */
    showTooltip?: boolean;
  };

/** The selected options' labels, in selection order; a value with no option stands for itself. */
function selectedLabels(options: readonly MultiSelectorOptionType[], values: string[]) {
  const labels = new Map<string, string>();
  const add = (option: MultiSelectorOptionType) => {
    if (typeof option === "string") labels.set(option, option);
    else if ("type" in option && option.type === "section") option.options.forEach(add);
    else if ("value" in option) labels.set(option.value, option.label ?? option.value);
  };
  options.forEach(add);
  return values.map((value) => labels.get(value) ?? value).join(", ");
}

export function MultiSelector<
  T extends MultiSelectorOptionType = MultiSelectorOptionType,
>({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  options,
  showTooltip = false,
  ref,
  onOpenChange,
  ...rest
}: MultiSelectorProps<T>) {
  const { required, field, width } = useFormControl({
    component: "MultiSelector",
    caller: rest,
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    sizing: "MultiSelector",
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue(
    value,
    defaultValue,
    onChange,
    EMPTY_ARRAY,
  );
  const triggerRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );
  // A disabled InputGroup disables the trigger through context Astryx does not
  // export; the trigger's aria-disabled is where it shows (as Selector reads aria-expanded).
  const [isTriggerDisabled, setIsTriggerDisabled] = useState(false);
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!showTooltip || !trigger) return;
    const sync = () =>
      setIsTriggerDisabled(trigger.getAttribute("aria-disabled") === "true");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(trigger, { attributeFilter: ["aria-disabled"] });
    return () => observer.disconnect();
  }, [showTooltip]);
  const hasTooltip =
    showTooltip &&
    !!mergedValue?.length &&
    !field.isDisabled &&
    !isTriggerDisabled &&
    !rest.renderTrigger;
  // The hook, not <Tooltip anchorRef>: its id joins the trigger's
  // aria-describedby prop instead of being written onto the element.
  const tooltip = useTooltip({
    isEnabled: hasTooltip,
    isOpen: isOpen ? false : undefined,
  });
  const triggerRefs = useMergedRefs<HTMLElement>(ref, triggerRef, tooltip.ref);
  const reasoned = withOptionDisabledReason<T, AstryxMultiSelectorOptionData>({
    options,
    renderOption: rest.renderOption,
    renderDefault: (option) => (
      <span className="uic-option-disabled-reason__label">
        {option.label ?? option.value}
      </span>
    ),
  });
  const props = {
    ...rest,
    ...field,
    options: reasoned.options,
    statusVariant: "detached",
    width,
    // The selection itself, as antd's multiple Select shows it, not a count.
    triggerDisplay: rest.triggerDisplay ?? "labels",
    value: mergedValue,
    onChange: handleChange,
    renderOption: reasoned.renderOption,
    ref: triggerRefs,
    onOpenChange: handleOpenChange,
    "aria-describedby":
      [rest["aria-describedby"], hasTooltip ? tooltip.describedBy : null]
        .filter(Boolean)
        .join(" ") || undefined,
  } as unknown as AstryxProps;
  return (
    <FormControlScope required={required}>
      <AstryxMultiSelector {...props} />
      {hasTooltip
        ? tooltip.renderTooltip(selectedLabels(options, mergedValue ?? []))
        : null}
    </FormControlScope>
  );
}
