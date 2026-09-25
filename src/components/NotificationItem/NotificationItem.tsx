/**
 * NotificationItem
 *
 * The body of one notice: a title, a description, actions and a footer (a
 * timestamp, say), stacked, with the actions and the footer at the end. A
 * string or number in a slot renders as body `Text`; a node renders as is.
 * The title leaves room at the end for the notice's close button.
 *
 * @example
 * <NotificationItem
 *   title="Upload finished"
 *   description="report.csv"
 *   action={<Button label="Open" />}
 *   footer="2 minutes ago"
 * />
 */
import type { ReactNode } from "react";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

import "./NotificationItem.css";

export interface NotificationItemProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Actions, at the end of their own row. */
  action?: ReactNode;
  /** A quiet note at the end, such as when the notice arrived. */
  footer?: ReactNode;
  className?: string;
}

const asText = (content: ReactNode) =>
  typeof content === "string" ||
  typeof content === "number" ||
  typeof content === "bigint" ? (
    <Text>{content}</Text>
  ) : (
    content
  );

export function NotificationItem({
  title,
  description,
  action,
  footer,
  className,
}: NotificationItemProps) {
  return (
    <div className={["uic-notification-item", className].filter(Boolean).join(" ")}>
      <VStack gap={1} align="stretch" className="uic-notification-item__stack">
        {title && <div className="uic-notification-item__title">{asText(title)}</div>}
        {description && <div>{asText(description)}</div>}
        {action && (
          <HStack
            gap={1}
            align="end"
            justify="end"
            className="uic-notification-item__action"
          >
            {action}
          </HStack>
        )}
        {footer && (
          <div className="uic-notification-item__footer">{asText(footer)}</div>
        )}
      </VStack>
    </div>
  );
}

NotificationItem.displayName = "NotificationItem";
