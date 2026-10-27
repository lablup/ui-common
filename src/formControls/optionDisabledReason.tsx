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

/** `content` with the reason glyph at its end, or `content` itself without a reason. */
export function withOptionDisabledReason(
  content: ReactNode,
  reason: string | undefined,
): ReactNode {
  if (!reason) return content;
  return (
    <span className="uic-option-disabled-reason__row">
      <span className="uic-option-disabled-reason__content">{content}</span>
      <OptionDisabledReason reason={reason} />
    </span>
  );
}

type OptionLike = { value: string; disabled?: OptionDisabled };
type SectionLike<O> = { type: "section"; options: O[] };

/**
 * Astryx's options with every `disabled: { reason }` turned back into `true`,
 * and the reasons by option value. `undefined` reasons when no option has one,
 * so a caller can leave `renderOption` alone.
 */
export function splitOptionDisabledReasons<O>(options: readonly O[]): {
  options: O[];
  reasons: Map<string, string> | undefined;
} {
  const reasons = new Map<string, string>();
  const strip = (option: OptionLike): OptionLike => {
    const reason = optionDisabledReason(option.disabled);
    if (reason === undefined && typeof option.disabled !== "object") {
      return option;
    }
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
  return { options: stripped, reasons: reasons.size ? reasons : undefined };
}
