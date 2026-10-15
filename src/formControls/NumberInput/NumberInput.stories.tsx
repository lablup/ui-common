import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { NumberInput } from "./index";

/**
 * NumberInput inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function NumberInputForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="GPU count"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <NumberInput min={1} max={64} />
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/NumberInput",
  component: NumberInput,
  render: () => <NumberInputForm />,
} satisfies Meta<typeof NumberInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <NumberInputForm disabled />,
};
