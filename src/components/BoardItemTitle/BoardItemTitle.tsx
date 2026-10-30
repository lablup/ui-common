/**
 * BoardItemTitle
 *
 * A Board item's `title` node: a heading with an optional help tooltip, and
 * actions at the end. The board pads and places the row; the two groups wrap
 * onto separate lines when the item is narrow.
 *
 * In an item's `description`, when the item has no `title`, the first one
 * renders in the item's header row instead, where a `title` node would be;
 * `inline` keeps it in the body.
 *
 * @example
 * items={[{
 *   id: "sessions",
 *   title: (
 *     <BoardItemTitle
 *       title="Active sessions"
 *       tooltip="Counts only running sessions."
 *       endContent={<Button label="Refresh" />}
 *     />
 *   ),
 *   description: <SessionCount />,
 *   data: {},
 * }]}
 */
import {
  useContext,
  useId,
  useLayoutEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { HStack } from "@astryxdesign/core/Stack";

import { BoardItemContext } from "../Board/BoardItemContext";
import { IconWithTooltip } from "../IconWithTooltip";
import "./BoardItemTitle.css";

export interface BoardItemTitleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> {
  /** The title. A string renders as a level-5 heading; a node renders as is. */
  title: ReactNode;
  /** Help text in a tooltip beside the title. Without it, no help glyph. */
  tooltip?: ReactNode;
  /** Glyph of the help tooltip. @default the theme's `info` icon */
  tooltipIcon?: ReactNode;
  /** Actions at the end of the row. */
  endContent?: ReactNode;
  /**
   * Inside a Board item's `description`, stay in the body instead of moving
   * to the item's header row (a second section title, say). @default false
   */
  inline?: boolean;
}

export function BoardItemTitle({
  title,
  tooltip,
  tooltipIcon,
  endContent,
  inline = false,
  className,
  ...divProps
}: BoardItemTitleProps) {
  const item = useContext(BoardItemContext);
  const id = useId();
  const claimHeader = inline ? null : (item?.claimHeader ?? null);
  useLayoutEffect(() => (claimHeader ? claimHeader(id) : undefined), [claimHeader, id]);

  const row = (
    <HStack
      gap={2}
      align="center"
      justify="between"
      wrap="wrap"
      className={["uic-board-item-title", className].filter(Boolean).join(" ")}
      {...divProps}
    >
      <HStack
        gap={2}
        align="center"
        wrap="wrap"
        className="uic-board-item-title__group"
      >
        {typeof title === "string" ? <Heading level={5}>{title}</Heading> : title}
        {tooltip ? (
          <IconWithTooltip
            icon={tooltipIcon ?? <Icon icon="info" />}
            content={tooltip}
          />
        ) : null}
      </HStack>
      <HStack
        gap={2}
        align="center"
        justify="end"
        className="uic-board-item-title__group uic-board-item-title__end"
      >
        {endContent}
      </HStack>
    </HStack>
  );
  if (!item || !claimHeader) return row;
  // In an untitled item: the header row's title while this title holds it,
  // in the body once another one does. Nothing until the claim settles, so
  // the row mounts once, in its final place.
  if (item.headerOwner === id) {
    return item.headerSlot ? createPortal(row, item.headerSlot) : null;
  }
  return item.headerOwner === null ? null : row;
}

BoardItemTitle.displayName = "BoardItemTitle";
