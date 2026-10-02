/**
 * Statistic
 *
 * A dashboard metric: a caption, a large value with its unit, and an optional
 * segmented usage bar of `value` against `total`. The bar is a strip of
 * notches, so 3 of 20 reads differently from 4 of 20 at a glance; it carries
 * `role="progressbar"` and shows "value / total" in a tooltip.
 *
 * A value that is not finite shows `unlimitedLabel` instead of a number.
 *
 * @example
 * <Statistic label="Memory" value={12} total={64} unit="GiB" progressMode="visible" />
 */
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Tooltip } from "@astryxdesign/core/Tooltip";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import "./Statistic.css";

export interface StatisticProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  /** The caption. */
  label: ReactNode;
  /** The value. Not finite renders `unlimitedLabel`. */
  value?: number;
  /** What the value is measured against; the bar needs it. */
  total?: number;
  /** Unit after the value. */
  unit?: string;
  /** Decimal places, trailing zeros dropped. @default 2 */
  precision?: number;
  /** A non-finite value or total in the bar's tooltip. @default '∞' */
  infinityLabel?: string;
  /**
   * The usage bar: `visible` draws it (with a `total`), `placeholder` keeps
   * its space without painting it, `hidden` leaves it out. @default 'hidden'
   */
  progressMode?: "hidden" | "placeholder" | "visible";
  /** Notches in the bar. @default 20 */
  progressSteps?: number;
  /** Colour of the value and of the bar's filled notches. */
  color?: string;
  /** Shown for a non-finite value. @default the catalog's uic.Statistic.unlimited ("Unlimited") */
  unlimitedLabel?: string;
}

function StepBar({
  steps,
  percent,
  isPlaceholder,
  color,
  label,
}: {
  steps: number;
  percent: number;
  isPlaceholder?: boolean;
  color?: string;
  label: string;
}) {
  const filled = Math.round((percent / 100) * steps);
  return (
    <div
      className="uic-statistic__steps"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: steps }, (_, index) => (
        <span
          key={index}
          className={
            isPlaceholder
              ? "uic-statistic__step uic-statistic__step--placeholder"
              : index < filled
                ? "uic-statistic__step uic-statistic__step--filled"
                : "uic-statistic__step"
          }
          style={
            isPlaceholder || index >= filled ? undefined : { backgroundColor: color }
          }
        />
      ))}
    </div>
  );
}

export function Statistic({
  label,
  value,
  total,
  unit = "",
  precision = 2,
  infinityLabel = "∞",
  progressMode = "hidden",
  progressSteps = 20,
  color,
  unlimitedLabel,
  className,
  ...divProps
}: StatisticProps) {
  const t = useUicTranslator();
  const format = (n: number) =>
    Number.isFinite(n) ? parseFloat(n.toFixed(precision)).toString() : infinityLabel;

  const displayValue = value === undefined ? undefined : format(value);
  const displayTotal = total === undefined ? undefined : format(total);

  const percent = (() => {
    if (progressMode === "hidden" || total === undefined || total === Infinity)
      return 0;
    // Nothing allocated out of a zero quota is empty; anything else against
    // it, a non-finite value included, is full.
    if (total === 0) return value === 0 ? 0 : 100;
    if (value === undefined || !Number.isFinite(value) || !Number.isFinite(total))
      return 100;
    return Math.round((value / total) * 100);
  })();
  const accessibleLabel = typeof label === "string" ? label : "usage";
  const colorStyle: CSSProperties | undefined = color ? { color } : undefined;

  return (
    <VStack
      align="start"
      className={["uic-statistic", className].filter(Boolean).join(" ")}
      {...divProps}
    >
      <Text
        size="lg"
        color="secondary"
        display="block"
        className="uic-statistic__label"
      >
        {label}
      </Text>
      <HStack gap={1} align="end" className="uic-statistic__row">
        {value !== undefined && !Number.isFinite(value) ? (
          <Text className="uic-statistic__value">
            {unlimitedLabel ?? t("uic.Statistic.unlimited")}
          </Text>
        ) : (
          <>
            <Text className="uic-statistic__value" style={colorStyle}>
              {displayValue}
            </Text>
            {unit && <Text color="secondary">{unit}</Text>}
          </>
        )}
      </HStack>
      {progressMode === "visible" && total !== undefined ? (
        <Tooltip content={`${displayValue} ${unit} / ${displayTotal} ${unit}`}>
          <StepBar
            steps={progressSteps}
            percent={percent}
            color={color}
            label={accessibleLabel}
          />
        </Tooltip>
      ) : progressMode === "placeholder" ? (
        <StepBar
          isPlaceholder
          steps={progressSteps}
          percent={0}
          label={accessibleLabel}
        />
      ) : null}
    </VStack>
  );
}

Statistic.displayName = "Statistic";
