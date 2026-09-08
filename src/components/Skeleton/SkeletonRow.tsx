/**
 * SkeletonRow Component
 *
 * Skeleton placeholder for list rows and table rows.
 * Mimics the structure of a log entry or table row.
 *
 * @example
 * // Basic usage
 * <SkeletonRow />
 *
 * @example
 * // With avatar
 * <SkeletonRow showAvatar />
 */

import { Skeleton } from "./Skeleton";
import "./SkeletonRow.css";

export interface SkeletonRowProps {
  /** Show avatar/icon on the left */
  showAvatar?: boolean;
  /** Show action buttons on the right */
  showActions?: boolean;
  /** Number of rows to display */
  count?: number;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Accessible name announced for the placeholder as a whole. Defaults to "Loading". */
  loadingLabel?: string;
}

/**
 * SkeletonRow provides a loading placeholder for list/table rows.
 *
 * Features:
 * - Optional avatar/icon
 * - Optional action buttons
 * - Multiple rows for lists
 */
export function SkeletonRow({
  showAvatar = false,
  showActions = false,
  count = 1,
  className = "",
  testId,
  loadingLabel,
}: SkeletonRowProps) {
  const rows = Array.from({ length: count });

  return (
    <>
      {rows.map((_, index) => (
        <div
          key={index}
          className={`skeleton-row ${className}`}
          data-testid={testId ? `${testId}-${String(index)}` : undefined}
          role="status"
          aria-busy="true"
          aria-label={loadingLabel ?? "Loading"}
        >
          {showAvatar && (
            <div className="skeleton-row__avatar">
              <Skeleton decorative width="40px" height="40px" variant="circle" />
            </div>
          )}
          <div className="skeleton-row__content">
            <Skeleton decorative width="25%" height="14px" />
            <Skeleton decorative width="100%" height="16px" />
          </div>
          {showActions && (
            <div className="skeleton-row__actions">
              <Skeleton decorative width="32px" height="32px" />
              <Skeleton decorative width="32px" height="32px" />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default SkeletonRow;
