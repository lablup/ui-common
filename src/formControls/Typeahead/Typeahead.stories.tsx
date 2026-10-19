import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { createStaticSource, Typeahead, type SearchableItem } from "./index";
import {
  FormItemDemo,
  StatusesDemo,
  ValueReadout,
} from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

const PEOPLE = [
  { id: "ada", label: "Ada Lovelace" },
  { id: "alan", label: "Alan Turing" },
];
const source = createStaticSource(PEOPLE);

/**
 * Typeahead on its own and inside `Form.Item`. On its own it is named by
 * `aria-label` and, without `value`, keeps its own state, as antd's
 * controls do. Inside an item, the item owns the label, the help text and the
 * message, and supplies the value (src/formControls).
 */
const meta = {
  title: "Form Controls/Typeahead",
  component: Typeahead,
  args: {
    "aria-label": "Owner",
    searchSource: source,
    placeholder: "Search people",
    onChange: fn(),
  },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
  },
  decorators: [withMaxWidth(400)],
} satisfies Meta<typeof Typeahead>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled: no `value`, so it keeps what the user enters. */
export const Default: Story = {};

/** On its own and controlled, through `value` and `onChange`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<SearchableItem | null | undefined>(PEOPLE[0]);
    return (
      <>
        <Typeahead {...args} value={value} onChange={(next) => setValue(next)} />
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
        <Typeahead {...args} aria-label={`Owner (${status})`} status={status} />
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
    <FormItemDemo label="Owner">
      <Typeahead searchSource={source} placeholder="Search people" />
    </FormItemDemo>
  ),
};

/**
 * Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts
 * the value back.
 */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Owner" initialValue={PEOPLE[0]}>
      <Typeahead searchSource={source} placeholder="Search people" />
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
    <FormItemDemo label="Owner" validateTrigger="onBlur">
      <Typeahead searchSource={source} placeholder="Search people" />
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the control. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Owner" disabled initialValue={PEOPLE[0]}>
      <Typeahead searchSource={source} placeholder="Search people" />
    </FormItemDemo>
  ),
};
