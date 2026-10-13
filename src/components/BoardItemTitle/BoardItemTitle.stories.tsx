import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { BoardItemTitle } from "./BoardItemTitle";
import { withMaxWidth } from "../../stories/helpers";

const meta = {
  title: "Components/BoardItemTitle",
  component: BoardItemTitle,
  argTypes: {
    endContent: { control: false },
  },
  args: {
    title: "Active sessions",
  },
} satisfies Meta<typeof BoardItemTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTooltip: Story = {
  args: { tooltip: "Counts only sessions that are running now." },
};

export const WithActions: Story = {
  args: {
    tooltip: "Counts only sessions that are running now.",
    endContent: <Button label="Refresh" size="sm" onClick={fn()} />,
  },
};

export const Narrow: Story = {
  args: {
    title: "Resource usage by project",
    tooltip: "Updated every minute.",
    endContent: (
      <>
        <Button label="Export" size="sm" />
        <Button label="Refresh" size="sm" />
      </>
    ),
  },
  decorators: [withMaxWidth(260)],
};
