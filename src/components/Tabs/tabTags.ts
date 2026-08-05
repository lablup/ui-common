/**
 * Tag label types and badge-variant configuration for the Tabs component.
 *
 * Used to display guide badge labels (Beta, Experimental, Required, Recommended)
 * next to tab labels. The label text itself is supplied by the consumer via
 * `Tabs`' `tagLabels` prop (see `TabTagLabels`) — this module only carries the
 * presentation mapping from tag type to badge variant.
 */

import type { BadgeProps } from "../Badge";

/** Guide tag types — displayed as a small badge after the label */
export type TabTagType = "required" | "recommended" | "beta" | "experimental";

/** English default label for every {@link TabTagType}. */
export type TabTagLabels = Record<TabTagType, string>;

/** Mapping of tag type to badge variant */
export const TAG_CONFIG: Record<TabTagType, { variant: BadgeProps["variant"] }> = {
  required: { variant: "warning" },
  recommended: { variant: "primary" },
  beta: { variant: "info" },
  experimental: { variant: "warning" },
};
