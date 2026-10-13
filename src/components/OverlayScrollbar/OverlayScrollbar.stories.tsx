import { createRef, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { OverlayScrollbar, type OverlayScrollbarProps } from "./OverlayScrollbar";

type DemoProps = Omit<OverlayScrollbarProps, "targetRef"> & {
  /** Rows rendered at first. */
  initialRows: number;
};

/**
 * A fixed-height scroll container with the thumb drawn over it. The row
 * border runs to the container's right edge, so a native bar taking width
 * would show as the border shrinking.
 */
function ScrollDemo({ initialRows, ...args }: DemoProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(initialRows);
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button label="Add 5 rows" onClick={() => setRows((n) => n + 5)} />
        <Button
          label="Remove 5 rows"
          variant="secondary"
          onClick={() => setRows((n) => Math.max(n - 5, 0))}
        />
      </div>
      <div style={{ position: "relative", height: 240 }}>
        <div
          ref={targetRef}
          style={{
            height: "100%",
            overflow: "auto",
            border: "1px solid var(--color-border)",
          }}
        >
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Item {index + 1}
            </div>
          ))}
        </div>
        <OverlayScrollbar {...args} targetRef={targetRef} />
      </div>
    </div>
  );
}

const meta = {
  title: "Components/OverlayScrollbar",
  component: OverlayScrollbar,
  // The demo passes a ref to its own scroll container in place of this one.
  args: { targetRef: createRef<HTMLElement>() },
  argTypes: { targetRef: { control: false } },
  render: (args) => <ScrollDemo {...args} initialRows={50} />,
} satisfies Meta<typeof OverlayScrollbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A long list: the thumb stays visible and can be dragged. */
export const Default: Story = {};

/** Starts short: no thumb until rows are added past the container's height. */
export const ContentFits: Story = {
  render: (args) => <ScrollDemo {...args} initialRows={3} />,
};
