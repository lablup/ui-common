import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { UnitGrid, type UnitGridGroup, type UnitGridLegendItem } from "./UnitGrid";
import { UnitGridSkeleton } from "./UnitGridSkeleton";

const LOW = "var(--color-icon-green)";
const MEDIUM = "var(--color-icon-orange)";
const HIGH = "var(--color-icon-red)";

const LEGEND: UnitGridLegendItem[] = [
  { color: LOW, label: "Low load" },
  { color: MEDIUM, label: "Medium load" },
  { color: HIGH, label: "High load" },
];

const LEVELS = [LOW, LOW, MEDIUM, HIGH];

const makeGroup = (key: string, label: string, size: number, seed: number) => ({
  key,
  label,
  units: Array.from({ length: size }, (_unused, i) => ({
    color: LEVELS[(i + seed) % LEVELS.length]!,
  })),
});

const GROUPS: UnitGridGroup[] = [
  makeGroup("alpha", "Alpha", 12, 0),
  makeGroup("beta", "Beta", 8, 1),
  makeGroup("gamma", "Gamma", 20, 2),
  makeGroup("delta", "Delta", 4, 3),
  makeGroup("epsilon", "Epsilon", 16, 1),
  makeGroup("zeta", "Zeta", 6, 2),
];

const meta = {
  title: "Components/UnitGrid",
  component: UnitGrid,
  subcomponents: { UnitGridSkeleton },
  args: {
    groups: GROUPS,
    "aria-label": "Accelerator allocation",
  },
  argTypes: {
    layout: { control: "inline-radio", options: ["serpentine", "wordwrap"] },
  },
} satisfies Meta<typeof UnitGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WordWrapLayout: Story = {
  args: { layout: "wordwrap" },
};

export const FixedColumns: Story = {
  args: { columns: 12 },
};

export const WithPopover: Story = {
  args: {
    legendItems: LEGEND,
    renderGroupPopover: (group) => `${group.units.length} units allocated`,
    onClickGroup: fn(),
  },
};

export const PartialFill: Story = {
  args: {
    groups: [
      {
        key: "alpha",
        label: "Alpha",
        units: [
          { color: LOW },
          { color: LOW },
          { color: MEDIUM, fraction: 0.5 },
          { color: HIGH, fraction: 0.25 },
        ],
      },
      makeGroup("beta", "Beta", 6, 0),
    ],
  },
};

export const TentativeGroup: Story = {
  args: {
    groups: [...GROUPS.slice(0, 3), { ...GROUPS[3]!, plateVariant: "dashed" }],
  },
};

export const HuePicker: Story = {
  args: { onHueOverrideChange: fn() },
  render: function Render(args) {
    const [hueOverrides, setHueOverrides] = useState<Record<string, number>>({});
    return (
      <UnitGrid
        {...args}
        hueOverrides={hueOverrides}
        onHueOverrideChange={(key, paletteIndex) => {
          args.onHueOverrideChange?.(key, paletteIndex);
          setHueOverrides((prev) => ({ ...prev, [key]: paletteIndex }));
        }}
      />
    );
  },
};

export const CustomPalette: Story = {
  args: {
    groupPalette: ["var(--color-icon-blue)", "var(--color-icon-purple)"],
  },
};

export const CappedGroups: Story = {
  args: { maxUnitsPerGroup: 8 },
};

export const Empty: Story = {
  args: { groups: [], emptyFallback: "No units allocated." },
};

export const Skeleton: Story = {
  render: () => <UnitGridSkeleton />,
};

export const SkeletonRows: Story = {
  render: () => <UnitGridSkeleton rows={5} />,
};
