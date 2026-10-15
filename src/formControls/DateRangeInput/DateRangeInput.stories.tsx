import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { DateRangeInput } from "./index";

/**
 * DateRangeInput inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function DateRangeInputForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Period"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <DateRangeInput />
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/DateRangeInput",
  component: DateRangeInput,
  render: () => <DateRangeInputForm />,
} satisfies Meta<typeof DateRangeInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <DateRangeInputForm disabled />,
};
