import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stat } from "./Stat";

/** A small inline trend line for the `media` slot. */
function Sparkline() {
  return (
    <svg viewBox="0 0 100 24" width="100%" height={24} aria-hidden="true">
      <polyline
        points="0,6 20,10 40,8 60,14 80,18 100,20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

const meta = {
  title: "Forks/Stat",
  component: Stat,
  args: {
    label: "Sessions",
    value: "1,204",
    delta: { value: "-918", direction: "down" },
    description: "Last 7 days",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Stat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Hover the delta, or Tab to it, to see what it compares. */
export const WithDeltaTooltip: Story = {
  args: { deltaTooltip: "Previous 7 days: 2,122" },
};

/** An increase: the up glyph and the positive colour, with the same tooltip. */
export const WithPositiveDeltaTooltip: Story = {
  args: {
    delta: { value: "+918", direction: "up" },
    deltaTooltip: "Previous 7 days: 286",
  },
};

/** The sparkline stays outside the delta's tooltip. */
export const WithDeltaTooltipAndMedia: Story = {
  args: { deltaTooltip: "Previous 7 days: 2,122", media: <Sparkline /> },
};
