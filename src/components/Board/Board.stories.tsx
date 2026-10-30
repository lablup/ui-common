import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { HStack, Stack } from "../../astryx/Stack";
import { BoardItemTitle } from "../BoardItemTitle";
import { useArgState } from "../../stories/helpers";
import { Board, type BoardItemsChangeDetail } from "./Board";
import { useIsInBoardItem } from "./BoardItemContext";
import type { BoardItem } from "./layout";

/** The items carry nothing of their own: `title` and `description` are the whole content. */
type Widget = null;

const WIDGETS: BoardItem<Widget>[] = [
  {
    id: "sessions",
    columnSpan: 2,
    rowSpan: 2,
    title: "Active sessions",
    description: "1,284 running across 3 regions.",
    data: null,
  },
  {
    id: "resources",
    columnSpan: 2,
    rowSpan: 2,
    title: "Resource usage",
    description: "CPU 62%, memory 48%, GPU 71%.",
    data: null,
  },
  {
    id: "queue",
    columnSpan: 1,
    rowSpan: 2,
    title: "Queue",
    description: "12 pending jobs.",
    data: null,
  },
  {
    id: "storage",
    columnSpan: 1,
    rowSpan: 2,
    title: "Storage",
    description: "3.2 TiB of 8 TiB used.",
    data: null,
  },
];

const meta = {
  title: "Components/Board",
  component: Board<Widget>,
  argTypes: {
    variant: { control: "inline-radio", options: ["plain", "bordered"] },
    emptyContent: { control: false },
    dragHandleIcon: { control: false },
    resizeHandleIcon: { control: false },
    itemPadding: { control: false },
  },
  args: {
    items: WIDGETS,
    onItemsChange: fn(),
    variant: "bordered",
  },
} satisfies Meta<typeof Board<Widget>>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Each item renders its `title` as a header row and its `description` under it. */
export const Default: Story = {};

/** `Board` is controlled: a story that moves or resizes keeps the items it reports. */
const renderEditable: Story["render"] = function Render(args) {
  const [items, setItems] = useArgState(args.items);
  return (
    <Board<Widget>
      {...args}
      items={items}
      onItemsChange={(detail) => {
        args.onItemsChange(detail);
        setItems(detail.items);
      }}
    />
  );
};

/** The drag handle sits on the header row's first line, in the inline padding. */
export const Editable: Story = {
  args: { isMovable: true, isResizable: true },
  render: renderEditable,
};

/** A `BoardItemTitle` node as the title: a help tooltip and end-of-row actions. Removing is the consumer's: filter the items. */
export const TitleWithActions: Story = {
  args: { isMovable: true, isResizable: true },
  // Storybook's JSX snippet walks a rendered element's props; node titles made
  // in a render function hang it, so this story shows its code instead.
  parameters: { docs: { source: { type: "code" } } },
  render: function Render(args) {
    const [items, setItems] = useArgState(args.items);
    const remove = (id: string) => {
      const next = items.filter((item) => item.id !== id);
      const detail: BoardItemsChangeDetail<Widget> = { items: next };
      args.onItemsChange(detail);
      setItems(next);
    };
    return (
      <Board<Widget>
        {...args}
        items={items.map((item) => ({
          ...item,
          title: (
            <BoardItemTitle
              title={item.title}
              tooltip="Measured over the last 15 minutes."
              endContent={
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(item.id)}
                />
              }
            />
          ),
        }))}
        onItemsChange={(detail) => {
          args.onItemsChange(detail);
          // The board hands back the items it was given, wrapped titles and
          // all: keep each item's own title so the next render wraps it once.
          const titles = new Map(items.map((item) => [item.id, item.title]));
          setItems(
            detail.items.map((item) => ({ ...item, title: titles.get(item.id) })),
          );
        }}
      />
    );
  },
};

function ExpandableTitle({ title, detail }: { title: string; detail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Stack gap={2}>
      <HStack gap={2} align="center" justify="between">
        <span>{title}</span>
        <Button
          label={isOpen ? "Hide" : "Show more"}
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen((open) => !open)}
        />
      </HStack>
      {isOpen ? <p style={{ margin: 0 }}>{detail}</p> : null}
    </Stack>
  );
}

/** The drag handle keeps its spot when a title wraps, or when a node title grows. */
export const LongTitle: Story = {
  args: {
    isMovable: true,
    isResizable: true,
    items: [
      {
        ...WIDGETS[0]!,
        title:
          "Active sessions across every resource group this project can reach, including the ones scheduled but not yet running",
      },
      {
        ...WIDGETS[1]!,
        title: (
          <ExpandableTitle
            title="Resource usage"
            detail="Measured over the last 15 minutes. Open the panel to pin a longer window."
          />
        ),
      },
      WIDGETS[2]!,
      WIDGETS[3]!,
    ],
  },
  render: renderEditable,
};

/** Without a title the description takes the whole item; the drag handle still sits in the inline padding. */
export const NoTitle: Story = {
  args: {
    isMovable: true,
    items: WIDGETS.map(({ title: _title, ...item }) => item),
  },
  render: renderEditable,
};

/** A panel that draws its own title row, as content does when it is built once and used in a board and elsewhere. */
function Panel({ title, body }: { title: string; body: string }) {
  const isInBoardItem = useIsInBoardItem();
  return (
    <Stack gap={3} style={isInBoardItem ? undefined : { padding: 16 }}>
      <BoardItemTitle
        title={title}
        tooltip="Measured over the last 15 minutes."
        endContent={<Button label="View all" variant="ghost" size="sm" />}
      />
      <p style={{ margin: 0 }}>{body}</p>
      <BoardItemTitle title="Details" inline />
      <p style={{ margin: 0 }}>
        {isInBoardItem ? "Inside a board item." : "Standalone."}
      </p>
    </Stack>
  );
}

/**
 * Without a `title`, the first `BoardItemTitle` in the description renders in
 * the item's header row; `inline` keeps one in the body. `useIsInBoardItem()`
 * is true inside the description.
 */
export const TitleInDescription: Story = {
  args: {
    isMovable: true,
    isResizable: true,
    items: WIDGETS.map(({ title, description, ...item }) => ({
      ...item,
      rowSpan: 3,
      description: <Panel title={String(title)} body={String(description)} />,
    })),
  },
  parameters: { docs: { source: { type: "code" } } },
  render: renderEditable,
};

/** `itemPadding` sets every item's padding: a number (px) or a CSS length for all sides, or one per side. */
export const Padding: Story = {
  args: { isMovable: true, itemPadding: { top: 12, right: 16, bottom: 12, left: 16 } },
  render: renderEditable,
};

export const Empty: Story = {
  args: {
    items: [],
    emptyContent: <p>No widgets yet. Add one to start.</p>,
  },
};
