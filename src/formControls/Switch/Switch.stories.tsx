import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Switch } from "./index";
import { FormItemDemo, ValueReadout } from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

/**
 * Switch on its own and inside `Form.Item`. On its own it is named by
 * its text and, without `checked`, keeps its own state, as antd's
 * controls do. Inside an item, the item owns the label, the help text and the
 * message, and supplies the value (src/formControls).
 *
 * It draws no border for `status`, as antd's checkbox, radio and switch draw
 * none: an error shows as the item's message, and as `aria-invalid`.
 */
const meta = {
  title: "Form Controls/Switch",
  component: Switch,
  args: { children: "Email me when a session ends", onChange: fn() },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
    children: { control: false },
  },
  decorators: [withMaxWidth(400)],
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled: no `checked`, so it keeps what the user enters. */
export const Default: Story = {};

/** On its own and controlled, through `checked` and `onChange`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<boolean | undefined>(true);
    return (
      <>
        <Switch {...args} checked={value} onChange={(next) => setValue(next)} />
        <ValueReadout value={value} />
      </>
    );
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
    <FormItemDemo label="Notifications" valuePropName="checked">
      <Switch>Email me when a session ends</Switch>
    </FormItemDemo>
  ),
};

/**
 * Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts
 * the value back.
 */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Notifications" valuePropName="checked" initialValue={true}>
      <Switch>Email me when a session ends</Switch>
    </FormItemDemo>
  ),
};

/** Inside a `Form.Item` that validates when focus leaves the control. */
export const ValidateOnBlur: Story = {
  render: () => (
    <FormItemDemo
      label="Notifications"
      valuePropName="checked"
      validateTrigger="onBlur"
    >
      <Switch>Email me when a session ends</Switch>
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the control. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo
      label="Notifications"
      valuePropName="checked"
      disabled
      initialValue={true}
    >
      <Switch>Email me when a session ends</Switch>
    </FormItemDemo>
  ),
};
