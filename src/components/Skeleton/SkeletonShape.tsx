/**
 * One placeholder shape inside a Skeleton composite. Internal: not exported.
 *
 * A thin layer over Astryx `Skeleton`, which is already decorative
 * (`aria-hidden`), so a composite stays one live region however many shapes
 * it draws. The composite's container carries `role="status"` and the name.
 */
import { Skeleton } from "@astryxdesign/core/Skeleton";

import "./SkeletonShape.css";

export type SkeletonShapeKind = "rect" | "circle" | "text";

export interface SkeletonShapeProps {
  width: string;
  height: string;
  shape?: SkeletonShapeKind;
  /** Position in the composite, for Astryx's staggered pulse. */
  index?: number;
  className?: string;
}

export function SkeletonShape({
  width,
  height,
  shape = "rect",
  index = 0,
  className,
}: SkeletonShapeProps) {
  const classes = ["uic-skeleton-shape", `uic-skeleton-shape--${shape}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <Skeleton
      width={width}
      height={height}
      radius={shape === "circle" ? "rounded" : 1}
      index={index}
      className={classes}
    />
  );
}
