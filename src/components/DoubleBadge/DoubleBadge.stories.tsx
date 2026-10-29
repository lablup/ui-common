import type { Meta, StoryObj } from "@storybook/react-vite";

import { DoubleBadge } from "./DoubleBadge";
import "./DoubleBadge.stories.css";

const meta = {
  title: "Components/DoubleBadge",
  component: DoubleBadge,
  args: {
    values: [{ label: "RUNNING", variant: "success" }, "2m"],
  },
} satisfies Meta<typeof DoubleBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map((variant) => (
        <DoubleBadge
          key={variant}
          values={[{ label: variant.toUpperCase(), variant }, "5m"]}
        />
      ))}
    </div>
  ),
};

/** Badges of one variant: the divider keeps them apart. */
export const SameVariant: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <DoubleBadge values={["Draft", "Draft"]} />
      <DoubleBadge
        values={[
          { label: "PENDING", variant: "warning" },
          { label: "Queued", variant: "warning" },
        ]}
      />
    </div>
  ),
};

export const ThreeValues: Story = {
  args: {
    values: [
      { label: "PENDING", variant: "warning" },
      { label: "Queued", variant: "info" },
      "12s",
    ],
  },
};

export const Single: Story = {
  args: { values: ["Draft"] },
};

/**
 * Under a theme that tints and outlines badges (light fill, 1px outline, dark
 * text, as Backend.AI WebUI does): the divider takes the outline's place on
 * the shared column, in the colour of the coloured neighbour's outline.
 */
export const TintedTheme: Story = {
  render: () => (
    <div
      className="uic-story-tinted-badges"
      style={{ display: "grid", gap: 8, justifyItems: "start" }}
    >
      {(["neutral", "info", "success", "warning", "error"] as const).map((variant) => (
        <DoubleBadge
          key={variant}
          values={[{ label: variant.toUpperCase(), variant }, "5m"]}
        />
      ))}
      <DoubleBadge values={["Draft", "Draft"]} />
      <DoubleBadge
        values={[{ label: "Paused", variant: "warning" }, { label: "Set by user" }]}
      />
      <DoubleBadge values={["Agent", { label: "26.10.0a4", variant: "success" }]} />
    </div>
  ),
};
