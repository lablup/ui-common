import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Slider, type SliderSingleProps } from "./index";
import type { FormControlValueProps } from "../formControl";
import { FormItemDemo, ValueReadout } from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

/** A single-value Slider: Storybook cannot type its overloads. */
type SliderStoryProps = FormControlValueProps<SliderSingleProps>;

/**
 * Slider on its own and inside `Form.Item`. On its own it is named by
 * `aria-label` and, without `value`, keeps its own state, as antd's
 * controls do. Inside an item, the item owns the label, the help text and the
 * message, and supplies the value (src/formControls).
 *
 * It draws no border for `status`, as antd's checkbox, radio and switch draw
 * none: an error shows as the item's message, and as `aria-invalid`.
 */
const meta = {
  title: "Form Controls/Slider",
  component: Slider,
  args: { "aria-label": "Memory share", min: 0, max: 100, onChange: fn() },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
  },
  decorators: [withMaxWidth(400)],
} satisfies Meta<SliderStoryProps>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled: no `value`, so it keeps what the user enters. */
export const Default: Story = {};

/** On its own and controlled, through `value` and `onChange`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number>(40);
    return (
      <>
        <Slider {...args} value={value} onChange={(next) => setValue(next)} />
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
    <FormItemDemo label="Memory share">
      <Slider min={0} max={100} />
    </FormItemDemo>
  ),
};

/**
 * Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts
 * the value back.
 */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Memory share" initialValue={40}>
      <Slider min={0} max={100} />
    </FormItemDemo>
  ),
};

/** Inside a `Form.Item` that validates when focus leaves the control. */
export const ValidateOnBlur: Story = {
  render: () => (
    <FormItemDemo label="Memory share" validateTrigger="onBlur">
      <Slider min={0} max={100} />
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the control. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Memory share" disabled initialValue={40}>
      <Slider min={0} max={100} />
    </FormItemDemo>
  ),
};
