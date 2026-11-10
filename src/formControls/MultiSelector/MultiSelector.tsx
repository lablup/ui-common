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
import { useLayoutEffect, useState, type ReactNode } from "react";
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
  // Only with showTooltip: the trigger element (state, so the tooltip follows a
  // replaced element) and the tooltip's id, which SelectionTooltip reports.
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [tooltipId, setTooltipId] = useState<string>();
  const triggerRefs = useMergedRefs<HTMLElement>(ref, setTrigger);
  const hasTooltip =
    showTooltip && !!mergedValue?.length && !field.isDisabled && !rest.renderTrigger;
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
    ref: showTooltip ? triggerRefs : ref,
    onOpenChange,
    // React owns the attribute: the tooltip's id joins the caller's here.
    ...(tooltipId && {
      "aria-describedby": [rest["aria-describedby"], tooltipId]
        .filter(Boolean)
        .join(" "),
    }),
  } as unknown as AstryxProps;
  return (
    <FormControlScope required={required}>
      <AstryxMultiSelector {...props} />
      {hasTooltip && trigger ? (
        <SelectionTooltip
          trigger={trigger}
          content={selectedLabels(options, mergedValue ?? [])}
          onDescribedBy={setTooltipId}
        />
      ) : null}
    </FormControlScope>
  );
}

/** What the tooltip needs from the trigger: disabled, and the listbox open. */
const readTrigger = (trigger: HTMLElement) => ({
  // A disabled InputGroup disables the trigger through context Astryx does not
  // export; the trigger's aria-disabled is where it shows.
  isDisabled: trigger.getAttribute("aria-disabled") === "true",
  isExpanded: trigger.getAttribute("aria-expanded") === "true",
});

/**
 * The selection tooltip, mounted only with `showTooltip`. It follows the
 * trigger's own attributes, so it is held shut while the listbox is open and
 * absent while the trigger is disabled, from the first commit on.
 */
function SelectionTooltip({
  trigger,
  content,
  onDescribedBy,
}: {
  trigger: HTMLElement;
  content: ReactNode;
  onDescribedBy: (id: string | undefined) => void;
}) {
  const [state, setState] = useState(() => readTrigger(trigger));
  useLayoutEffect(() => {
    const sync = () =>
      setState((prev) => {
        const next = readTrigger(trigger);
        return prev.isDisabled === next.isDisabled &&
          prev.isExpanded === next.isExpanded
          ? prev
          : next;
      });
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(trigger, { attributeFilter: ["aria-disabled", "aria-expanded"] });
    return () => observer.disconnect();
  }, [trigger]);
  const isEnabled = !state.isDisabled;
  const tooltip = useTooltip({
    isEnabled,
    isOpen: state.isExpanded ? false : undefined,
  });
  const attach = tooltip.ref;
  useLayoutEffect(
    () => (isEnabled ? attach(trigger) : undefined),
    [attach, trigger, isEnabled],
  );
  const { describedBy } = tooltip;
  useLayoutEffect(() => {
    onDescribedBy(isEnabled ? describedBy : undefined);
    return () => onDescribedBy(undefined);
  }, [onDescribedBy, describedBy, isEnabled]);
  return isEnabled ? tooltip.renderTooltip(content) : null;
}
