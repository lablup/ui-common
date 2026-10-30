/**
 * An option's disabled flag may carry why it is disabled:
 * `disabled: { reason }` (`isDisabled` on `PagedSelector`). The selector marks
 * the row with a glyph at its end, named by the reason, and hovering anywhere
 * on the row shows the reason in a tooltip; the row keeps its height. Shared by
 * `Selector`, `MultiSelector` and `PagedSelector`.
 */
import { useRef, type ReactNode } from "react";
import { Text } from "@astryxdesign/core/Text";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { CircleAlert } from "lucide-react";

import "./optionDisabledReason.css";

/** `true` disables the option; `{ reason }` disables it and says why. */
export type OptionDisabled = boolean | { reason: string };

export const optionDisabledReason = (
  disabled: OptionDisabled | null | undefined,
): string | undefined =>
  typeof disabled === "object" && disabled !== null && disabled.reason
    ? disabled.reason
    : undefined;

/** The row the glyph sits in; `row` is MultiSelector's, once an option has an action. */
const OPTION_ROW = '[role="option"], [role="row"]';

/**
 * The glyph named by the reason, and the tooltip of the row it sits in. The
 * selectors own the row's element, so the row is found from the glyph; the
 * tooltip goes beside the row, where it covers no other option. An option is an
 * action to Astryx's tooltip, which would keep it shut on a tap otherwise.
 */
export function OptionDisabledReason({ reason }: { reason: string }) {
  const rowRef = useRef<HTMLElement | null>(null);
  return (
    <>
      <span
        ref={(glyph) => {
          rowRef.current = glyph?.closest<HTMLElement>(OPTION_ROW) ?? glyph;
        }}
        role="img"
        aria-label={reason}
        className="uic-option-disabled-reason"
      >
        <Text color="placeholder" className="uic-option-disabled-reason__glyph">
          <CircleAlert size="1em" aria-hidden />
        </Text>
      </span>
      <Tooltip anchorRef={rowRef} content={reason} placement="end" touchTrigger="tap" />
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
 * own row) with the reason glyph at its end. Without a reason both are handed
 * back as given.
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
        <span className="uic-option-disabled-reason__row">
          <span className="uic-option-disabled-reason__content">{content}</span>
          <OptionDisabledReason reason={reason} />
        </span>
      ) : (
        content
      );
    },
  };
}
