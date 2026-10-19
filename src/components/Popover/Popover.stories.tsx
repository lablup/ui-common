import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { Form } from "../Form";
import { TextInput } from "../../formControls/TextInput";
import { Popover } from "./Popover";
import { overlayDocs, useOpenState } from "../../stories/helpers";

/**
 * Astryx's Popover with one difference: its content is not part of the
 * `Form.Item` it opens from. In `InFormItem`, submit the form empty: the item
 * shows its error, and the search field inside the popover stays clean.
 */
const meta = {
  title: "Components/Popover",
  component: Popover,
  args: {
    label: "Filter",
    isOpen: true,
    onOpenChange: fn(),
    content: <TextInput aria-label="Search users" placeholder="Search users" />,
    children: <Button label="Filter" />,
  },
  argTypes: {
    content: { control: false },
    children: { control: false },
  },
  parameters: overlayDocs("320px"),
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, (next) =>
      args.onOpenChange?.(next),
    );
    return <Popover {...args} isOpen={isOpen} onOpenChange={setOpen} />;
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InFormItem: Story = {
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, (next) =>
      args.onOpenChange?.(next),
    );
    return (
      <Form layout="vertical" style={{ maxWidth: 400 }}>
        <Form.Item
          label="Owner"
          name="owner"
          rules={[{ required: true, message: "Pick an owner." }]}
        >
          <Popover {...args} isOpen={isOpen} onOpenChange={setOpen} />
        </Form.Item>
        <Button type="submit" variant="primary" label="Submit" />
      </Form>
    );
  },
};
