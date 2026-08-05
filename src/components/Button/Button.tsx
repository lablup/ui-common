/**
 * Button Component
 *
 * Shared button component that consolidates all button styles across the application.
 * Supports multiple variants, sizes, shapes, icons, loading and active states.
 */

import { forwardRef, useCallback } from "react";
import "./Button.css";

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;

  // Styling variants
  variant?:
    "primary" | "secondary" | "danger" | "success" | "ghost" | "text" | "outline";
  size?: "xsmall" | "small" | "medium" | "large";
  shape?: "default" | "circle";
  fullWidth?: boolean;

  // Icon support
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;

  /**
   * Inline mode (default: false). When true, the Button acts as a thin
   * styling shell over a consumer-owned layout:
   *
   * - `min-height` is reset to `auto` so the host CSS controls height
   * - the ghost-variant hover/active translate + box-shadow are
   *   suppressed (no jitter)
   * - children render directly inside the `<button>` element, without
   *   being wrapped in `<span class="button__text">` — useful when the
   *   consumer needs the icon and label to sit on the same baseline
   *   using its own flex/grid layout
   *
   * Use this for compact triggers (selector trigger, badge button,
   * inline action button) that have their own padding, height, and
   * icon+text layout and only want Button for variant theming and
   * accessibility wiring.
   */
  inline?: boolean;

  // States
  loading?: boolean;
  active?: boolean;

  // Accessibility
  ariaLabel?: string;
  title?: string;
  role?: React.AriaRole;
  id?: string;
  tabIndex?: number;
  "aria-pressed"?: boolean;
  "aria-checked"?: boolean;
  "aria-selected"?: boolean;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  "aria-controls"?: string;
  "aria-describedby"?: string;
  "aria-busy"?: boolean;

  // Additional
  className?: string;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    onClick,
    onDoubleClick,
    onMouseDown,
    onMouseEnter,
    onKeyDown,
    type = "button",
    disabled = false,
    variant = "secondary",
    size = "medium",
    shape = "default",
    fullWidth = false,
    icon,
    iconPosition = "left",
    iconOnly = false,
    inline = false,
    loading = false,
    active = false,
    ariaLabel,
    title,
    role,
    id,
    tabIndex,
    className = "",
    style,
    "aria-pressed": ariaPressed,
    "aria-checked": ariaChecked,
    "aria-selected": ariaSelected,
    "aria-expanded": ariaExpanded,
    "aria-haspopup": ariaHasPopup,
    "aria-controls": ariaControls,
    "aria-describedby": ariaDescribedBy,
    "aria-busy": ariaBusy,
    "data-testid": dataTestId,
  },
  ref,
) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading && onClick) {
        onClick(e);
      }
    },
    [disabled, loading, onClick],
  );

  const classNames = [
    "button",
    `button--${variant}`,
    `button--${size}`,
    shape !== "default" && `button--${shape}`,
    fullWidth && "button--full-width",
    iconOnly && "button--icon-only",
    inline && "button--inline",
    loading && "button--loading",
    active && "button--active",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // When iconOnly but no icon prop provided, treat children as icon content
  // This supports both patterns: icon={<Svg/>} and <Button iconOnly><Svg/></Button>
  const iconContent = icon ?? (iconOnly ? children : undefined);
  const hasText = !iconOnly && children;
  const showIcon = iconContent && !loading;
  const showLoadingSpinner = loading;

  return (
    <button
      ref={ref}
      type={type}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}
      disabled={disabled || loading}
      className={classNames}
      aria-label={
        ariaLabel ?? (iconOnly && typeof children === "string" ? children : undefined)
      }
      title={title}
      role={role}
      id={id}
      tabIndex={tabIndex}
      style={style}
      aria-pressed={ariaPressed}
      aria-checked={ariaChecked}
      aria-selected={ariaSelected}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-controls={ariaControls}
      aria-describedby={ariaDescribedBy}
      aria-busy={ariaBusy}
      data-testid={dataTestId}
    >
      {showLoadingSpinner && (
        <span className="button__loading-spinner" aria-hidden="true" />
      )}

      {showIcon && iconPosition === "left" && (
        <span className="button__icon" aria-hidden="true">
          {iconContent}
        </span>
      )}

      {hasText &&
        (inline ? children : <span className="button__text">{children}</span>)}

      {showIcon && iconPosition === "right" && (
        <span className="button__icon" aria-hidden="true">
          {iconContent}
        </span>
      )}
    </button>
  );
});
