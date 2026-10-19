import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { FileInput, type FileInputProps } from "./FileInput";
import { useArgState } from "../../stories/helpers";

/** Holds the value, so picking files changes the control. */
function FileInputDemo(args: FileInputProps) {
  const [value, setValue] = useArgState<File | File[] | null>(args.value ?? null);
  return (
    <FileInput
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
}

/**
 * The fork's fix: `aria-describedby` and the focus handlers reach the trigger
 * button. `Hint` describes the trigger with a passed `aria-describedby`.
 */
const meta = {
  title: "Forks/FileInput",
  component: FileInput,
  args: { label: "Attachment", value: null, onChange: fn(), onBlur: fn() },
  render: (args) => <FileInputDemo {...args} />,
} satisfies Meta<typeof FileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { isMultiple: true, accept: "image/*" },
};

export const Hint: Story = {
  render: (args) => (
    <>
      <p id="file-hint">PNG or JPEG, up to 5 MB.</p>
      <FileInputDemo {...args} aria-describedby="file-hint" />
    </>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
};
