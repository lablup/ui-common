import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { Tokenizer } from "./index";
import { createStaticSource } from "../Typeahead";

const source = createStaticSource([
  { id: "ada", label: "Ada Lovelace" },
  { id: "alan", label: "Alan Turing" },
]);

/**
 * Tokenizer inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function TokenizerForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Members"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <Tokenizer searchSource={source} placeholder="Add people" />
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/Tokenizer",
  component: Tokenizer,
  // Required by the props type; the render below supplies its own.
  args: { searchSource: source },
  render: () => <TokenizerForm />,
} satisfies Meta<typeof Tokenizer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <TokenizerForm disabled />,
};
