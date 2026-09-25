/**
 * StatCard
 *
 * Compact metric card for dashboards: a label, a large value with an optional
 * suffix, and optional icon, hint, trend, sparkline or accent tone. Built on
 * Astryx `Card` (or `ClickableCard` when it has an `onClick`), `Text` and
 * `Skeleton`. The label can be a node (`labelNode`) while the accessible name
 * stays the plain `label` string.
 */
import { memo, useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";

import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { DigitPopIn } from "../DigitPopIn";
import "./StatCard.css";

export type StatCardEmphasis = "compact" | "default" | "prominent";

export type StatCardTone = "default" | "success" | "warning" | "danger" | "info";

export type StatCardTrendDirection = "up" | "down" | "flat";

/**
 * How a numeric value arrives. `count` counts up from the previous value;
 * `digits` pops each character of the formatted value in, staggered, and
 * replays when the value changes.
 */
export type StatCardAnimation = "count" | "digits";

export interface StatCardTrend {
  /** Direction indicator (up / down / flat) */
  direction: StatCardTrendDirection;
  /** Human-readable delta label (e.g. "+12%", "-3", "0") */
  label: string;
  /** Optional ARIA description for screen readers */
  ariaLabel?: string;
}

export interface StatCardProps {
  /** Short label rendered above the value (uppercase) */
  label: string;
  /**
   * Rendered in place of `label` when the label is not plain text: a glossary
   * term carrying its definition, a unit badge, an info affordance.
   *
   * `label` stays required and stays the accessible name. Pass the same words
   * in both.
   */
  labelNode?: ReactNode;
  /** Primary metric value (a number is formatted with `toLocaleString`) */
  value: string | number;
  /** Optional suffix appended to the value (e.g. "/ 4", "GB") */
  valueSuffix?: string;
  /** Optional helper line under the value */
  hint?: ReactNode;
  /** Optional leading icon node, rendered inside an accent badge */
  icon?: ReactNode;
  /** Visual tone. Default: "default" */
  tone?: StatCardTone;
  /** Optional trend indicator under the value */
  trend?: StatCardTrend;
  /** Click handler. Renders the card as Astryx `ClickableCard`. */
  onClick?: () => void;
  /** Render skeletons instead of the value while loading */
  loading?: boolean;
  /** Optional aria label override (defaults to label + value) */
  ariaLabel?: string;
  /** Extra class name applied to the root */
  className?: string;
  /** Test id for unit tests */
  testId?: string;
  /**
   * Formatter for numeric values (e.g. abbreviate to "1.2K", append "%").
   * Defaults to `toLocaleString`. Ignored when `value` is a string.
   */
  format?: (value: number) => string;
  /**
   * Animate a numeric value on mount and on change. `true` or `"count"`
   * counts up to it; `"digits"` pops each character of the formatted value
   * in. Suppressed under `prefers-reduced-motion`, and ignored for string
   * values and while loading.
   */
  animate?: boolean | StatCardAnimation;
  /** Optional trailing visual on the value line (e.g. a sparkline) */
  sparkline?: ReactNode;
  /** Visual weight. Default: "default" */
  emphasis?: StatCardEmphasis;
}

const ANIMATION_DURATION_MS = 800;

/**
 * Counts from the previous value to `target` with an ease-out-cubic curve.
 * When `enabled` is false the target is returned directly and no animation
 * frame is ever scheduled.
 */
function useAnimatedValue(target: number, enabled: boolean): number {
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : target);
  const previousValue = useRef(enabled ? 0 : target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      previousValue.current = target;
      setDisplayValue(target);
      return;
    }

    const startValue = previousValue.current;
    const startTime = performance.now();

    const step = (now: number): void => {
      const progress = Math.min((now - startTime) / ANIMATION_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (target - startValue) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        previousValue.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, enabled]);

  return enabled ? displayValue : target;
}

const TREND_GLYPH: Record<StatCardTrendDirection, string> = {
  up: "▲",
  down: "▼",
  flat: "•",
};

/** Card padding per emphasis, on Astryx's spacing scale. */
const PADDING: Record<StatCardEmphasis, 2 | 4 | 6> = {
  compact: 2,
  default: 4,
  prominent: 6,
};

function formatValue(
  value: string | number,
  format?: (value: number) => string,
): string {
  if (typeof value === "number") {
    return format ? format(value) : value.toLocaleString();
  }
  return value;
}

function StatCardComponent({
  label,
  labelNode,
  value,
  valueSuffix,
  hint,
  icon,
  tone = "default",
  trend,
  onClick,
  loading = false,
  ariaLabel,
  className = "",
  testId,
  format,
  animate = false,
  sparkline,
  emphasis = "default",
}: StatCardProps): JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isNumeric = typeof value === "number";
  const animation: StatCardAnimation | null =
    animate === true ? "count" : animate === false ? null : animate;
  const canAnimate = isNumeric && !loading && !prefersReducedMotion;
  const shouldCount = animation === "count" && canAnimate;
  const shouldPopDigits = animation === "digits" && canAnimate;
  const animatedValue = useAnimatedValue(isNumeric ? value : 0, shouldCount);

  const displayValue = formatValue(
    isNumeric && shouldCount ? animatedValue : value,
    format,
  );
  const valueContent = shouldPopDigits ? (
    <DigitPopIn text={displayValue} />
  ) : (
    displayValue
  );
  const valueClass = shouldPopDigits
    ? "uic-stat-card__value uic-stat-card__value--digits"
    : "uic-stat-card__value";

  // The aria-label always describes the settled value, never an in-flight
  // animation frame, so assistive tech is not read a counting-up number.
  const composedAriaLabel =
    ariaLabel ??
    (loading ? label : `${label}: ${formatValue(value, format)}${valueSuffix ?? ""}`);

  const rootClass = [
    "uic-stat-card",
    `uic-stat-card--tone-${tone}`,
    emphasis !== "default" ? `uic-stat-card--${emphasis}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const valueRow = (
    <span className="uic-stat-card__value-row">
      <span className={valueClass}>{valueContent}</span>
      {valueSuffix && (
        <span className="uic-stat-card__value-suffix">{valueSuffix}</span>
      )}
    </span>
  );

  const body = (
    <>
      <div className="uic-stat-card__header">
        <Text type="label" className="uic-stat-card__label" color="secondary">
          {labelNode ?? label}
        </Text>
        {icon && (
          <span className="uic-stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className="uic-stat-card__body">
        {loading ? (
          <Skeleton width="60%" height="2rem" />
        ) : sparkline ? (
          // Only wrap when a sparkline is present, so cards without one keep
          // the value row as a direct child of the body.
          <span className="uic-stat-card__value-line">
            {valueRow}
            <span className="uic-stat-card__sparkline">{sparkline}</span>
          </span>
        ) : (
          valueRow
        )}

        {trend && !loading && (
          <span
            className={`uic-stat-card__trend uic-stat-card__trend--${trend.direction}`}
            aria-label={trend.ariaLabel ?? trend.label}
          >
            <span aria-hidden="true">{TREND_GLYPH[trend.direction]}</span>
            <span>{trend.label}</span>
          </span>
        )}
      </div>

      {hint !== undefined && hint !== null && (
        <div className="uic-stat-card__hint">
          {loading ? <Skeleton width="80%" height="0.85rem" index={1} /> : hint}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <ClickableCard
        label={composedAriaLabel}
        onClick={() => onClick()}
        padding={PADDING[emphasis]}
        className={rootClass}
        data-testid={testId}
      >
        {body}
      </ClickableCard>
    );
  }

  return (
    <Card
      padding={PADDING[emphasis]}
      className={rootClass}
      role="group"
      aria-label={composedAriaLabel}
      data-testid={testId}
    >
      {body}
    </Card>
  );
}

export const StatCard = memo(StatCardComponent);
