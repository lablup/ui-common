/**
 * SkeletonText Component
 *
 * Skeleton placeholder for text content.
 * Provides multiple lines with varying widths for natural appearance.
 *
 * @example
 * // Basic usage (3 lines)
 * <SkeletonText />
 *
 * @example
 * // Custom number of lines
 * <SkeletonText lines={5} />
 */

import { Skeleton } from "./Skeleton";
import "./SkeletonText.css";

export interface SkeletonTextProps {
  /** Number of text lines to display */
  lines?: number;
  /** Spacing between lines */
  spacing?: "compact" | "normal" | "relaxed";
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * SkeletonText provides a loading placeholder for text content.
 *
 * Features:
 * - Multiple lines with varying widths
 * - Configurable line spacing
 * - Accessible via aria-busy
 */
export function SkeletonText({
  lines = 3,
  spacing = "normal",
  className = "",
  testId,
}: SkeletonTextProps) {
  const classNames = ["skeleton-text", `skeleton-text--${spacing}`, className]
    .filter(Boolean)
    .join(" ");

  // Generate varying widths for natural appearance
  const widths = Array.from({ length: lines }, (_, i) => {
    if (i === lines - 1) {
      // Last line is shorter
      return "60%";
    }
    // Alternate between full and slightly shorter widths
    return i % 2 === 0 ? "100%" : "95%";
  });

  return (
    <div className={classNames} data-testid={testId} role="status" aria-busy="true">
      {widths.map((width, index) => (
        <Skeleton key={index} width={width} height="1em" variant="text" />
      ))}
    </div>
  );
}

export default SkeletonText;
