/**
 * `MultiSelector` for `Form.Item`: Astryx's MultiSelector without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 *
 * An option's `disabled` also takes `{ reason }`: the option is disabled and
 * hovering its row says why (../optionDisabledReason.tsx).
 *
 * `showSelectedOptionsTooltip` lists the selected labels in a tooltip on the trigger, or
 * renders the caller's `content` for the selection.
 */
import { useState, type ReactNode } from "react";
import {
  MultiSelector as AstryxMultiSelector,
  type MultiSelectorDivider,
  type MultiSelectorOptionData as AstryxMultiSelectorOptionData,
  type MultiSelectorOptionType as AstryxMultiSelectorOptionType,
  type MultiSelectorProps as AstryxMultiSelectorProps,
  type MultiSelectorSection as AstryxMultiSelectorSection,
  type MultiSelectorSelectedItem,
} from "@astryxdesign/core/MultiSelector";
import { useMergedRefs } from "@astryxdesign/core/hooks";
import type { SelectorOptionType } from "@astryxdesign/core/Selector";
import { getSelectableOptions } from "@astryxdesign/core/Selector/utils";

import { TriggerTooltip } from "../triggerTooltip";
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
     * A tooltip on the trigger, held shut while the listbox is open. None
     * while nothing is selected, while disabled, or with `renderTrigger`.
     * `true` lists every selected option's label, comma-separated; `{ content }`
     * renders `content(items)` instead, with the selection as `formatValue`
     * receives it.
     * @default false
     */
    showSelectedOptionsTooltip?:
      | boolean
      | {
          /** The selected items, in selection order, as `formatValue` receives them. */
          content: (items: MultiSelectorSelectedItem[]) => ReactNode;
        };
  };

type TooltipOption = Exclude<
  NonNullable<MultiSelectorProps["showSelectedOptionsTooltip"]>,
  false
>;

/** The selected items, in selection order; a value with no option stands for itself. */
function selectedItems(
  options: readonly MultiSelectorOptionType[],
  values: string[],
): MultiSelectorSelectedItem[] {
  // Astryx builds formatValue's items the same way, so the two never disagree.
  const selectable = getSelectableOptions(options as SelectorOptionType[]);
  return values.map((value) => ({
    value,
    label: selectable.find((item) => item.value === value)?.label ?? value,
  }));
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
  showSelectedOptionsTooltip = false,
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
  // Only with showSelectedOptionsTooltip: the trigger element (state, so the tooltip follows a
  // replaced element) and the tooltip's id, which SelectionTooltip reports.
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [tooltipId, setTooltipId] = useState<string>();
  const triggerRefs = useMergedRefs<HTMLElement>(ref, setTrigger);
  const hasTooltip =
    !!showSelectedOptionsTooltip &&
    !!mergedValue?.length &&
    !field.isDisabled &&
    !rest.renderTrigger;
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
    ref: showSelectedOptionsTooltip ? triggerRefs : ref,
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
      {hasTooltip && showSelectedOptionsTooltip && trigger ? (
        <TriggerTooltip
          trigger={trigger}
          renderContent={() =>
            tooltipContent(
              showSelectedOptionsTooltip,
              selectedItems(options, mergedValue ?? []),
            )
          }
          onDescribedBy={setTooltipId}
        />
      ) : null}
    </FormControlScope>
  );
}

function tooltipContent(
  showSelectedOptionsTooltip: TooltipOption,
  items: MultiSelectorSelectedItem[],
): ReactNode {
  if (showSelectedOptionsTooltip === true)
    return items.map((item) => item.label).join(", ");
  return showSelectedOptionsTooltip.content(items);
}
