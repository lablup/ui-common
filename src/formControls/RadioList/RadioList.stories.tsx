import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { RadioListItem, RadioList } from "./index";

/**
 * RadioList inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function RadioListForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Visibility"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <RadioList>
          <RadioListItem value="private" label="Private" />
          <RadioListItem value="shared" label="Shared" />
        </RadioList>
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/RadioList",
  component: RadioList,
  // Required by the props type; the render below supplies its own.
  args: { children: null },
  render: () => <RadioListForm />,
} satisfies Meta<typeof RadioList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <RadioListForm disabled />,
};
