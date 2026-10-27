/**
 * An option's disabled flag may carry why it is disabled:
 * `disabled: { reason }` (`isDisabled` on `PagedSelector`). The selector draws
 * a glyph at the end of the row whose tooltip is the reason; the row keeps its
 * height. Shared by `Selector`, `MultiSelector` and `PagedSelector`.
 */
import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

import { IconWithTooltip } from "../components/IconWithTooltip/IconWithTooltip";
import "./optionDisabledReason.css";

/** `true` disables the option; `{ reason }` disables it and says why. */
export type OptionDisabled = boolean | { reason: string };

export const optionDisabledReason = (
  disabled: OptionDisabled | null | undefined,
): string | undefined =>
  typeof disabled === "object" && disabled !== null && disabled.reason
    ? disabled.reason
    : undefined;

/** The glyph whose tooltip, and accessible name, is the reason. */
export function OptionDisabledReason({ reason }: { reason: string }) {
  return (
    <span className="uic-option-disabled-reason">
      <IconWithTooltip
        content={reason}
        focusable={false}
        icon={<CircleAlert size="1em" aria-hidden />}
      />
    </span>
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
