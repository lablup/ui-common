import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { DateInput, type DateInputProps } from "./index";
import {
  FormItemDemo,
  StatusesDemo,
  ValueReadout,
} from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

/**
 * DateInput on its own and inside `Form.Item`. On its own it is named by
 * `aria-label` and, without `value`, keeps its own state, as antd's
 * controls do. Inside an item, the item owns the label, the help text and the
 * message, and supplies the value (src/formControls).
 */
const meta = {
  title: "Form Controls/DateInput",
  component: DateInput,
  args: { "aria-label": "Start date", onChange: fn() },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
  },
  decorators: [withMaxWidth(400)],
} satisfies Meta<typeof DateInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled: no `value`, so it keeps what the user enters. */
export const Default: Story = {};

/** On its own and controlled, through `value` and `onChange`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<DateInputProps["value"]>("2026-10-19");
    return (
      <>
        <DateInput {...args} value={value} onChange={(next) => setValue(next)} />
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
        <DateInput {...args} aria-label={`Start date (${status})`} status={status} />
      )}
    />
  ),
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
    <FormItemDemo label="Start date">
      <DateInput />
    </FormItemDemo>
  ),
};

/**
 * Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts
 * the value back.
 */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Start date" initialValue={"2026-10-19"}>
      <DateInput />
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
    <FormItemDemo label="Start date" validateTrigger="onBlur">
      <DateInput />
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the control. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Start date" disabled initialValue={"2026-10-19"}>
      <DateInput />
    </FormItemDemo>
  ),
};
