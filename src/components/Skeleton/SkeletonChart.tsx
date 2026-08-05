/**
 * SkeletonChart Component
 *
 * Skeleton placeholder for chart components.
 * Shows a simplified chart-like shape with bars or circular elements.
 *
 * @example
 * // Bar chart skeleton
 * <SkeletonChart variant="bar" />
 *
 * @example
 * // Pie chart skeleton
 * <SkeletonChart variant="pie" />
 */

import { Skeleton } from "./Skeleton";
import "./SkeletonChart.css";

export interface SkeletonChartProps {
  /** Chart type variant */
  variant?: "bar" | "line" | "pie" | "area";
  /** Chart height */
  height?: string;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Accessible label announced while the chart is loading. Default: "Loading chart" */
  loadingLabel?: string;
}

/**
 * SkeletonChart provides a loading placeholder for chart components.
 *
 * Variants:
 * - bar: Vertical bars of varying heights
 * - line: Line graph placeholder
 * - pie: Circular chart placeholder
 * - area: Area chart placeholder
 */
export function SkeletonChart({
  variant = "bar",
  height = "300px",
  className = "",
  testId,
  loadingLabel = "Loading chart",
}: SkeletonChartProps) {
  const classNames = ["skeleton-chart", `skeleton-chart--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{ height }}
      data-testid={testId}
      role="status"
      aria-busy="true"
      aria-label={loadingLabel}
    >
      {variant === "pie" ? (
        <div className="skeleton-chart__pie">
          <Skeleton width="100%" height="100%" variant="circle" />
          <div className="skeleton-chart__legend">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-chart__legend-item">
                <Skeleton width="16px" height="16px" variant="circle" />
                <Skeleton width="80px" height="14px" />
              </div>
            ))}
          </div>
        </div>
      ) : variant === "bar" ? (
        <div className="skeleton-chart__bars">
          {[60, 80, 45, 90, 70, 55, 85, 65].map((barHeight, i) => (
            <Skeleton
              key={i}
              width="100%"
              height={`${String(barHeight)}%`}
              className="skeleton-chart__bar"
            />
          ))}
        </div>
      ) : (
        <div className="skeleton-chart__line">
          <Skeleton width="100%" height="100%" />
        </div>
      )}
    </div>
  );
}

export default SkeletonChart;
