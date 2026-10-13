import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { BoardItemTitle } from "../BoardItemTitle";
import { useArgState } from "../../stories/helpers";
import { Board } from "./Board";
import type { BoardItem } from "./layout";

interface Widget {
  title: string;
  body: string;
}

const WIDGETS: BoardItem<Widget>[] = [
  {
    id: "sessions",
    columnSpan: 2,
    rowSpan: 3,
    data: { title: "Active sessions", body: "1,284 running across 3 regions." },
  },
  {
    id: "usage",
    columnSpan: 2,
    rowSpan: 3,
    data: { title: "Resource usage", body: "CPU 62%, memory 48%, GPU 71%." },
  },
  {
    id: "queue",
    columnSpan: 1,
    rowSpan: 2,
    data: { title: "Queue", body: "12 pending jobs." },
  },
  {
    id: "storage",
    columnSpan: 1,
    rowSpan: 2,
    data: { title: "Storage", body: "3.2 TiB of 8 TiB used." },
  },
];

function WidgetCard({
  widget,
  endContent,
}: {
  widget: Widget;
  endContent?: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 8, padding: 12 }}>
      <BoardItemTitle title={widget.title} endContent={endContent} />
      <p style={{ margin: 0 }}>{widget.body}</p>
    </div>
  );
}

const meta = {
  title: "Components/Board",
  component: Board<Widget>,
  argTypes: {
    variant: { control: "inline-radio", options: ["plain", "bordered"] },
    emptyContent: { control: false },
    dragHandleIcon: { control: false },
    resizeHandleIcon: { control: false },
  },
  args: {
    items: WIDGETS,
    renderItem: (item) => <WidgetCard widget={item.data} />,
    onItemsChange: fn(),
    variant: "bordered",
  },
} satisfies Meta<typeof Board<Widget>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Editable: Story = {
  args: { isMovable: true, isResizable: true },
  render: function Render(args) {
    const [items, setItems] = useArgState(args.items);
    return (
      <Board<Widget>
        {...args}
        items={items}
        renderItem={(item, { removeItem }) => (
          <WidgetCard
            widget={item.data}
            endContent={
              <Button label="Remove" variant="ghost" size="sm" onClick={removeItem} />
            }
          />
        )}
        onItemsChange={(detail) => {
          args.onItemsChange(detail);
          setItems(detail.items);
        }}
      />
    );
  },
};

export const Empty: Story = {
  args: {
    items: [],
    emptyContent: <p>No widgets yet. Add one to start.</p>,
  },
};
