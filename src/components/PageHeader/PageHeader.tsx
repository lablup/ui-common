/**
 * PageHeader
 *
 * A page's title, description and actions, with an optional error banner
 * under them. Built on Astryx `Heading`, `Text`, `Button` and `IconButton`.
 *
 * @example
 * <PageHeader title="Models" description="Manage and browse your local models" />
 *
 * @example
 * <PageHeader
 *   title="Settings"
 *   actions={<Button variant="primary" label="Save" onClick={save} />}
 * />
 *
 * @example
 * <PageHeader title="Engines" error={error} onRetry={reload} onErrorDismiss={clear} />
 */
import type { ReactNode } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text } from "@astryxdesign/core/Text";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import "./PageHeader.css";

export interface PageHeaderProps {
  /** Page title, rendered as the page's `h1` */
  title: string;
  /** Page description, below the title */
  description?: string;
  /** Actions on the trailing side; they wrap below the title when crowded */
  actions?: ReactNode;
  /** Error message shown in a banner below the header */
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
  /** Label for the Retry button. Default: the catalog's `uic.PageHeader.retry` */
  retryLabel?: string;
  /** Callback when the error is dismissed; renders the dismiss button */
  onErrorDismiss?: () => void;
  /** Additional CSS class names on the `header` element */
  className?: string;
  /**
   * Accessible label for the dismiss button. Default: the catalog's
   * `uic.PageHeader.dismissError` ("Dismiss error")
   */
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
  retryLabel,
  dismissErrorLabel,
}: PageHeaderProps) {
  const t = useUicTranslator();
  const classes = ["uic-page-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="uic-page-header__content">
        <div className="uic-page-header__text">
          <Heading level={1} className="uic-page-header__title">
            {title}
          </Heading>
          {description && (
            <Text as="p" color="secondary" className="uic-page-header__description">
              {description}
            </Text>
          )}
        </div>
        {actions && <div className="uic-page-header__actions">{actions}</div>}
      </div>
      {error && (
        <div className="uic-page-header__error" role="alert">
          <div className="uic-page-header__error-body">
            <Text className="uic-page-header__error-text" color="inherit">
              {error}
            </Text>
            {errorDetail && (
              <Text type="supporting" className="uic-page-header__error-detail">
                {errorDetail}
              </Text>
            )}
          </div>
          {(onRetry || onErrorDismiss) && (
            <div className="uic-page-header__error-actions">
              {onRetry && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="uic-page-header__error-retry"
                  label={retryLabel ?? t("uic.PageHeader.retry")}
                  onClick={onRetry}
                />
              )}
              {onErrorDismiss && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  className="uic-page-header__error-dismiss"
                  label={dismissErrorLabel ?? t("uic.PageHeader.dismissError")}
                  icon={<Icon icon="close" />}
                  onClick={onErrorDismiss}
                />
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
