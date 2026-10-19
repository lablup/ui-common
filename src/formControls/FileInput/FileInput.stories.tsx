import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { FileInput } from "./index";
import {
  FormItemDemo,
  StatusesDemo,
  ValueReadout,
} from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

/**
 * FileInput on its own and inside `Form.Item`. On its own it is named by
 * `aria-label` and, without `value`, keeps its own state, as antd's
 * controls do. Inside an item, the item owns the label, the help text and the
 * message, and supplies the value (src/formControls).
 */
const meta = {
  title: "Form Controls/FileInput",
  component: FileInput,
  args: { "aria-label": "Model file", onChange: fn() },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
  },
  decorators: [withMaxWidth(400)],
} satisfies Meta<typeof FileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled: no `value`, so it keeps what the user enters. */
export const Default: Story = {};

/** On its own and controlled, through `value` and `onChange`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<File | File[] | null>(null);
    return (
      <>
        <FileInput {...args} value={value} onChange={(next) => setValue(next)} />
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
        <FileInput {...args} aria-label={`Model file (${status})`} status={status} />
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
    <FormItemDemo label="Model file">
      <FileInput />
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
    <FormItemDemo label="Model file" validateTrigger="onBlur">
      <FileInput />
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the control. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Model file" disabled>
      <FileInput />
    </FormItemDemo>
  ),
};
