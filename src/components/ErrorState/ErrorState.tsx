/**
 * ErrorState
 *
 * A full-area error with a title, a message and up to two recovery actions.
 * Built on Astryx `Icon`, `Heading`, `Text` and `Button`.
 *
 * @example
 * <ErrorState
 *   tone="warning"
 *   title="Connection error"
 *   message="Could not reach the server."
 *   primaryAction={{ label: "Retry", onClick: retry }}
 * />
 */
import type { ReactNode } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";

import "./ErrorState.css";

/**
 * How the error reads, not what it is about. A consumer maps its own error
 * categories onto these three.
 */
export type ErrorTone = "danger" | "warning" | "accent";

export interface ErrorAction {
  label: string;
  onClick: () => void;
}

export interface ErrorStateProps {
  /** How the error reads. Defaults to `danger`. */
  tone?: ErrorTone;
  /** Replaces the default icon (Astryx's `error` glyph). */
  icon?: ReactNode;
  /** Error title, the region's heading */
  title: string;
  /** Detailed error message */
  message: string;
  /** Primary action button (e.g. Retry, Go to settings) */
  primaryAction?: ErrorAction;
  /** Secondary action button (e.g. View logs, Report issue) */
  secondaryAction?: ErrorAction;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the icon. Default: true */
  showIcon?: boolean;
}

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
  const containerClass = ["uic-error-state", `uic-error-state--${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} role="alert" aria-live="polite">
      {showIcon && (
        <div className="uic-error-state__icon" aria-hidden="true">
          {icon ?? <Icon icon="error" />}
        </div>
      )}

      <Heading level={2} className="uic-error-state__title">
        {title}
      </Heading>

      <Text as="p" color="secondary" className="uic-error-state__message">
        {message}
      </Text>

      {(primaryAction || secondaryAction) && (
        <div className="uic-error-state__actions">
          {primaryAction && (
            <Button
              variant="primary"
              label={primaryAction.label}
              onClick={() => primaryAction.onClick()}
              className="uic-error-state__action uic-error-state__action--primary"
            />
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              label={secondaryAction.label}
              onClick={() => secondaryAction.onClick()}
              className="uic-error-state__action uic-error-state__action--secondary"
            />
          )}
        </div>
      )}
    </div>
  );
}
