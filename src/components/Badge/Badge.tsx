/**
 * Badge Component
 *
 * Small label/chip component for displaying status, tags, and categories.
 * Supports multiple variants with semantic colors from the design system.
 */

import "./Badge.css";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "small" | "medium";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "small",
  className = "",
}: BadgeProps) {
  const classNames = ["badge", `badge--${variant}`, `badge--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classNames}>{children}</span>;
}
