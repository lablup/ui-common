import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import {
  DateTimeRangeInput,
  type DateTimeRangeInputPreset,
  type DateTimeRangeInputProps,
  type DateTimeRangeInputValue,
} from "./DateTimeRangeInput";
import {
  FormItemDemo,
  StatusesDemo,
  ValueReadout,
} from "../../stories/formControlStories";
import { overlayDocs, useArgState } from "../../stories/helpers";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, "0");
/** A local `Date` as `YYYY-MM-DDTHH:MM`. */
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** The last `ms` up to now, to the minute. */
const last = (ms: number): DateTimeRangeInputValue => {
  const end = new Date();
  end.setSeconds(0, 0);
  return {
    start: iso(new Date(end.getTime() - ms)),
    end: iso(end),
  } as DateTimeRangeInputValue;
};

const PRESETS: DateTimeRangeInputPreset[] = [
  { label: "Last 1 hour", getRange: () => last(HOUR) },
  { label: "Last 24 hours", getRange: () => last(DAY) },
  { label: "Last 7 days", getRange: () => last(7 * DAY) },
  { label: "Last 30 days", getRange: () => last(30 * DAY) },
];

/** Holds the range in state, as a caller does. */
function ControlledRange(args: DateTimeRangeInputProps) {
  const [value, setValue] = useArgState(args.value);
  return (
    <>
      <DateTimeRangeInput
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
      <ValueReadout value={value} />
    </>
  );
}

/**
 * A start and an end, each a date and a time, picked in one popover: the
 * calendar for the dates, a time field for each end, presets beside them.
 * Apply commits the draft; a range that breaks `min`, `max` or `maxDuration`
 * says why and cannot be applied.
 */
const meta = {
  title: "Components/DateTimeRangeInput",
  component: DateTimeRangeInput,
  args: { "aria-label": "Period", onChange: fn() },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    hourFormat: { control: "inline-radio", options: [undefined, "12h", "24h"] },
    status: { control: "inline-radio", options: ["", "warning", "error"] },
    numberOfMonths: { control: "inline-radio", options: [1, 2] },
  },
  parameters: overlayDocs("520px"),
} satisfies Meta<typeof DateTimeRangeInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled: no `value`, so it keeps what is applied. */
export const Default: Story = {};

/** Controlled through `value` and `onChange`. */
export const Controlled: Story = {
  args: { value: last(6 * HOUR), hourFormat: "24h" },
  render: (args) => <ControlledRange {...args} />,
};

/** Relative presets, with a 7-day cap: "Last 30 days" is disabled. */
export const WithPresets: Story = {
  args: { presets: PRESETS, maxDuration: 7 * DAY, hourFormat: "24h" },
  render: (args) => <ControlledRange {...args} />,
};

/**
 * Bounded: nothing before 30 days ago, nothing after now, at most 7 days long.
 * Pick a longer range to see the message.
 */
export const Bounded: Story = {
  args: {
    min: last(30 * DAY).start,
    max: last(0).end,
    maxDuration: 7 * DAY,
    presets: PRESETS,
  },
  render: (args) => <ControlledRange {...args} />,
};

/** Two months in the calendar. */
export const TwoMonths: Story = {
  args: { numberOfMonths: 2, presets: PRESETS },
};

/** The three sizes. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <DateTimeRangeInput
          key={size}
          {...args}
          aria-label={`Period (${size})`}
          size={size}
          defaultValue={last(DAY)}
        />
      ))}
    </div>
  ),
};

/** A border status, with no message: the message belongs to `Form.Item`. */
export const Statuses: Story = {
  render: (args) => (
    <StatusesDemo
      render={(status) => (
        <DateTimeRangeInput
          {...args}
          aria-label={`Period (${status})`}
          status={status}
        />
      )}
    />
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: last(DAY) },
};

/** Inside a `Form.Item`: the item's label names it, a required rule checks it. */
export const InFormItem: Story = {
  render: () => (
    <FormItemDemo label="Period">
      <DateTimeRangeInput presets={PRESETS} />
    </FormItemDemo>
  ),
};

/** Inside a `Form.Item`, starting from the form's `initialValues`. */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Period" initialValue={last(DAY)}>
      <DateTimeRangeInput presets={PRESETS} />
    </FormItemDemo>
  ),
};

/** Inside a disabled form. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Period" disabled initialValue={last(DAY)}>
      <DateTimeRangeInput />
    </FormItemDemo>
  ),
};
