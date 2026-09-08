/**
 * PageHeader Component
 *
 * Standardized page header with title, description, and optional action buttons.
 * Provides consistent styling and layout across all pages.
 *
 * @example
 * // Basic usage
 * <PageHeader
 *   title="Models"
 *   description="Manage and browse your local models"
 * />
 *
 * @example
 * // With action buttons
 * <PageHeader
 *   title="Settings"
 *   description="Configure application settings"
 *   actions={
 *     <>
 *       <Button variant="secondary">Import</Button>
 *       <Button variant="primary">Save</Button>
 *     </>
 *   }
 * />
 *
 * @example
 * // With error display
 * <PageHeader
 *   title="Engines"
 *   description="Manage runtime engines"
 *   error={error}
 *   onErrorDismiss={() => clearError()}
 * />
 */

import type { ReactNode } from "react";
import { Button } from "../Button";
import "./PageHeader.css";

export interface PageHeaderProps {
  /** Page title - displayed as h1 */
  title: string;
  /** Page description - displayed below title */
  description?: string;
  /** Optional action buttons or elements on the right side */
  actions?: ReactNode;
  /** Error message to display below the header */
  error?: string | null;
  /**
   * Secondary line under the message, for the raw detail a server returned.
   * Kept separate so the message stays readable when the detail is long.
   */
  errorDetail?: string | null;
  /**
   * Callback for the Retry button, rendered before the dismiss control when
   * set. Dismissal is a pure dismissal and must not retry, which is why these
   * are two props rather than one.
   */
  onRetry?: () => void;
  /** Label for the Retry button. Default: "Retry" */
  retryLabel?: string;
  /** Callback when error is dismissed */
  onErrorDismiss?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Accessible label for the error-dismiss button. Default: "Dismiss error" */
  dismissErrorLabel?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  error,
  onErrorDismiss,
  className = "",
  errorDetail,
  onRetry,
  retryLabel = "Retry",
  dismissErrorLabel = "Dismiss error",
}: PageHeaderProps) {
  const classes = ["page-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="page-header__content">
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          {description && <p className="page-header__description">{description}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
      {error && (
        <div className="page-header__error" role="alert">
          <div className="page-header__error-body">
            <span className="page-header__error-text">{error}</span>
            {errorDetail && (
              <span className="page-header__error-detail">{errorDetail}</span>
            )}
          </div>
          {(onRetry || onErrorDismiss) && (
            <div className="page-header__error-actions">
              {onRetry && (
                <Button
                  variant="secondary"
                  size="small"
                  className="page-header__error-retry"
                  onClick={onRetry}
                >
                  {retryLabel}
                </Button>
              )}
              {onErrorDismiss && (
                <button
                  type="button"
                  className="page-header__error-dismiss"
                  onClick={onErrorDismiss}
                  aria-label={dismissErrorLabel}
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
