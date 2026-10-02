/**
 * ProgressWithLabel
 *
 * A bar that carries its own labels: `label` at the start and `valueLabel` at
 * the end, over a fill of `value` percent. For compact resource readouts in
 * table cells and cards ("CPU  3 / 8 cores"). A missing or NaN `value` draws
 * no fill and greys the value label.
 *
 * The fill is `color`, by default Astryx `--color-success`. The frame's
 * corner is `--progress-with-label-radius` (default `--radius-inner`).
 *
 * @example
 * <ProgressWithLabel label="CPU" valueLabel="3 / 8" value={37.5} width={160} />
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { Text } from "@astryxdesign/core/Text";

import "./ProgressWithLabel.css";

export interface ProgressWithLabelProps {
  /** Start label, usually what is measured. */
  label?: ReactNode;
  /** End label, usually the amount. */
  valueLabel?: ReactNode;
  /** Fill, in percent. Values above 100 fill the bar. */
  value?: number;
  /** Whether the end label shows. Its space stays reserved. Default: true */
  hasValueLabel?: boolean;
  /** Fill colour: any CSS colour or `var()`. */
  color?: string;
  /** Width of the bar. Without it the bar grows to fill its flex container. */
  width?: CSSProperties["width"];
  /** Label size. Default: "sm" */
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Inline style of the frame. */
  style?: CSSProperties;
  /** Inline style of both labels. */
  labelStyle?: CSSProperties;
}

export function ProgressWithLabel({
  label,
  valueLabel,
  value,
  hasValueLabel = true,
  color,
  width,
  size = "sm",
  className,
  style,
  labelStyle,
}: ProgressWithLabelProps): ReactElement {
  const isValueMissing = value === undefined || Number.isNaN(value);
  const fill = !value || Number.isNaN(value) ? 0 : Math.min(value, 100);
  const hasWidth = typeof width === "number" || typeof width === "string";

  return (
    <div
      className={[
        "uic-progress-with-label",
        `uic-progress-with-label--${size}`,
        !hasWidth && "uic-progress-with-label--grow",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...(hasWidth ? { width } : null),
        ...style,
      }}
    >
      <div
        className="uic-progress-with-label__fill"
        style={{ width: `${fill}%`, ...(color ? { backgroundColor: color } : null) }}
      />
      <div className="uic-progress-with-label__labels">
        <Text className="uic-progress-with-label__text" style={labelStyle}>
          {label}
        </Text>
        <Text
          className="uic-progress-with-label__text uic-progress-with-label__value"
          color={isValueMissing ? "disabled" : undefined}
          style={labelStyle}
        >
          {hasValueLabel ? valueLabel : " "}
        </Text>
      </div>
    </div>
  );
}

ProgressWithLabel.displayName = "ProgressWithLabel";
