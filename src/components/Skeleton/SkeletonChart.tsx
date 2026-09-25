/**
 * SkeletonChart
 *
 * Loading placeholder for a chart: eight bars, a pie with a four-item legend,
 * or one block for line and area charts.
 *
 * @example
 * <SkeletonChart variant="bar" />
 * <SkeletonChart variant="pie" height="20rem" />
 */
import { useUicTranslator } from "../../i18n/useUicTranslator";
import { SkeletonShape } from "./SkeletonShape";
import "./SkeletonChart.css";

export interface SkeletonChartProps {
  /** Chart type variant */
  variant?: "bar" | "line" | "pie" | "area";
  /** Chart height, any CSS length. Default: "300px" */
  height?: string;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /**
   * Accessible label announced while the chart is loading. Defaults to the
   * catalog's `uic.SkeletonChart.loading` ("Loading chart").
   */
  loadingLabel?: string;
}

const BAR_HEIGHTS = [60, 80, 45, 90, 70, 55, 85, 65];

export function SkeletonChart({
  variant = "bar",
  height = "300px",
  className = "",
  testId,
  loadingLabel,
}: SkeletonChartProps) {
  const t = useUicTranslator();
  const classNames = ["uic-skeleton-chart", `uic-skeleton-chart--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{ height }}
      data-testid={testId}
      role="status"
      aria-busy="true"
      aria-label={loadingLabel ?? t("uic.SkeletonChart.loading")}
    >
      {variant === "pie" ? (
        <div className="uic-skeleton-chart__pie">
          <SkeletonShape
            width="100%"
            height="100%"
            shape="circle"
            className="uic-skeleton-chart__pie-disc"
          />
          <div className="uic-skeleton-chart__legend">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="uic-skeleton-chart__legend-item">
                <SkeletonShape width="1rem" height="1rem" shape="circle" index={i} />
                <SkeletonShape width="5rem" height="0.875rem" index={i} />
              </div>
            ))}
          </div>
        </div>
      ) : variant === "bar" ? (
        <div className="uic-skeleton-chart__bars">
          {BAR_HEIGHTS.map((barHeight, i) => (
            <SkeletonShape
              key={i}
              width="100%"
              height={`${String(barHeight)}%`}
              index={i}
              className="uic-skeleton-chart__bar"
            />
          ))}
        </div>
      ) : (
        <div className="uic-skeleton-chart__line">
          <SkeletonShape width="100%" height="100%" />
        </div>
      )}
    </div>
  );
}

export default SkeletonChart;
