/**
 * UnitGridSkeleton
 *
 * The loading stand-in for a UnitGrid and the toolbar above it: a row of
 * control-sized bars, a legend row, then two blocks per lattice row. The
 * lattice is drawn at low fidelity on purpose; mimicking plates and cells
 * would read as detail while nothing is loaded.
 *
 * @example
 * <Suspense fallback={<UnitGridSkeleton />}>...</Suspense>
 */
import type { HTMLAttributes } from "react";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Skeleton } from "@astryxdesign/core/Skeleton";

const DEFAULT_ROW_COUNT = 3;

/** The toolbar's control widths: per control, not a scale, so no token. */
const TOOLBAR_PILL_WIDTHS = [140, 180, 100] as const;
const TOOLBAR_PILL_HEIGHT = "var(--size-element-sm)";

const LEGEND_ITEM_COUNT = 5;
const LEGEND_SWATCH_SIZE = 10;
const LEGEND_LABEL_WIDTH = 40;
const LEGEND_LABEL_HEIGHT = 12;

/** Two blocks per row, widths varied so the rows read organic. */
const ROW_BLOCK_WIDTHS = [
  ["45%", "25%"],
  ["30%", "40%"],
  ["55%", "20%"],
] as const;
const ROW_BLOCK_HEIGHT = "var(--size-element-sm)";

export interface UnitGridSkeletonProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Lattice rows, two blocks each. @default 3 */
  rows?: number;
}

export function UnitGridSkeleton({
  rows = DEFAULT_ROW_COUNT,
  className,
  ...divProps
}: UnitGridSkeletonProps) {
  // One running index across every bar, so the shimmer reads as one wave.
  let waveIndex = 0;

  return (
    <VStack
      gap={3}
      align="stretch"
      className={["uic-unit-grid-skeleton", className].filter(Boolean).join(" ")}
      {...divProps}
    >
      <HStack gap={3} align="center">
        {TOOLBAR_PILL_WIDTHS.map((width, i) => (
          <Skeleton
            key={i}
            width={width}
            height={TOOLBAR_PILL_HEIGHT}
            radius={2}
            index={waveIndex++}
          />
        ))}
      </HStack>
      <HStack gap={3} wrap="wrap" align="center">
        {Array.from({ length: LEGEND_ITEM_COUNT }, (_unused, i) => (
          <HStack key={i} gap={1} align="center">
            <Skeleton
              width={LEGEND_SWATCH_SIZE}
              height={LEGEND_SWATCH_SIZE}
              radius={1}
              index={waveIndex++}
            />
            <Skeleton
              width={LEGEND_LABEL_WIDTH}
              height={LEGEND_LABEL_HEIGHT}
              radius={1}
              index={waveIndex++}
            />
          </HStack>
        ))}
      </HStack>
      {Array.from({ length: Math.max(0, rows) }, (_unused, rowIdx) => {
        const widths = ROW_BLOCK_WIDTHS[rowIdx % ROW_BLOCK_WIDTHS.length]!;
        return (
          <HStack
            key={rowIdx}
            gap={3}
            align="center"
            className="uic-unit-grid-skeleton__row"
          >
            {widths.map((width, blockIdx) => (
              <Skeleton
                key={blockIdx}
                width={width}
                height={ROW_BLOCK_HEIGHT}
                radius={1}
                index={waveIndex++}
              />
            ))}
          </HStack>
        );
      })}
    </VStack>
  );
}

UnitGridSkeleton.displayName = "UnitGridSkeleton";
