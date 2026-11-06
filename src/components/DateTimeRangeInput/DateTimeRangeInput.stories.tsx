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
const now = () => last(0).end;

const PRESETS: DateTimeRangeInputPreset[] = [
  { label: "Last 1 hour", getRange: () => last(HOUR), isRelative: true },
  { label: "Last 24 hours", getRange: () => last(DAY), isRelative: true },
  { label: "Last 7 days", getRange: () => last(7 * DAY), isRelative: true },
  { label: "Last 30 days", getRange: () => last(30 * DAY), isRelative: true },
];

/** Holds the range in state, as a caller does. */
function ControlledRange(args: DateTimeRangeInputProps) {
  const [value, setValue] = useArgState(args.value);
  return (
    <>
      <DateTimeRangeInput
        {...args}
        value={value}
        onChange={(next, preset) => {
          setValue(next);
          args.onChange?.(next, preset);
        }}
      />
      <ValueReadout value={value} />
    </>
  );
}

/**
 * A start and an end, each a date and a time, modeled on Ant Design's
 * `RangePicker`. Click an end to open the popover on it: presets, two months,
 * and with `showTime` hour and minute columns and a confirm button that moves
 * from the start to the end, then commits both.
 */
const meta = {
  title: "Components/DateTimeRangeInput",
  component: DateTimeRangeInput,
  args: { "aria-label": "Period", onChange: fn() },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    status: { control: "inline-radio", options: ["", "warning", "error"] },
  },
  parameters: overlayDocs("520px"),
} satisfies Meta<typeof DateTimeRangeInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On its own and uncontrolled, dates only: two day clicks commit. */
export const Default: Story = {};

/** With hour and minute columns; confirm moves to the end, then commits. */
export const WithTime: Story = {
  args: { showTime: true },
};

/** Controlled through `value` and `onChange`. */
export const Controlled: Story = {
  args: { value: last(6 * HOUR), showTime: true },
  render: (args) => <ControlledRange {...args} />,
};

/**
 * Relative presets, up to now and at most 7 days long: "Last 30 days" is
 * disabled, days after now are off, and once a start is picked so are days
 * more than 7 days after it.
 */
export const WithPresets: Story = {
  args: { presets: PRESETS, showTime: true, max: now(), maxDuration: 7 * DAY },
  render: (args) => <ControlledRange {...args} />,
};

/**
 * Small, for a card header: a relative preset shows its label instead of
 * the dates.
 */
export const CompactLabel: Story = {
  args: {
    presets: PRESETS,
    showTime: true,
    size: "sm",
    isCompactLabel: true,
    max: now(),
    maxDuration: 7 * DAY,
  },
  render: (args) => <ControlledRange {...args} />,
};

/** The two sizes. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      {(["sm", "md"] as const).map((size) => (
        <DateTimeRangeInput
          key={size}
          {...args}
          aria-label={`Period (${size})`}
          size={size}
          showTime
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
  args: { isDisabled: true, showTime: true, defaultValue: last(DAY) },
};

/** Inside a `Form.Item`: the item's label names it, a required rule checks it. */
export const InFormItem: Story = {
  render: () => (
    <FormItemDemo label="Period">
      <DateTimeRangeInput presets={PRESETS} showTime />
    </FormItemDemo>
  ),
};

/** Inside a `Form.Item`, starting from the form's `initialValues`. */
export const InFormItemWithValue: Story = {
  render: () => (
    <FormItemDemo label="Period" initialValue={last(DAY)}>
      <DateTimeRangeInput presets={PRESETS} showTime />
    </FormItemDemo>
  ),
};

/** Inside a disabled form. */
export const FormDisabled: Story = {
  render: () => (
    <FormItemDemo label="Period" disabled initialValue={last(DAY)}>
      <DateTimeRangeInput showTime />
    </FormItemDemo>
  ),
};
