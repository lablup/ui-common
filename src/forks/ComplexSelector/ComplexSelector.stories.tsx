import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { ComplexSelector, type ComplexSelectorProps } from "./ComplexSelector";

type Plan = "starter" | "team" | "enterprise";
type Value = Plan | undefined;

const PLANS: Record<Plan, { name: string; detail: string }> = {
  starter: { name: "Starter", detail: "2 vCPU, 4 GiB memory" },
  team: { name: "Team", detail: "8 vCPU, 32 GiB memory" },
  enterprise: { name: "Enterprise", detail: "32 vCPU, 128 GiB memory" },
};

/** A custom surface: one button per plan, with its details. */
function PlanList({
  value,
  onSelect,
}: {
  value: Value;
  onSelect: (value: Plan) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 4, padding: 8 }}>
      {(Object.keys(PLANS) as Plan[]).map((plan) => (
        <Button
          key={plan}
          aria-pressed={plan === value}
          variant={plan === value ? "primary" : "ghost"}
          label={`${PLANS[plan].name}: ${PLANS[plan].detail}`}
          onClick={() => onSelect(plan)}
        />
      ))}
    </div>
  );
}

/** Holds the value, so selecting and clearing change the trigger. */
function SelectorDemo(args: ComplexSelectorProps<Value>) {
  const [value, setValue] = useState<Value>(args.value);
  return (
    <ComplexSelector<Value>
      {...args}
      value={value}
      triggerLabel={value ? PLANS[value].name : undefined}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
      onClear={
        args.onClear &&
        (() => {
          setValue(undefined);
          args.onClear?.();
        })
      }
    />
  );
}

const meta = {
  title: "Forks/ComplexSelector",
  component: ComplexSelector<Value>,
  args: {
    label: "Plan",
    value: "team",
    placeholder: "Choose a plan",
    width: 280,
    onChange: fn(),
    onOpenChange: fn(),
    children: (value, onChange, close) => (
      <PlanList
        value={value}
        onSelect={(next) => {
          onChange(next);
          close();
        }}
      />
    ),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["input", "ghost"] },
  },
  render: (args) => <SelectorDemo {...args} />,
} satisfies Meta<typeof ComplexSelector<Value>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The fork's addition: `hasClear` shows a clear button while a value is
 * shown. It calls `onClear`, and does not open the surface.
 */
export const WithClear: Story = {
  args: { hasClear: true, onClear: fn() },
};

/** Without `onClear`, the clear button calls `onChange(undefined)`. */
export const WithClearFallback: Story = {
  args: { hasClear: true },
};

/** The clear button sits between the loading spinner and the chevron. */
export const WithClearWhileLoading: Story = {
  args: { hasClear: true, onClear: fn(), isLoading: true },
};

export const Placeholder: Story = {
  args: { value: undefined, hasClear: true },
};

export const Disabled: Story = {
  args: { isDisabled: true, hasClear: true },
};

export const WithStatus: Story = {
  args: {
    description: "Billed monthly.",
    status: { type: "error", message: "This plan is not available in your region." },
  },
};

export const Ghost: Story = {
  args: { variant: "ghost", size: "sm", isLabelHidden: true },
};
