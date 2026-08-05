/**
 * BaseCard Component
 *
 * Common card foundation providing unified hover, animation, and state effects.
 * Use this component to ensure consistent UI/UX across all card-style components.
 *
 * @example
 * // Basic usage
 * <BaseCard>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </BaseCard>
 *
 * @example
 * // Clickable card with loading state
 * <BaseCard
 *   clickable
 *   onClick={handleClick}
 *   state="loading"
 * >
 *   <CardContent />
 * </BaseCard>
 */

import React, { forwardRef } from "react";
import "./BaseCard.css";

export type BaseCardVariant = "default" | "installed" | "available";
export type BaseCardState = "idle" | "loading" | "active" | "disabled" | "warning";
export type BaseCardDirection = "column" | "row";

export interface BaseCardProps {
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /**
   * Inline style escape hatch. Intended for passing dynamic CSS custom
   * properties (e.g. `{ "--corner-accent-color": brandColor }`) that cannot be
   * expressed as a static class. Avoid using it for static layout.
   */
  style?: React.CSSProperties;
  /** Click handler - also enables clickable styling */
  onClick?: () => void;
  /** Keyboard event handler */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Whether the card should have clickable styling (auto-enabled if onClick provided) */
  clickable?: boolean;
  /** Card visual variant */
  variant?: BaseCardVariant;
  /**
   * Flex layout direction of the card's content.
   * Defaults to `"column"` (content stacks vertically). Pass `"row"` for a
   * horizontal layout (icon + content, text + badge, info + actions). Without
   * this, a horizontal layout silently collapses into a centered vertical
   * stack because the base style forces `flex-direction: column`.
   */
  direction?: BaseCardDirection;
  /** Card state for animations and visual feedback */
  state?: BaseCardState;
  /** Whether to show hover effects (default: true) */
  hoverable?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** ARIA role override (default: "button" when clickable) */
  role?: string;
  /** ARIA checked state for radio/checkbox roles */
  ariaChecked?: boolean;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Test ID for testing */
  testId?: string;
}

/**
 * BaseCard provides a consistent foundation for card-style UI components.
 *
 * Features:
 * - Unified hover effects (lift, shadow, border)
 * - State-based styling (loading, active, disabled)
 * - Accessibility support (keyboard navigation, focus styles)
 * - Reduced motion preference support
 */
export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      children,
      className = "",
      style,
      onClick,
      onKeyDown,
      clickable,
      variant = "default",
      direction = "column",
      state = "idle",
      hoverable = true,
      ariaLabel,
      role,
      ariaChecked,
      tabIndex,
      testId,
    },
    ref,
  ) => {
    const isClickable = clickable ?? !!onClick;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (onKeyDown) {
        onKeyDown(e);
      }
      // Allow Enter or Space to trigger click for accessibility
      if (isClickable && onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    };

    const classNames = [
      "base-card",
      `base-card--${variant}`,
      direction === "row" && "base-card--row",
      hoverable && "base-card--hoverable",
      isClickable && "base-card--clickable",
      state !== "idle" && `base-card--${state}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Determine the role: explicit role > "button" for clickable > undefined
    const effectiveRole = role ?? (isClickable ? "button" : undefined);

    return (
      <div
        ref={ref}
        className={classNames}
        style={style}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={effectiveRole}
        tabIndex={isClickable ? (tabIndex ?? 0) : tabIndex}
        aria-label={ariaLabel}
        aria-checked={ariaChecked}
        aria-disabled={state === "disabled" ? true : undefined}
        data-testid={testId}
      >
        {children}
      </div>
    );
  },
);

BaseCard.displayName = "BaseCard";

export default BaseCard;
