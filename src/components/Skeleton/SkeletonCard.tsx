/**
 * SkeletonCard
 *
 * Loading placeholder shaped like a card: a header line, three body lines and
 * two footer buttons. `compact` drops the footer; `stat` is an avatar beside
 * two lines, the shape of a `StatCard`.
 *
 * One live region: the container is `role="status"` with the name, and every
 * shape inside is Astryx's decorative `Skeleton`.
 *
 * @example
 * <SkeletonCard />
 * <SkeletonCard variant="compact" />
 */
import { useUicTranslator } from "../../i18n/useUicTranslator";
import { SkeletonShape } from "./SkeletonShape";
import "./SkeletonCard.css";

export interface SkeletonCardProps {
  /** Card size variant */
  variant?: "default" | "compact" | "stat";
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /**
   * Accessible name announced for the placeholder as a whole. Defaults to the
   * catalog's `uic.SkeletonCard.loading` ("Loading").
   */
  loadingLabel?: string;
}

export function SkeletonCard({
  variant = "default",
  className = "",
  testId,
  loadingLabel,
}: SkeletonCardProps) {
  const t = useUicTranslator();
  const classNames = ["uic-skeleton-card", `uic-skeleton-card--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      data-testid={testId}
      role="status"
      aria-busy="true"
      aria-label={loadingLabel ?? t("uic.SkeletonCard.loading")}
    >
      {variant === "stat" ? (
        <div className="uic-skeleton-card__header">
          <SkeletonShape width="3rem" height="3rem" shape="circle" />
          <div className="uic-skeleton-card__header-text">
            <SkeletonShape width="60%" height="1rem" index={1} />
            <SkeletonShape width="40%" height="1.5rem" index={2} />
          </div>
        </div>
      ) : (
        <>
          <div className="uic-skeleton-card__header">
            <SkeletonShape width="70%" height="1.25rem" />
          </div>
          <div className="uic-skeleton-card__content">
            <SkeletonShape width="100%" height="1rem" index={1} />
            <SkeletonShape width="90%" height="1rem" index={2} />
            <SkeletonShape width="80%" height="1rem" index={3} />
          </div>
          {variant !== "compact" && (
            <div className="uic-skeleton-card__footer">
              <SkeletonShape width="5rem" height="2rem" index={4} />
              <SkeletonShape width="5rem" height="2rem" index={5} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SkeletonCard;
