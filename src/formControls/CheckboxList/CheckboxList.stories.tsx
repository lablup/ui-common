import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { CheckboxListItem, CheckboxList } from "./index";

/**
 * CheckboxList inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function CheckboxListForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Resources"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <CheckboxList>
          <CheckboxListItem value="cpu" label="CPU" />
          <CheckboxListItem value="gpu" label="GPU" />
        </CheckboxList>
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/CheckboxList",
  component: CheckboxList,
  // Required by the props type; the render below supplies its own.
  args: { children: null },
  render: () => <CheckboxListForm />,
} satisfies Meta<typeof CheckboxList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <CheckboxListForm disabled />,
};
