/**
 * SkeletonText
 *
 * Loading placeholder for a block of text: `lines` lines, alternating full and
 * slightly short, with a shorter last line.
 *
 * @example
 * <SkeletonText />
 * <SkeletonText lines={5} spacing="compact" />
 */
import { useUicTranslator } from "../../i18n/useUicTranslator";
import { SkeletonShape } from "./SkeletonShape";
import "./SkeletonText.css";

export interface SkeletonTextProps {
  /** Number of text lines to display */
  lines?: number;
  /** Spacing between lines */
  spacing?: "compact" | "normal" | "relaxed";
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /**
   * Accessible name announced for the placeholder as a whole. Defaults to the
   * catalog's `uic.SkeletonText.loading` ("Loading").
   */
  loadingLabel?: string;
}

/** The width of line `i` of `lines`: the last is short, the rest alternate. */
function lineWidth(i: number, lines: number): string {
  if (i === lines - 1) return "60%";
  return i % 2 === 0 ? "100%" : "95%";
}

export function SkeletonText({
  lines = 3,
  spacing = "normal",
  className = "",
  testId,
  loadingLabel,
}: SkeletonTextProps) {
  const t = useUicTranslator();
  const classNames = ["uic-skeleton-text", `uic-skeleton-text--${spacing}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      data-testid={testId}
      role="status"
      aria-busy="true"
      aria-label={loadingLabel ?? t("uic.SkeletonText.loading")}
    >
      {Array.from({ length: Math.max(0, lines) }, (_, index) => (
        <SkeletonShape
          key={index}
          width={lineWidth(index, lines)}
          height="1em"
          shape="text"
          index={index}
        />
      ))}
    </div>
  );
}

export default SkeletonText;
