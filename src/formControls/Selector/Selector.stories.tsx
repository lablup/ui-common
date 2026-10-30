import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Selector, type SelectorProps } from "./index";
import {
  FormItemDemo,
  StatusesDemo,
  ValueReadout,
} from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

const OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
];

/** Selector without `hasClear`: Storybook cannot type a union of props. */
type SelectorStoryProps = Extract<SelectorProps, { hasClear?: false }>;

/**
 * Selector on its own and inside `Form.Item`. On its own it is named by
 * `aria-label` and, without `value`, keeps its own state, as antd's
 * controls do. Inside an item, the item owns the label, the help text and the
 * message, and supplies the value (src/formControls).
 */
const meta: Meta<SelectorStoryProps> = {
  title: "Form Controls/Selector",
  component: Selector,
  args: {
    "aria-label": "Region",
    options: OPTIONS,
    placeholder: "Select a region",
    onChange: fn(),
  },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
  },
  decorators: [withMaxWidth(400)],
};

export default meta;

type Story = StoryObj<SelectorStoryProps>;

/** On its own and uncontrolled: no `value`, so it keeps what the user enters. */
export const Default: Story = {};

/** On its own and controlled, through `value` and `onChange`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | undefined>("north");
    return (
      <>
        <Selector {...args} value={value} onChange={(next) => setValue(next)} />
        <ValueReadout value={value} />
      </>
    );
  },
};

/** On its own with a border status, antd's `status`: no message. */
export const Statuses: Story = {
  render: (args) => (
    <StatusesDemo
      render={(status) => (
        <Selector {...args} aria-label={`Region (${status})`} status={status} />
      )}
    />
  ),
};

/**
 * An option's `disabled` takes `{ reason }`: the option is disabled and hovering
 * its row says why. A bare `true` disables silently.
 */
export const DisabledOptionReason: Story = {
  args: {
    options: [
      { value: "north", label: "North" },
      {
        value: "south",
        label: "South",
        disabled: { reason: "No agent in this region has a GPU." },
      },
      { value: "east", label: "East", disabled: true },
    ],
  },
};

/** On its own, disabled. */
export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * Inside a `Form.Item`: the item's label names the control, and a required
 * rule shows its one message when the form is submitted empty.
 */
export const InFormItem: Story = {
  render: () => (
    <FormItemDemo label="Region">
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
  ),
};

/**
 * Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts
 * the value back.
 */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Region" initialValue={"north"}>
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
  ),
};

/**
 * Inside a `Form.Item` that validates when focus leaves the control
 * (`validateTrigger="onBlur"`), not while it is edited: empty the field,
 * then move focus away to see the message. `InFormItem` validates on change.
 */
export const ValidateOnBlur: Story = {
  render: () => (
    <FormItemDemo label="Region" validateTrigger="onBlur">
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the control. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Region" disabled initialValue={"north"}>
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
  ),
};
