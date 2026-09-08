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
  /**
   * Render as decoration: `aria-hidden`, with no role, no `aria-busy` and no
   * label.
   *
   * For a shape inside a composite that announces the wait itself. `role="status"`
   * is an implicit polite live region, so a composite that fills its own region
   * with named primitives mounts one live region per shape and announces the
   * same wait once per shape.
   */
  decorative?: boolean;
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
  decorative = false,
}: SkeletonProps) {
  const classNames = ["skeleton", `skeleton--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  // A decorative shape is one of several inside a composite that already
  // announces the wait. It keeps its size and its shimmer and leaves the
  // accessibility tree, so a card built from seven of these is one live region
  // rather than seven.
  const announcement = decorative
    ? ({ "aria-hidden": true } as const)
    : ({
        role: "status",
        "aria-busy": true,
        "aria-label": loadingLabel,
      } as const);

  return (
    <div
      className={classNames}
      style={{ width, height }}
      {...announcement}
      data-testid={testId}
    >
      <span className="skeleton__shimmer" />
    </div>
  );
}

export default Skeleton;
