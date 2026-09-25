/**
 * IconWithTooltip
 *
 * A glyph that explains itself on hover and focus: any icon (or a status
 * mark) wrapped in an unstyled, focusable button, so the hint is reachable
 * from the keyboard. The button's accessible name is the tooltip's text.
 *
 * `focusable={false}` renders a plain `<span>` instead (hover only), for use
 * inside another interactive element such as a link or an option, where a
 * nested button is invalid.
 *
 * @example
 * <IconWithTooltip icon={<CircleHelp />} content="Counts only running sessions." />
 */
import type { CSSProperties, ReactNode } from "react";
import { Text } from "@astryxdesign/core/Text";
import { Tooltip, type TooltipProps } from "@astryxdesign/core/Tooltip";

import { nodeToAccessibleLabel } from "./accessibleLabel";
import "./IconWithTooltip.css";

export interface IconWithTooltipProps extends Omit<
  TooltipProps,
  "children" | "anchorRef"
> {
  /** The glyph the tooltip is attached to. */
  icon: ReactNode;
  /**
   * `false` renders the trigger as a plain `<span>` (hover only) instead of a
   * focusable `<button>`. @default true
   */
  focusable?: boolean;
  /** Extra class names on the trigger. */
  className?: string;
  /** Inline styles on the trigger. */
  style?: CSSProperties;
}

export function IconWithTooltip({
  icon,
  focusable = true,
  style,
  className,
  ...tooltipProps
}: IconWithTooltipProps) {
  const label = nodeToAccessibleLabel(tooltipProps.content) || undefined;
  const iconNode = (
    <Text color="placeholder" className="uic-icon-with-tooltip__icon">
      {icon}
    </Text>
  );
  const triggerClassName = (base: string) =>
    ["uic-icon-with-tooltip", base, className].filter(Boolean).join(" ");

  return (
    <Tooltip {...tooltipProps}>
      {focusable ? (
        <button
          type="button"
          aria-label={label}
          className={triggerClassName("uic-icon-with-tooltip--button")}
          style={style}
        >
          {iconNode}
        </button>
      ) : (
        <span aria-label={label} className={triggerClassName("")} style={style}>
          {iconNode}
        </span>
      )}
    </Tooltip>
  );
}

IconWithTooltip.displayName = "IconWithTooltip";
