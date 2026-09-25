/**
 * TokenList
 *
 * A bounded list of settled values: the first `maxInline` items inline, then
 * a `+N` that shows the rest. The overflow opens on hover and focus, like a
 * tooltip, on a card surface (`HoverCard`) because it is a list of values,
 * not a hint. `trigger="click"` latches it open as a `Popover` instead.
 *
 * - `variant="token"` (default): the items are `Token`s and `+N` is a `Link`.
 *   Suits dialogs and forms.
 * - `variant="text"`: the items are plain, unwrapped text and `+N` is a
 *   compact `Badge`. Suits dense table cells.
 *
 * The overflow lists only the items that did not fit.
 *
 * @example
 * <TokenList items={emails} maxInline={2} variant="text" />
 */
import type { ReactNode } from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { HoverCard } from "@astryxdesign/core/HoverCard";
import { Link } from "@astryxdesign/core/Link";
import { Popover } from "@astryxdesign/core/Popover";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";

import "./TokenList.css";

export type TokenListItem = string | number;

export interface TokenListProps {
  /** The values. */
  items: ReadonlyArray<TokenListItem>;
  /** How many items show inline before `+N`. @default 3 */
  maxInline?: number;
  /** Rendered instead of the list when `items` is empty. @default '-' */
  emptyText?: ReactNode;
  /** `token` for Tokens and a `+N` link, `text` for plain text and a `+N` badge. @default 'token' */
  variant?: "token" | "text";
  /** How the overflow opens. @default 'hover' */
  trigger?: "hover" | "click";
}

export function TokenList({
  items,
  maxInline = 3,
  emptyText = "-",
  variant = "token",
  trigger = "hover",
}: TokenListProps) {
  if (items.length === 0) return <>{emptyText}</>;

  const inlineItems = items.slice(0, maxInline);
  const restItems = items.slice(maxInline);
  const restCount = restItems.length;

  const restList = (
    <VStack align="start" className="uic-token-list__rest">
      {restItems.map((item, index) => (
        <Text key={`${item}-${index}`}>{item}</Text>
      ))}
    </VStack>
  );

  const overflowControl =
    trigger === "hover" ? (
      // touchTrigger="tap": the token variant's trigger is a button with no
      // action of its own, so the default would leave touch users no way in.
      <HoverCard content={restList} touchTrigger="tap">
        {variant === "text" ? (
          // A Badge is a bare <span>; HoverCard only attaches focus to a
          // focusable trigger.
          <Badge
            variant="neutral"
            label={`+${restCount}`}
            tabIndex={0}
            className="uic-token-list__count"
          />
        ) : (
          <Link>+{restCount}</Link>
        )}
      </HoverCard>
    ) : (
      // Popover wires its handlers onto a <button> in the trigger, which a
      // Link without href renders. The list is read-only: no close button,
      // no autofocus, and no dialog role for a layer focus never enters.
      <Popover
        label={`+${restCount}`}
        content={restList}
        hasCloseButton={false}
        hasAutoFocus={false}
        role="none"
      >
        <Link>+{restCount}</Link>
      </Popover>
    );

  if (variant === "text") {
    return (
      <HStack gap={1} align="center" className="uic-token-list uic-token-list--text">
        {inlineItems.map((item, index) => (
          <span key={`${item}-${index}`} className="uic-token-list__text">
            {item}
          </span>
        ))}
        {restCount > 0 && overflowControl}
      </HStack>
    );
  }

  return (
    <span>
      <HStack gap={2} align="center" wrap="wrap" className="uic-token-list">
        {inlineItems.map((item, index) => (
          <Token key={`${item}-${index}`} label={String(item)} />
        ))}
      </HStack>
      {restCount > 0 && (
        <>
          {" "}
          {overflowControl}
        </>
      )}
    </span>
  );
}

TokenList.displayName = "TokenList";
