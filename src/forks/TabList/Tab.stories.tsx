import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleHelp } from "lucide-react";
import { Badge } from "@astryxdesign/core/Badge";
import { TabList } from "@astryxdesign/core/TabList";

import { IconWithTooltip } from "../../components/IconWithTooltip";
import { Tab } from "./Tab";

const meta = {
  title: "Forks/Tab",
  component: Tab,
  args: { value: "general", label: "General" },
  argTypes: {
    endContent: { control: false },
  },
  render: (args) => <Strip {...args} role={undefined} />,
} satisfies Meta<typeof Tab>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Three tabs; the story's args go to the first. */
function Strip({
  role,
  ...tab
}: React.ComponentProps<typeof Tab> & { role?: "tablist" }) {
  const [value, setValue] = useState(tab.value);
  const panel = role === "tablist" ? { panelId: "panel" } : {};
  return (
    <TabList value={value} onChange={setValue} role={role} hasDivider>
      <Tab {...tab} {...panel} />
      <Tab
        value="scheduler"
        label="Scheduler"
        endContent={
          <IconWithTooltip
            icon={<CircleHelp />}
            content="How sessions are queued and placed."
          />
        }
        {...panel}
      />
      <Tab value="logs" label="Logs" endContent={<Badge label="3" />} {...panel} />
    </TabList>
  );
}

export const Default: Story = {};

/**
 * An `IconWithTooltip` in `endContent`, beside the tab's button: hover or Tab
 * to it to see the tooltip; clicking it does not select the tab, and the
 * arrow keys still move between tabs only.
 */
export const WithTooltipEndContent: Story = {
  args: {
    endContent: (
      <IconWithTooltip icon={<CircleHelp />} content="Counts only running sessions." />
    ),
  },
};

/** The same, in a `role="tablist"` strip that controls panels. */
export const WithTooltipEndContentInATablist: Story = {
  args: {
    endContent: (
      <IconWithTooltip icon={<CircleHelp />} content="Counts only running sessions." />
    ),
  },
  render: (args) => <Strip {...args} role="tablist" />,
};

/** A count: clicking it selects the tab, and it describes the tab. */
export const WithBadgeEndContent: Story = {
  args: { endContent: <Badge label="12" /> },
};
