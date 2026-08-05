/**
 * Skeleton Component
 *
 * Base skeleton component for loading states.
 * Provides a shimmer animation effect that respects prefers-reduced-motion.
 *
 * @example
 * // Basic usage
 * <Skeleton width="100%" height="20px" />
 *
 * @example
 * // Circle skeleton
 * <Skeleton width="40px" height="40px" variant="circle" />
 */

import "./Skeleton.css";

export interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string;
  /** Height of the skeleton (CSS value) */
  height?: string;
  /** Visual variant */
  variant?: "rect" | "circle" | "text";
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Accessible label announced while the skeleton is visible. Default: "Loading" */
  loadingLabel?: string;
}

/**
 * Skeleton provides a loading placeholder with shimmer animation.
 *
 * Features:
 * - Shimmer effect using CSS animation
 * - Reduced motion preference support
 * - Multiple shape variants
 * - Accessible via aria-busy and aria-label
 */
export function Skeleton({
  width = "100%",
  height = "20px",
  variant = "rect",
  className = "",
  testId,
  loadingLabel = "Loading",
}: SkeletonProps) {
  const classNames = ["skeleton", `skeleton--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{ width, height }}
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
      data-testid={testId}
    >
      <span className="skeleton__shimmer" />
    </div>
  );
}

export default Skeleton;
