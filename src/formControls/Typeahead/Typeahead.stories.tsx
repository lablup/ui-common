import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { Form } from "../../components/Form";
import { createStaticSource, Typeahead } from "./index";

const source = createStaticSource([
  { id: "ada", label: "Ada Lovelace" },
  { id: "alan", label: "Alan Turing" },
]);

/**
 * Typeahead inside `Form.Item`, the way ui-common's form controls are used: the item
 * owns the label, the help text and the message (src/formControls). Submit
 * empty to see the error state.
 */
function TypeaheadForm({ disabled }: { disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} style={{ maxWidth: 400 }}>
      <Form.Item
        label="Owner"
        name="field"
        extra="Help text comes from Form.Item's extra."
        rules={[{ required: true, message: "This field is required." }]}
      >
        <Typeahead searchSource={source} placeholder="Search people" />
      </Form.Item>
      <Button type="submit" variant="primary" label="Submit" />
    </Form>
  );
}

const meta = {
  title: "Form Controls/Typeahead",
  component: Typeahead,
  // Required by the props type; the render below supplies its own.
  args: { searchSource: source },
  render: () => <TypeaheadForm />,
} satisfies Meta<typeof Typeahead>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InFormItem: Story = {};

export const Disabled: Story = {
  render: () => <TypeaheadForm disabled />,
};
