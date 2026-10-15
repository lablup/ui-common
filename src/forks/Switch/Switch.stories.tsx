import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Form } from "../../components/Form";
import { Switch, type SwitchProps } from "./Switch";
import { useArgState } from "../../stories/helpers";

/** Holds the value, so toggling changes the control. */
function SwitchDemo(args: SwitchProps) {
  const [value, setValue] = useArgState<boolean>(args.value === true);
  return (
    <Switch
      {...args}
      value={value}
      onChange={(next, event) => {
        setValue(next);
        args.onChange?.(next, event);
      }}
    />
  );
}

const meta = {
  title: "Forks/Switch",
  component: Switch,
  args: { label: "Notifications", value: false, onChange: fn() },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  render: (args) => <SwitchDemo {...args} />,
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = {
  args: { value: true },
};

export const WithDescription: Story = {
  args: { description: "Email me when a session ends." },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const WithStatus: Story = {
  args: { status: { type: "error", message: "Required." } },
};

/**
 * The fork's fix: a passed `id` reaches the native checkbox, so the
 * `Form.Item` label names the control, and clicking it toggles the control.
 */
export const InFormItem: Story = {
  render: (args) => (
    <Form layout="vertical" initialValues={{ flag: false }}>
      <Form.Item label="Notifications" name="flag" valuePropName="value">
        <Switch {...args} isLabelHidden value={false} />
      </Form.Item>
    </Form>
  ),
};
