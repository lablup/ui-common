/**
 * ErrorState Component
 *
 * Unified error state component with recovery actions.
 * Provides consistent error presentation across all pages with actionable buttons.
 *
 * Features:
 * - Three visual tones
 * - Primary and secondary action buttons
 * - Accessible (ARIA attributes, focus management)
 * - Dark/light theme support
 */

import type { ReactNode } from "react";
import { useCallback } from "react";
import { AlertCircleIcon } from "../../icons/AlertCircleIcon";
import { Button } from "../Button";
import "./ErrorState.css";

/**
 * How the error reads, not what it is about.
 *
 * This prop used to be a union of five names: network, configuration, model,
 * permission, generic. Two of those, and "model" in particular, are one
 * product's categories rather than anything a shared component can reason
 * about, and all five resolved to three colours anyway: network and permission
 * were the same amber, model and generic the same red. A consumer decides
 * which of its own error categories reads as which tone.
 */
export type ErrorTone = "danger" | "warning" | "accent";

export interface ErrorAction {
  label: string;
  onClick: () => void;
}

export interface ErrorStateProps {
  /** How the error reads. Defaults to `danger`. */
  tone?: ErrorTone;
  /** Replaces the default alert icon. */
  icon?: ReactNode;
  /** Error title - main heading */
  title: string;
  /** Detailed error message */
  message: string;
  /** Primary action button (e.g., Retry, Go to Settings) */
  primaryAction?: ErrorAction;
  /** Secondary action button (e.g., View Logs, Report Issue) */
  secondaryAction?: ErrorAction;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show error icon */
  showIcon?: boolean;
}

/**
 * ErrorState Component
 */
export function ErrorState({
  tone = "danger",
  icon,
  title,
  message,
  primaryAction,
  secondaryAction,
  className = "",
  showIcon = true,
}: ErrorStateProps) {
  const handlePrimaryAction = useCallback(() => {
    primaryAction?.onClick();
  }, [primaryAction]);

  const handleSecondaryAction = useCallback(() => {
    secondaryAction?.onClick();
  }, [secondaryAction]);

  const containerClass = ["error-state", `error-state--${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} role="alert" aria-live="polite">
      {showIcon && (
        <div className="error-state__icon" aria-hidden="true">
          {icon ?? <AlertCircleIcon size={48} />}
        </div>
      )}

      <h2 className="error-state__title">{title}</h2>

      <p className="error-state__message">{message}</p>

      {(primaryAction || secondaryAction) && (
        <div className="error-state__actions">
          {primaryAction && (
            <Button
              variant="primary"
              onClick={handlePrimaryAction}
              className="error-state__action-btn error-state__action-btn--primary"
            >
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={handleSecondaryAction}
              className="error-state__action-btn error-state__action-btn--secondary"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
