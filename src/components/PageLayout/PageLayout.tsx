/**
 * PageLayout Component
 *
 * Standardized layout wrapper for all pages in the application.
 * Provides consistent max-width, centering, and spacing.
 *
 * @example
 * // Standard page (900px max-width)
 * <PageLayout>
 *   <PageHeader title="Models" description="Manage your models" />
 *   <Content />
 * </PageLayout>
 *
 * @example
 * // Wide page (1400px max-width)
 * <PageLayout variant="wide">
 *   <PageHeader title="Dashboard" description="Overview" />
 *   <Content />
 * </PageLayout>
 *
 * @example
 * // Full-width page (no max-width clamp). Useful for pages that own their
 * // own internal layout chrome (e.g. a left sidebar) and need to span the
 * // entire available viewport width without centering or right-side gutter.
 * // Note: the mobile padding fallback is also disabled on `--full` so the
 * // page's own internal padding controls horizontal spacing.
 * <PageLayout variant="full">
 *   <Content />
 * </PageLayout>
 */

import type { ReactNode, HTMLAttributes } from "react";
import "./PageLayout.css";

export type PageLayoutVariant = "standard" | "wide" | "full";

export interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** Page content */
  children: ReactNode;
  /** Layout width variant: "standard" (900px), "wide" (1400px), or "full" (no max-width) */
  variant?: PageLayoutVariant;
  /** Additional CSS class names */
  className?: string;
}

export function PageLayout({
  children,
  variant = "standard",
  className = "",
  ...props
}: PageLayoutProps) {
  const classes = ["page-layout", `page-layout--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
