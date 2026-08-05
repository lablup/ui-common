/**
 * SkeletonCard Component
 *
 * Skeleton placeholder for card components (model cards, stat cards, etc.).
 * Mimics the structure of a typical card with header, content, and footer areas.
 *
 * @example
 * // Basic usage
 * <SkeletonCard />
 *
 * @example
 * // Compact variant
 * <SkeletonCard variant="compact" />
 */

import { Skeleton } from "./Skeleton";
import "./SkeletonCard.css";

export interface SkeletonCardProps {
  /** Card size variant */
  variant?: "default" | "compact" | "stat";
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * SkeletonCard provides a loading placeholder for card components.
 *
 * Variants:
 * - default: Full card with header, content, and footer
 * - compact: Smaller card with reduced padding
 * - stat: Statistics card layout
 */
export function SkeletonCard({
  variant = "default",
  className = "",
  testId,
}: SkeletonCardProps) {
  const classNames = ["skeleton-card", `skeleton-card--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} data-testid={testId} role="status" aria-busy="true">
      {variant === "stat" ? (
        <>
          <div className="skeleton-card__header">
            <Skeleton width="48px" height="48px" variant="circle" />
            <div className="skeleton-card__header-text">
              <Skeleton width="60%" height="16px" />
              <Skeleton width="40%" height="24px" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="skeleton-card__header">
            <Skeleton width="70%" height="20px" />
          </div>
          <div className="skeleton-card__content">
            <Skeleton width="100%" height="16px" />
            <Skeleton width="90%" height="16px" />
            <Skeleton width="80%" height="16px" />
          </div>
          {variant !== "compact" && (
            <div className="skeleton-card__footer">
              <Skeleton width="80px" height="32px" />
              <Skeleton width="80px" height="32px" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SkeletonCard;
