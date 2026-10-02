/**
 * SkeletonRow
 *
 * Loading placeholder for list and table rows: an optional avatar, two lines,
 * and optional action buttons. `count` renders that many rows as a fragment,
 * so they stay direct children of the caller's list; each row is its own
 * placeholder and its own live region.
 *
 * @example
 * <SkeletonRow count={5} showAvatar />
 */
import { useUicTranslator } from "../../i18n/useUicTranslator";
import { SkeletonShape } from "./SkeletonShape";
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
  /** Test ID for testing; each row gets `<testId>-<index>` */
  testId?: string;
  /**
   * Accessible name announced for each row. Defaults to the catalog's
   * `uic.SkeletonRow.loading` ("Loading").
   */
  loadingLabel?: string;
}

export function SkeletonRow({
  showAvatar = false,
  showActions = false,
  count = 1,
  className = "",
  testId,
  loadingLabel,
}: SkeletonRowProps) {
  const t = useUicTranslator();
  const label = loadingLabel ?? t("uic.SkeletonRow.loading");
  const classNames = ["uic-skeleton-row", className].filter(Boolean).join(" ");

  return (
    <>
      {Array.from({ length: Math.max(0, count) }, (_, index) => (
        <div
          key={index}
          className={classNames}
          data-testid={testId ? `${testId}-${String(index)}` : undefined}
          role="status"
          aria-busy="true"
          aria-label={label}
        >
          {showAvatar && (
            <div className="uic-skeleton-row__avatar">
              <SkeletonShape width="2.5rem" height="2.5rem" shape="circle" />
            </div>
          )}
          <div className="uic-skeleton-row__content">
            <SkeletonShape width="25%" height="0.875rem" index={1} />
            <SkeletonShape width="100%" height="1rem" index={2} />
          </div>
          {showActions && (
            <div className="uic-skeleton-row__actions">
              <SkeletonShape width="2rem" height="2rem" index={3} />
              <SkeletonShape width="2rem" height="2rem" index={4} />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default SkeletonRow;
