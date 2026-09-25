/**
 * CountBadge
 *
 * A count or a dot overlaid on the corner of its child: unread notices on a
 * bell, a problem count on a tab. Astryx `Badge` is an inline pill with no
 * anchored form, so this positions one over the child's top-end corner.
 *
 * - `count` above `max` renders as `${max}+`.
 * - A zero or missing count renders nothing, unless `isZeroShown`.
 * - `hasDot` renders a bare dot instead of a number.
 * - The overlay is a `role="status"` live region; `label` names it, since a
 *   dot has no text and a bare number rarely says what it counts.
 *
 * `className` and `style` go on the wrapper around the child, so a consumer
 * can scope a rule at the overlay. Every other prop goes to the `Badge`.
 *
 * @example
 * <CountBadge count={unread} variant="error" label={`${unread} unread`}>
 *   <IconButton icon={<Bell />} label="Notifications" />
 * </CountBadge>
 */
import type { CSSProperties, ReactNode } from "react";
import { Badge, type BadgeProps } from "@astryxdesign/core/Badge";

import "./CountBadge.css";

export interface CountBadgeProps extends Omit<BadgeProps, "label" | "icon"> {
  /** The number, or node, shown in the overlay. */
  count?: number | ReactNode;
  /** Render a bare dot instead of the count. @default false */
  hasDot?: boolean;
  /** A numeric count above this renders as `${max}+`. @default 99 */
  max?: number;
  /** Keep the overlay when `count` is 0. @default false */
  isZeroShown?: boolean;
  /** `[x, y]` pixel nudge of the overlay: +x moves it right, +y down. */
  offset?: [number, number];
  /** `sm` is a denser pill for tab rails and table headers. @default 'md' */
  size?: "sm" | "md";
  /** Accessible name of the overlay, e.g. "3 unread notifications". */
  label?: string;
  /** The element the overlay is anchored to. */
  children?: ReactNode;
}

export function CountBadge({
  count,
  hasDot = false,
  max = 99,
  isZeroShown = false,
  offset,
  size = "md",
  label,
  variant,
  children,
  className,
  style,
  ...badgeProps
}: CountBadgeProps) {
  const isNumericCount = typeof count === "number";
  const isHidden =
    !hasDot &&
    (count === undefined ||
      count === null ||
      (isNumericCount && count === 0 && !isZeroShown));

  const shown = isNumericCount && count > max ? `${max}+` : (count as ReactNode);

  return (
    <span
      className={["uic-count-badge", className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
      {isHidden ? null : (
        <span
          className={[
            "uic-count-badge__overlay",
            size === "sm" ? "uic-count-badge__overlay--sm" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              "--uic-count-badge-offset-x": `${offset?.[0] ?? 0}px`,
              "--uic-count-badge-offset-y": `${offset?.[1] ?? 0}px`,
            } as CSSProperties
          }
          role="status"
          aria-label={label}
        >
          {hasDot ? (
            <span
              className="uic-count-badge__dot"
              data-variant={variant ?? "neutral"}
            />
          ) : (
            <Badge
              {...badgeProps}
              className="uic-count-badge__pill"
              variant={variant}
              label={shown}
            />
          )}
        </span>
      )}
    </span>
  );
}

CountBadge.displayName = "CountBadge";
