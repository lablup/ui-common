import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { Selector } from "./index";

const OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
];

/**
 * Selector inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function SelectorForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Region"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <Selector options={OPTIONS} placeholder="Select a region" />
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/Selector",
  component: Selector,
  // Required by the props type; the render below supplies its own.
  args: { options: OPTIONS },
  render: () => <SelectorForm />,
} satisfies Meta<typeof Selector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <SelectorForm disabled />,
};
