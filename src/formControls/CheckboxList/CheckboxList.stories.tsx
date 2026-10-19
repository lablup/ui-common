import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { CheckboxListItem, CheckboxList } from "./index";
import {
  FormItemDemo,
  StatusesDemo,
  ValueReadout,
} from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

const ITEMS = (
  <>
    <CheckboxListItem value="cpu" label="CPU" />
    <CheckboxListItem value="gpu" label="GPU" />
  </>
);

/**
 * CheckboxList on its own and inside `Form.Item`. On its own it is named by
 * `aria-label` and, without `value`, keeps its own state, as antd's
 * controls do. Inside an item, the item owns the label, the help text and the
 * message, and supplies the value (src/formControls).
 */
const meta = {
  title: "Form Controls/CheckboxList",
  component: CheckboxList,
  args: { "aria-label": "Resources", children: ITEMS, onChange: fn() },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
    children: { control: false },
  },
  decorators: [withMaxWidth(400)],
} satisfies Meta<typeof CheckboxList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled: no `value`, so it keeps what the user enters. */
export const Default: Story = {};

/** On its own and controlled, through `value` and `onChange`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string[] | undefined>(["cpu"]);
    return (
      <>
        <CheckboxList {...args} value={value} onChange={(next) => setValue(next)} />
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
        <CheckboxList {...args} aria-label={`Resources (${status})`} status={status} />
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
    <FormItemDemo label="Resources">
      <CheckboxList>
        <CheckboxListItem value="cpu" label="CPU" />
        <CheckboxListItem value="gpu" label="GPU" />
      </CheckboxList>
    </FormItemDemo>
  ),
};

/**
 * Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts
 * the value back.
 */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Resources" initialValue={["cpu"]}>
      <CheckboxList>
        <CheckboxListItem value="cpu" label="CPU" />
        <CheckboxListItem value="gpu" label="GPU" />
      </CheckboxList>
    </FormItemDemo>
  ),
};

/** Inside a `Form.Item` that validates when focus leaves the control. */
export const ValidateOnBlur: Story = {
  render: () => (
    <FormItemDemo label="Resources" validateTrigger="onBlur">
      <CheckboxList>
        <CheckboxListItem value="cpu" label="CPU" />
        <CheckboxListItem value="gpu" label="GPU" />
      </CheckboxList>
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the control. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Resources" disabled initialValue={["cpu"]}>
      <CheckboxList>
        <CheckboxListItem value="cpu" label="CPU" />
        <CheckboxListItem value="gpu" label="GPU" />
      </CheckboxList>
    </FormItemDemo>
  ),
};
