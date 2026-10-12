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
    renderItem: (item) => (
      <div style={{ display: "grid", gap: 8, padding: 12 }}>
        <BoardItemTitle title={item.data.title} />
        <p style={{ margin: 0 }}>{item.data.body}</p>
      </div>
    ),
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
          <div style={{ display: "grid", gap: 8, padding: 12 }}>
            <BoardItemTitle
              title={item.data.title}
              endContent={
                <Button label="Remove" variant="ghost" size="sm" onClick={removeItem} />
              }
            />
            <p style={{ margin: 0 }}>{item.data.body}</p>
          </div>
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
