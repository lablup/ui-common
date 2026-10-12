import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { VStack } from "../../astryx/Stack";
import { Text } from "../../astryx/Text";
import { UncontrolledInput, type UncontrolledInputProps } from "./UncontrolledInput";
import { useArgState, withMaxWidth } from "../../stories/helpers";

/** Shows the last committed value, so it is visible that typing alone commits nothing. */
function WithCommittedValue(args: UncontrolledInputProps) {
  const [committed, setCommitted] = useArgState(args.defaultValue ?? "");
  return (
    <VStack gap={2} align="stretch">
      <UncontrolledInput
        {...args}
        onCommit={(value) => {
          setCommitted(value);
          args.onCommit?.(value);
        }}
      />
      <Text color="secondary">Committed: {committed || "(empty)"}</Text>
    </VStack>
  );
}

const meta = {
  title: "Components/UncontrolledInput",
  component: UncontrolledInput,
  args: {
    label: "Display name",
    defaultValue: "Weekly report",
    onCommit: fn(),
  },
  argTypes: {
    type: { control: "inline-radio", options: ["text", "number", "password", "email"] },
  },
  decorators: [withMaxWidth(320)],
  render: (args) => <WithCommittedValue {...args} />,
} satisfies Meta<typeof UncontrolledInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NumberType: Story = {
  args: { label: "Page size", type: "number", defaultValue: "20" },
};

export const WithoutLabel: Story = {
  args: { label: undefined, placeholder: "Search items", defaultValue: "" },
};

export const WithError: Story = {
  args: {
    label: "Email",
    type: "email",
    defaultValue: "not-an-email",
    status: { type: "error", message: "Enter a valid email address." },
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};
