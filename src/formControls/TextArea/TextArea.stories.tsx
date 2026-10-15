import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { TextArea } from "./index";

/**
 * TextArea inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function TextAreaForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Description"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <TextArea placeholder="What is this project for?" />
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/TextArea",
  component: TextArea,
  render: () => <TextAreaForm />,
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <TextAreaForm disabled />,
};
