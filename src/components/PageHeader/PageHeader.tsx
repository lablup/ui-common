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
          <span className="page-header__error-text">{error}</span>
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
    </header>
  );
}
