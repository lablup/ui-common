/**
 * An option's disabled flag may carry why it is disabled:
 * `disabled: { reason }` (`isDisabled` on `PagedSelector`). Hovering anywhere
 * on the row shows the reason in a tooltip, and the reason is part of the
 * option's accessible name; the row looks and measures like any disabled row.
 * Shared by `Selector`, `MultiSelector` and `PagedSelector`.
 */
import { useRef, type ReactNode } from "react";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";

import "./optionDisabledReason.css";

/** `true` disables the option; `{ reason }` disables it and says why. */
export type OptionDisabled = boolean | { reason: string };

export const optionDisabledReason = (
  disabled: OptionDisabled | null | undefined,
): string | undefined =>
  typeof disabled === "object" && disabled !== null && disabled.reason
    ? disabled.reason
    : undefined;

/** The row the reason sits in; `row` is MultiSelector's, once an option has an action. */
const OPTION_ROW = '[role="option"], [role="row"]';

/**
 * The reason, hidden but read with the option, and the tooltip of the row it
 * sits in. The selectors own the row's element, so the row is found from the
 * hidden text. An option is an action to Astryx's tooltip, which would keep it
 * shut on a tap otherwise.
 */
export function OptionDisabledReason({ reason }: { reason: string }) {
  const rowRef = useRef<HTMLElement | null>(null);
  return (
    <>
      <VisuallyHidden
        ref={(hidden) => {
          rowRef.current = hidden?.closest<HTMLElement>(OPTION_ROW) ?? hidden;
        }}
      >
        {reason}
      </VisuallyHidden>
      <Tooltip anchorRef={rowRef} content={reason} touchTrigger="tap" />
    </>
  );
}

type OptionLike = { value: string; disabled?: OptionDisabled };
type SectionLike<O> = { type: "section"; options: O[] };
type AstryxOption = { value: string; disabled?: boolean };

/**
 * Astryx's `options` and `renderOption` for options whose `disabled` may be
 * `{ reason }`: every reason becomes a boolean `disabled`, and when any option
 * had one, `renderOption` draws the caller's row (or `renderDefault`, Astryx's
 * own row) with its reason. Without a reason both are handed back as given.
 */
export function withOptionDisabledReason<O, D extends AstryxOption>({
  options,
  renderOption,
  renderDefault,
}: {
  options: readonly O[];
  renderOption?: (option: D) => ReactNode;
  renderDefault: (option: D) => ReactNode;
}): { options: O[]; renderOption?: (option: D) => ReactNode } {
  const reasons = new Map<string, string>();
  const strip = (option: OptionLike): OptionLike => {
    if (typeof option.disabled !== "object") return option;
    const reason = optionDisabledReason(option.disabled);
    if (reason !== undefined) reasons.set(option.value, reason);
    return { ...option, disabled: !!option.disabled };
  };
  const stripped = options.map((option) => {
    if (typeof option !== "object" || option === null) return option;
    if ("type" in option) {
      const section = option as unknown as SectionLike<OptionLike>;
      return section.type === "section"
        ? ({ ...section, options: section.options.map(strip) } as unknown as O)
        : option;
    }
    return strip(option as unknown as OptionLike) as unknown as O;
  });
  if (reasons.size === 0) return { options: stripped, renderOption };
  return {
    options: stripped,
    renderOption: (option) => {
      const content = renderOption ? renderOption(option) : renderDefault(option);
      const reason = reasons.get(option.value);
      return reason ? (
        <>
          {content}
          <OptionDisabledReason reason={reason} />
        </>
      ) : (
        content
      );
    },
  };
}
