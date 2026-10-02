/**
 * TokenRow
 *
 * A row of read-only tokens that stops at `maxCount` and ends with "and N
 * more", so one long-tailed record cannot stretch a table row. Pass
 * `totalCount` when `items` is only a page of the collection (a connection
 * capped by `first:`): the count then reports what exists, not what was
 * fetched.
 *
 * @example
 * <TokenRow items={aliases.map((a) => ({ key: a, label: a }))} maxCount={2} />
 */
import type { HTMLAttributes, Key, ReactNode } from "react";
import { HStack } from "@astryxdesign/core/Stack";
import { Token, type TokenColor } from "@astryxdesign/core/Token";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import "./TokenRow.css";

export interface TokenRowItem {
  key?: Key;
  label: string;
}

export interface TokenRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  /** The tokens, in order. */
  items: ReadonlyArray<TokenRowItem>;
  /** How many tokens render before the "and N more" count. @default 3 */
  maxCount?: number;
  /** Size of the whole collection when `items` is a page of it. @default items.length */
  totalCount?: number;
  /** Colour of every token. */
  color?: TokenColor;
  /** Rendered instead of the row when there is nothing to show. @default '-' */
  emptyText?: ReactNode;
  /**
   * The count after the tokens, given how many were left out.
   * @default the catalog's uic.TokenRow.more ("and {count} more")
   */
  moreLabel?: (count: number) => string;
}

export function TokenRow({
  items,
  maxCount = 3,
  totalCount,
  color,
  emptyText = "-",
  moreLabel,
  className,
  ...divProps
}: TokenRowProps) {
  const t = useUicTranslator();
  const visibleItems = items.slice(0, maxCount);
  const restCount = Math.max((totalCount ?? items.length) - visibleItems.length, 0);

  if (visibleItems.length === 0) return <>{emptyText}</>;

  return (
    <HStack
      gap={1}
      align="center"
      wrap="wrap"
      className={["uic-token-row", className].filter(Boolean).join(" ")}
      {...divProps}
    >
      {visibleItems.map((item, index) => (
        <Token
          key={item.key ?? `${item.label}-${index}`}
          color={color}
          label={item.label}
        />
      ))}
      {restCount > 0 ? (
        <span className="uic-token-row__more">
          {moreLabel
            ? moreLabel(restCount)
            : t("uic.TokenRow.more", { count: restCount })}
        </span>
      ) : null}
    </HStack>
  );
}

TokenRow.displayName = "TokenRow";
