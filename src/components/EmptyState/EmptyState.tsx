/**
 * EmptyState Component
 *
 * Unified empty state component with consistent layout and styling.
 * Provides configurable illustration, title, description, and call-to-action buttons.
 *
 * Features:
 * - Multiple illustration types for different contexts
 * - Primary and secondary action buttons, plus a `children` slot for an
 *   onboarding state that needs more than two (issue #3903)
 * - Accessible (ARIA attributes, semantic HTML)
 * - Dark/light theme support via design tokens
 * - Fade-in animation with reduced motion support
 * - Responsive design
 * - Memoized for optimal performance
 */

import { memo, useCallback, useMemo, type ReactNode } from "react";
import { Button } from "../Button";
import "./EmptyState.css";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateSecondaryAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  /**
   * The drawing shown above the text.
   *
   * This used to be one of ten names: chat, models, creations, benchmark,
   * logs, statistics, schedule and so on, each resolving to an SVG shipped
   * inside this package. Those names are one product's information
   * architecture, and no other consumer has a "creations" screen to draw for.
   * A consumer passes its own artwork and keeps its own vocabulary.
   */
  illustration?: ReactNode;
  /** Main heading */
  title: string;
  /** Descriptive text */
  description: string;
  /** Primary action button */
  primaryAction?: EmptyStateAction;
  /** Secondary action (link or button) */
  secondaryAction?: EmptyStateSecondaryAction;
  /**
   * Extra content rendered under the description, inside the same text column.
   *
   * The two action props cover the common one-or-two-button case. An
   * onboarding state that has to offer more than that (e.g. the Data Hub's
   * three ingest paths, issue #3903) renders them here instead of growing a
   * page-local copy of this component.
   */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show illustration (default: true) */
  showIllustration?: boolean;
}

/**
 * EmptyState Component
 *
 * Displays an empty state with illustration, text, and optional actions.
 * Memoized to prevent unnecessary re-renders.
 */
function EmptyStateComponent({
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  className = "",
  showIllustration = true,
}: EmptyStateProps) {
  // Use stable callback references by extracting onClick functions
  const primaryOnClick = primaryAction?.onClick;
  const secondaryOnClick = secondaryAction?.onClick;

  const handlePrimaryAction = useCallback(() => {
    primaryOnClick?.();
  }, [primaryOnClick]);

  const handleSecondaryAction = useCallback(() => {
    secondaryOnClick?.();
  }, [secondaryOnClick]);

  // Memoize class name computation
  const containerClass = useMemo(
    () => ["empty-state", className].filter(Boolean).join(" "),
    [className],
  );

  return (
    <div className={containerClass} role="status" aria-live="polite">
      {showIllustration && illustration && (
        <div className="empty-state__illustration">{illustration}</div>
      )}

      <div className="empty-state__content">
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__description">{description}</p>
        {children}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="empty-state__actions">
          {primaryAction && (
            <Button
              variant="primary"
              onClick={handlePrimaryAction}
              className="empty-state__action-btn empty-state__action-btn--primary"
            >
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <>
              {secondaryAction.href ? (
                <a
                  href={secondaryAction.href}
                  className="empty-state__action-link"
                  onClick={handleSecondaryAction}
                >
                  {secondaryAction.label}
                </a>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSecondaryAction}
                  className="empty-state__action-btn empty-state__action-btn--secondary"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export const EmptyState = memo(EmptyStateComponent);
