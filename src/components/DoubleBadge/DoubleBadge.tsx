/**
 * DoubleBadge
 *
 * A run of Badges welded into one chip: a live pair such as a status and its
 * detail, or a label and a ticker. Neighbours overlap by one border width and
 * square their inner corners, so the outlines read as one seam.
 *
 * A string value is a neutral Badge. Values with an empty label are skipped,
 * and an empty list renders nothing.
 *
 * @example
 * <DoubleBadge values={[{ label: "RUNNING", variant: "success" }, "2m"]} />
 */
import { Badge, type BadgeVariant } from "@astryxdesign/core/Badge";
import { HStack } from "@astryxdesign/core/Stack";

import "./DoubleBadge.css";

export interface DoubleBadgeValue {
  label: string;
  /** @default 'neutral' */
  variant?: BadgeVariant;
}

export interface DoubleBadgeProps {
  /** The badges, in order. */
  values?: Array<string> | Array<DoubleBadgeValue>;
}

export function DoubleBadge({ values = [] }: DoubleBadgeProps) {
  if (values.length === 0) return null;
  const objectValues = (values as Array<string | DoubleBadgeValue>).map(
    (value): DoubleBadgeValue =>
      typeof value === "string" ? { label: value, variant: "neutral" } : value,
  );

  return (
    <HStack gap={0} align="center" className="uic-double-badge">
      {objectValues.map((value, idx) =>
        value.label ? (
          <Badge
            key={idx}
            className="uic-double-badge__item"
            variant={value.variant ?? "neutral"}
            label={value.label}
          />
        ) : null,
      )}
    </HStack>
  );
}

DoubleBadge.displayName = "DoubleBadge";
