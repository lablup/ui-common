/**
 * ErrorState Component
 *
 * Unified error state component with recovery actions.
 * Provides consistent error presentation across all pages with actionable buttons.
 *
 * Features:
 * - Error type variants (network, configuration, model, permission, generic)
 * - Primary and secondary action buttons
 * - Accessible (ARIA attributes, focus management)
 * - Dark/light theme support
 */

import { useCallback } from "react";
import { AlertCircleIcon } from "../../icons/AlertCircleIcon";
import { Button } from "../Button";
import "./ErrorState.css";

export type ErrorType =
  "network" | "configuration" | "model" | "permission" | "generic";

export interface ErrorAction {
  label: string;
  onClick: () => void;
}

export interface ErrorStateProps {
  /** Error type determines icon and default styling */
  type?: ErrorType;
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
 * Get icon for error type
 */
function getErrorIcon(_type: ErrorType): React.ReactNode {
  // All error types use the same AlertCircleIcon for now
  // Can be extended with different icons per type in the future
  return <AlertCircleIcon size={48} />;
}

/**
 * ErrorState Component
 */
export function ErrorState({
  type = "generic",
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

  const containerClass = ["error-state", `error-state--${type}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} role="alert" aria-live="polite">
      {showIcon && (
        <div className="error-state__icon" aria-hidden="true">
          {getErrorIcon(type)}
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
