import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { PageHeader } from "../PageHeader";
import { StatCard } from "../StatCard";
import { PageLayout } from "./PageLayout";

const content = (
  <>
    <PageHeader
      title="Dashboard"
      description="An overview of the resources in this project."
      actions={<Button variant="primary" label="New project" />}
    />
    <div
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      }}
    >
      <StatCard label="Active sessions" value={1284} />
      <StatCard label="Running jobs" value={42} />
      <StatCard label="Storage used" value={3.2} valueSuffix="TiB" />
      <StatCard label="Members" value={18} />
    </div>
  </>
);

const meta = {
  title: "Components/PageLayout",
  component: PageLayout,
  parameters: { layout: "fullscreen" },
  args: { children: content },
  argTypes: {
    children: { control: false },
    variant: { control: "inline-radio", options: ["standard", "wide", "full"] },
  },
} satisfies Meta<typeof PageLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Wide: Story = {
  args: { variant: "wide" },
};

export const Full: Story = {
  args: { variant: "full" },
};
