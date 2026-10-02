/**
 * BoardItemTitle
 *
 * The title row of a dashboard panel: a heading with an optional help
 * tooltip, and actions at the end. It sticks to the top of the panel's
 * scroll area on the surface colour, so a long panel keeps its title in view.
 * The two groups wrap onto separate lines when the panel is narrow.
 *
 * @example
 * <BoardItemTitle
 *   title="Active sessions"
 *   tooltip="Counts only running sessions."
 *   endContent={<Button label="Refresh" />}
 * />
 */
import type { HTMLAttributes, ReactNode } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { HStack } from "@astryxdesign/core/Stack";

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
}

export function BoardItemTitle({
  title,
  tooltip,
  tooltipIcon,
  endContent,
  className,
  ...divProps
}: BoardItemTitleProps) {
  return (
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
}

BoardItemTitle.displayName = "BoardItemTitle";
