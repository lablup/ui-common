import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { PasswordInput } from "./index";
import {
  FormItemDemo,
  StatusesDemo,
  ValueReadout,
} from "../../stories/formControlStories";
import { withMaxWidth } from "../../stories/helpers";

/**
 * A password field with a show/hide toggle inside its trailing edge. On its
 * own it is named by `aria-label`; inside a `Form.Item` the item owns the
 * label, the help text and the message, as for ui-common's TextInput.
 */
const meta = {
  title: "Form Controls/PasswordInput",
  component: PasswordInput,
  args: {
    "aria-label": "Password",
    autoComplete: "current-password",
    onChange: fn(),
    onRevealedChange: fn(),
  },
  argTypes: {
    status: { control: "inline-radio", options: ["", "warning", "error"] },
  },
  decorators: [withMaxWidth(400)],
} satisfies Meta<typeof PasswordInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Masked, uncontrolled: the toggle shows and hides what is typed. */
export const Default: Story = {
  args: { defaultValue: "correct horse" },
};

/** Shown from the start, `defaultIsRevealed`. */
export const Revealed: Story = {
  args: { defaultValue: "correct horse", defaultIsRevealed: true },
};

/** A long password stops short of the toggle instead of running under it. */
export const LongPassword: Story = {
  args: {
    defaultValue: "a-very-long-passphrase-that-does-not-fit-the-field",
    defaultIsRevealed: true,
  },
};

/** The reveal state held by the caller, through `isRevealed` and `onRevealedChange`. */
export const ControlledReveal: Story = {
  render: function Render(args) {
    const [isRevealed, setIsRevealed] = useState(false);
    return (
      <>
        <PasswordInput
          {...args}
          defaultValue="correct horse"
          isRevealed={isRevealed}
          onRevealedChange={setIsRevealed}
        />
        <ValueReadout label="isRevealed" value={isRevealed} />
      </>
    );
  },
};

/** A border status, antd's `status`: no message. */
export const Statuses: Story = {
  render: (args) => (
    <StatusesDemo
      render={(status) => (
        <PasswordInput
          {...args}
          aria-label={`Password (${status})`}
          defaultValue="correct horse"
          status={status}
        />
      )}
    />
  ),
};

/** Disabled: masked, with the toggle disabled too. */
export const Disabled: Story = {
  args: { defaultValue: "correct horse", defaultIsRevealed: true, disabled: true },
};

/**
 * Inside a `Form.Item`: the item's label names the field, and a required rule
 * shows its one message when the form is submitted empty.
 */
export const InFormItem: Story = {
  render: () => (
    <FormItemDemo label="Password">
      <PasswordInput autoComplete="current-password" />
    </FormItemDemo>
  ),
};

/** Inside a disabled form: `<Form disabled>` disables the field and masks it. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Password" disabled initialValue="correct horse">
      <PasswordInput autoComplete="current-password" />
    </FormItemDemo>
  ),
};
