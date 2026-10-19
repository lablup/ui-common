import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { TagsInput } from "./index";

/**
 * TagsInput inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). A comma
 * or a space ends a tag; submit empty to see the error state.
 */
function TagsInputForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Ports"
        name="field"
        extra="Separate values with a comma or a space."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <TagsInput tokenSeparators={[",", " "]} placeholder="8080" />
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/TagsInput",
  component: TagsInput,
  render: () => <TagsInputForm />,
} satisfies Meta<typeof TagsInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <TagsInputForm disabled />,
};
