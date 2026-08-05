/**
 * ProgressBar Component
 *
 * A reusable progress bar component that supports both determinate and
 * indeterminate states, with multiple color variants and sizes.
 *
 * @example
 * ```tsx
 * // Determinate progress
 * <ProgressBar value={75} />
 *
 * // Indeterminate (loading state)
 * <ProgressBar value={null} />
 *
 * // With variant and label
 * <ProgressBar value={100} variant="success" showLabel />
 * ```
 */

import "./ProgressBar.css";

export type ProgressBarVariant = "primary" | "success" | "error" | "warning";
export type ProgressBarSize = "sm" | "md" | "lg";

export interface ProgressBarProps {
  /** Progress value (0-100). Pass null for indeterminate state. */
  value: number | null;
  /** Color variant */
  variant?: ProgressBarVariant;
  /** Size of the progress bar */
  size?: ProgressBarSize;
  /** Whether to show percentage label */
  showLabel?: boolean;
  /** Custom label text (overrides percentage) */
  label?: string;
  /** Additional CSS class names */
  className?: string;
  /** Whether to animate the progress fill transition */
  animated?: boolean;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

export function ProgressBar({
  value,
  variant = "primary",
  size = "md",
  showLabel = false,
  label,
  className = "",
  animated = true,
  ariaLabel,
}: ProgressBarProps) {
  const isIndeterminate = value === null;
  const clampedValue = value === null ? 0 : Math.max(0, Math.min(100, value));

  const containerClasses = [
    "progress-bar",
    `progress-bar--${variant}`,
    `progress-bar--${size}`,
    isIndeterminate ? "progress-bar--indeterminate" : "",
    animated ? "progress-bar--animated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const displayLabel =
    label ?? (showLabel && !isIndeterminate ? `${clampedValue.toFixed(0)}%` : null);

  return (
    <div className="progress-bar-wrapper">
      <div
        className={containerClasses}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        aria-busy={isIndeterminate}
      >
        <div
          className="progress-bar__fill"
          style={isIndeterminate ? undefined : { width: `${String(clampedValue)}%` }}
        />
      </div>
      {displayLabel && <span className="progress-bar__label">{displayLabel}</span>}
    </div>
  );
}

export default ProgressBar;
