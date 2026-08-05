/**
 * StatCard Component
 *
 * Compact metric card for dashboards. Renders a label, a large numeric
 * value (with optional unit/suffix), and optional icon, hint, trend, or
 * accent tone. Wraps `BaseCard` so it inherits hover/focus/click affordances
 * and design tokens consistently with the rest of the common library.
 *
 * Designed for cross-page reuse: Squad dashboard, Statistics page, Cowork
 * dashboard, etc.
 */

import { memo, useEffect, useRef, useState, type ReactNode, type JSX } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { BaseCard } from "../BaseCard";
import { Skeleton } from "../Skeleton";
import "./StatCard.css";

export type StatCardEmphasis = "compact" | "default" | "prominent";

export type StatCardTone = "default" | "success" | "warning" | "danger" | "info";

export type StatCardTrendDirection = "up" | "down" | "flat";

export interface StatCardTrend {
  /** Direction indicator (up / down / flat) */
  direction: StatCardTrendDirection;
  /** Human-readable delta label (e.g. "+12%", "-3", "0") */
  label: string;
  /** Optional ARIA description for screen readers */
  ariaLabel?: string;
}

export interface StatCardProps {
  /** Short label rendered above the value (UPPERCASE styled) */
  label: string;
  /** Primary metric value (number is coerced to localised string) */
  value: string | number;
  /** Optional suffix appended to the value (e.g. "/ 4", "GB") */
  valueSuffix?: string;
  /** Optional helper line under the value (e.g. context, secondary metric) */
  hint?: ReactNode;
  /** Optional leading icon node, rendered inside an accent badge */
  icon?: ReactNode;
  /** Visual tone, mirrors Badge variants. Default: "default" */
  tone?: StatCardTone;
  /** Optional trend indicator under the value */
  trend?: StatCardTrend;
  /** Click handler. Renders the card as keyboard-accessible button. */
  onClick?: () => void;
  /** Render skeletons instead of value/label content while loading */
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
   * Count up to a numeric value on mount and on change. Off by default so
   * existing consumers render the final value immediately; opt in for
   * dashboard hero metrics. Suppressed under `prefers-reduced-motion`.
   */
  animate?: boolean;
  /**
   * Optional trailing visual on the value line (e.g. a sparkline). Kept as a
   * slot so the card does not depend on any particular chart component.
   */
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
  const shouldAnimate = animate && isNumeric && !loading && !prefersReducedMotion;
  const animatedValue = useAnimatedValue(isNumeric ? value : 0, shouldAnimate);

  const displayValue = formatValue(
    isNumeric && shouldAnimate ? animatedValue : value,
    format,
  );

  // The aria-label always describes the settled value, never an in-flight
  // animation frame, so assistive tech is not read a counting-up number.
  const composedAriaLabel =
    ariaLabel ??
    (loading ? label : `${label}: ${formatValue(value, format)}${valueSuffix ?? ""}`);

  const rootClass = [
    "stat-card",
    "corner-accent",
    `stat-card--tone-${tone}`,
    emphasis !== "default" ? `stat-card--${emphasis}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseCard
      className={rootClass}
      onClick={onClick}
      role={onClick ? undefined : "group"}
      ariaLabel={composedAriaLabel}
      testId={testId}
    >
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {icon && (
          <span className="stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className="stat-card__body">
        {loading ? (
          <Skeleton width="60%" height="2rem" />
        ) : sparkline ? (
          // Only wrap when a sparkline is present, so cards without one keep
          // the exact DOM they had before the slot existed.
          <span className="stat-card__value-line">
            <span className="stat-card__value-row">
              <span className="stat-card__value">{displayValue}</span>
              {valueSuffix && (
                <span className="stat-card__value-suffix">{valueSuffix}</span>
              )}
            </span>
            <span className="stat-card__sparkline">{sparkline}</span>
          </span>
        ) : (
          <span className="stat-card__value-row">
            <span className="stat-card__value">{displayValue}</span>
            {valueSuffix && (
              <span className="stat-card__value-suffix">{valueSuffix}</span>
            )}
          </span>
        )}

        {trend && !loading && (
          <span
            className={`stat-card__trend stat-card__trend--${trend.direction}`}
            aria-label={trend.ariaLabel ?? trend.label}
          >
            <span aria-hidden="true">{TREND_GLYPH[trend.direction]}</span>
            <span>{trend.label}</span>
          </span>
        )}
      </div>

      {hint !== undefined && hint !== null && (
        <div className="stat-card__hint">
          {loading ? <Skeleton width="80%" height="0.85rem" /> : hint}
        </div>
      )}
    </BaseCard>
  );
}

export const StatCard = memo(StatCardComponent);
