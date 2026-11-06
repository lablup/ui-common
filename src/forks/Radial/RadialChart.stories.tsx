import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useChartColors } from "@astryxdesign/lab";

import { RadialChart } from "./RadialChart";
import { RadialSlice } from "./RadialSlice";

const data = [
  { state: "Running", count: 12 },
  { state: "Pending", count: 5 },
  { state: "Idle", count: 3 },
];

function Slices() {
  return <RadialSlice colors={useChartColors().categorical(data.length)} />;
}

const meta = {
  title: "Forks/RadialChart",
  component: RadialChart,
  args: {
    data,
    valueKey: "count",
    labelKey: "state",
    innerRadius: 0.6,
    height: 240,
    children: <Slices />,
  },
} satisfies Meta<typeof RadialChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Drag the box's corner: the ring follows it in the same frame, without
 * lagging behind or flickering.
 */
export const ResizableContainer: Story = {
  render: (args) => (
    <div
      style={{
        resize: "horizontal",
        overflow: "hidden",
        width: 320,
        minWidth: 120,
        border: "1px dashed var(--color-border)",
      }}
    >
      <RadialChart {...args} />
    </div>
  ),
};

/** Show and hide the chart: it is drawn on the first frame, never blank. */
export const ToggledMount: Story = {
  render: function Render(args) {
    const [isShown, setIsShown] = useState(true);
    return (
      <div style={{ width: 320 }}>
        <button type="button" onClick={() => setIsShown((shown) => !shown)}>
          {isShown ? "Hide" : "Show"}
        </button>
        {isShown && <RadialChart {...args} />}
      </div>
    );
  },
};
