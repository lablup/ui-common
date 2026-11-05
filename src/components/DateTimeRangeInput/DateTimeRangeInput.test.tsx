import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { Form, type FormInstance } from "../Form";
import { DateTimeRangeInput, type DateTimeRangeInputValue } from "./index";
import {
  DAY_MS,
  HOUR_MS,
  formatDuration,
  maxSpanDays,
  rangeProblem,
  toDate,
} from "./dateTimeRange";

const range = (start: string, end: string) =>
  ({ start, end }) as DateTimeRangeInputValue;

const NOV_5 = range("2026-11-05T09:00", "2026-11-05T18:30");

beforeEach(() => {
  // Only Date: "today" is 2026-11-05, so the calendar opens on November 2026
  // and the trigger leaves this year out.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 5, 12, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

const trigger = (name: string | RegExp = /^Period:/) =>
  screen.getByRole("button", { name });

const open = async () => {
  await userEvent.click(trigger());
  return screen.findByRole("dialog", { name: "Choose date and time range" });
};

const day = (dialog: HTMLElement, label: string) =>
  within(dialog).getByRole("button", { name: new RegExp(`^\\w+, ${label}, 2026`) });

const setTime = async (dialog: HTMLElement, label: string, text: string) => {
  const input = within(dialog).getByRole("textbox", { name: label });
  await userEvent.clear(input);
  await userEvent.type(input, `${text}{Enter}`);
};

describe("dateTimeRange", () => {
  it("reads a date-time to the minute, in local time", () => {
    expect(toDate("2026-11-05T09:30:59")).toEqual(new Date(2026, 10, 5, 9, 30));
    expect(toDate("2026-11-05")).toBeNull();
    expect(toDate(undefined)).toBeNull();
  });

  it("names the first problem of a range", () => {
    const bounds = {
      min: "2026-11-01T00:00",
      max: "2026-11-30T00:00",
      maxDuration: DAY_MS,
    };
    expect(rangeProblem(range("2026-11-05T09:00", "2026-11-05T09:00"), bounds)).toBe(
      "endBeforeStart",
    );
    expect(rangeProblem(range("2026-10-31T23:00", "2026-11-01T01:00"), bounds)).toBe(
      "beforeMin",
    );
    expect(rangeProblem(range("2026-11-29T23:00", "2026-11-30T01:00"), bounds)).toBe(
      "afterMax",
    );
    expect(rangeProblem(range("2026-11-05T09:00", "2026-11-06T09:01"), bounds)).toBe(
      "tooLong",
    );
    expect(
      rangeProblem(range("2026-11-05T09:00", "2026-11-06T09:00"), bounds),
    ).toBeNull();
  });

  it("lets the calendar reach every day a capped range can touch", () => {
    expect(maxSpanDays(undefined)).toBeUndefined();
    expect(maxSpanDays(2 * HOUR_MS)).toBe(2);
    expect(maxSpanDays(7 * DAY_MS)).toBe(8);
  });

  it("states a duration in its largest whole unit", () => {
    expect(formatDuration(7 * DAY_MS, "en-US")).toBe("7 days");
    expect(formatDuration(DAY_MS, "en-US")).toBe("1 day");
    expect(formatDuration(36 * HOUR_MS, "en-US")).toBe("36 hours");
    expect(formatDuration(90 * 60_000, "en-US")).toBe("90 minutes");
  });
});

describe("DateTimeRangeInput", () => {
  it("shows the range compactly on the trigger, with the year only when it is not this year", () => {
    const { rerender } = render(
      <DateTimeRangeInput aria-label="Period" value={NOV_5} hourFormat="24h" />,
    );
    expect(trigger()).toHaveTextContent("Nov 5, 09:00 - Nov 5, 18:30");
    expect(trigger()).toHaveAccessibleName("Period: Nov 5, 09:00 - Nov 5, 18:30");
    rerender(
      <DateTimeRangeInput
        aria-label="Period"
        value={range("2025-12-31T22:00", "2026-01-01T02:00")}
        hourFormat="24h"
      />,
    );
    expect(trigger()).toHaveTextContent("Dec 31, 2025, 22:00 - Jan 1, 2026, 02:00");
  });

  it("shows the placeholder when there is no range", () => {
    render(<DateTimeRangeInput aria-label="Period" />);
    expect(trigger()).toHaveTextContent("Select date and time range");
  });

  it("picks dates on the calendar and times in the time fields, applied together", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput aria-label="Period" onChange={onChange} hourFormat="24h" />,
    );
    const dialog = await open();
    await userEvent.click(day(dialog, "November 3"));
    await userEvent.click(day(dialog, "November 4"));
    await setTime(dialog, "Start time", "10:15");
    await setTime(dialog, "End time", "08:45");
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-03T10:15", "2026-11-04T08:45"),
    );
    // Uncontrolled: it keeps what was applied.
    expect(trigger()).toHaveTextContent("Nov 3, 10:15 - Nov 4, 08:45");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("starts the draft from the value and drops it on Cancel", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput aria-label="Period" value={NOV_5} onChange={onChange} />,
    );
    const dialog = await open();
    expect(within(dialog).getByRole("textbox", { name: "Start time" })).toHaveValue(
      "9:00 AM",
    );
    await userEvent.click(day(dialog, "November 2"));
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("Nov 5, 09:00 AM - Nov 5, 06:30 PM");
  });

  it("applies a preset at once", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        onChange={onChange}
        presets={[
          {
            label: "Last 1 hour",
            getRange: () => range("2026-11-05T11:00", "2026-11-05T12:00"),
          },
        ]}
      />,
    );
    const dialog = await open();
    const presets = within(dialog).getByRole("group", { name: "Preset ranges" });
    await userEvent.click(within(presets).getByRole("button", { name: "Last 1 hour" }));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-05T11:00", "2026-11-05T12:00"),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("marks the preset that matches the value and disables one that breaks the bounds", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        value={range("2026-11-04T12:00", "2026-11-05T12:00")}
        onChange={onChange}
        min={"2026-10-01T00:00" as never}
        maxDuration={7 * DAY_MS}
        presets={[
          {
            label: "Last 24 hours",
            getRange: () => range("2026-11-04T12:00", "2026-11-05T12:00"),
          },
          {
            label: "Last 30 days",
            getRange: () => range("2026-10-06T12:00", "2026-11-05T12:00"),
          },
          {
            label: "Last 90 days",
            getRange: () => range("2026-08-07T12:00", "2026-11-05T12:00"),
          },
        ]}
      />,
    );
    const dialog = await open();
    expect(
      within(dialog).getByRole("button", { name: "Last 24 hours" }),
    ).toHaveAttribute("aria-current", "true");
    const tooLong = within(dialog).getByRole("button", { name: "Last 30 days" });
    const beforeMin = within(dialog).getByRole("button", { name: "Last 90 days" });
    for (const preset of [tooLong, beforeMin]) {
      expect(preset).toBeDisabled();
      await userEvent.click(preset);
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("refuses a range longer than maxDuration, saying how long it may be", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        onChange={onChange}
        maxDuration={DAY_MS}
      />,
    );
    const dialog = await open();
    await userEvent.click(day(dialog, "November 3"));
    await userEvent.click(day(dialog, "November 4"));
    // 00:00 to 23:59 the next day: almost two days.
    expect(
      within(dialog).getByText("The range can be at most 1 day long."),
    ).toBeVisible();
    const apply = within(dialog).getByRole("button", { name: "Apply" });
    expect(apply).toBeDisabled();
    await userEvent.click(apply);
    expect(onChange).not.toHaveBeenCalled();
    // Beyond the cap the calendar stops: a range touches at most two days.
    await userEvent.click(day(dialog, "November 3"));
    expect(day(dialog, "November 5")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(day(dialog, "November 4"));
    await setTime(dialog, "Start time", "18:00");
    await setTime(dialog, "End time", "06:00");
    expect(within(dialog).queryByText(/at most/)).toBeNull();
    await userEvent.click(apply);
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-03T18:00", "2026-11-04T06:00"),
    );
  });

  it("refuses an end before the start", async () => {
    const onChange = vi.fn();
    render(<DateTimeRangeInput aria-label="Period" onChange={onChange} />);
    const dialog = await open();
    await userEvent.click(day(dialog, "November 5"));
    await userEvent.click(day(dialog, "November 5"));
    await setTime(dialog, "Start time", "18:00");
    await setTime(dialog, "End time", "09:00");
    expect(within(dialog).getByText("The end must be after the start.")).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("refuses a range outside min and max, and keeps days outside them off the calendar", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        onChange={onChange}
        hourFormat="24h"
        min={"2026-11-03T08:00" as never}
        max={"2026-11-06T20:00" as never}
      />,
    );
    const dialog = await open();
    expect(day(dialog, "November 2")).toHaveAttribute("aria-disabled", "true");
    expect(day(dialog, "November 7")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(day(dialog, "November 3"));
    await userEvent.click(day(dialog, "November 4"));
    // The default start, 00:00, is before 08:00 on the first allowed day.
    expect(
      within(dialog).getByText("The range cannot start before Nov 3, 08:00."),
    ).toBeVisible();
    await setTime(dialog, "Start time", "08:00");
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-03T08:00", "2026-11-04T23:59"),
    );
  });

  it("clears the range", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        defaultValue={NOV_5}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear Period" }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(trigger()).toHaveTextContent("Select date and time range");
    expect(screen.queryByRole("button", { name: "Clear Period" })).toBeNull();
  });

  it("offers no clear button with hasClear={false}, or while disabled", () => {
    const { rerender } = render(
      <DateTimeRangeInput aria-label="Period" value={NOV_5} hasClear={false} />,
    );
    expect(screen.queryByRole("button", { name: "Clear Period" })).toBeNull();
    rerender(<DateTimeRangeInput aria-label="Period" value={NOV_5} isDisabled />);
    expect(screen.queryByRole("button", { name: "Clear Period" })).toBeNull();
  });

  it("does not open while disabled", async () => {
    render(<DateTimeRangeInput aria-label="Period" isDisabled />);
    expect(trigger()).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(trigger());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("paints the status border and marks an error invalid", () => {
    render(<DateTimeRangeInput aria-label="Period" status="error" />);
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
  });

  it("takes its strings from the catalog in the provider's locale", async () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <DateTimeRangeInput aria-label="기간" />
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("button", { name: /^기간:/ })).toHaveTextContent(
      "날짜 및 시간 범위 선택",
    );
  });
});

describe("DateTimeRangeInput in Form.Item", () => {
  function renderItem({
    disabled,
    required,
    form,
  }: {
    disabled?: boolean;
    required?: boolean;
    form?: { current?: FormInstance };
  } = {}) {
    function Harness() {
      const [instance] = Form.useForm();
      if (form) form.current = instance;
      return (
        <Form form={instance} disabled={disabled} initialValues={{ period: NOV_5 }}>
          <Form.Item
            label="Period"
            name="period"
            rules={required ? [{ required: true, message: "Pick a period." }] : []}
          >
            <DateTimeRangeInput hourFormat="24h" />
          </Form.Item>
        </Form>
      );
    }
    return render(<Harness />);
  }

  it("is named by the item's label and shows the item's value", () => {
    renderItem();
    expect(trigger()).toHaveAttribute("id", "period");
    expect(trigger()).toHaveTextContent("Nov 5, 09:00 - Nov 5, 18:30");
  });

  it("writes a clear back to the form", async () => {
    const form: { current?: FormInstance } = {};
    renderItem({ form });
    await userEvent.click(screen.getByRole("button", { name: "Clear Period" }));
    expect(form.current!.getFieldValue("period")).toBeNull();
  });

  it("marks itself invalid when the item fails, and announces required", async () => {
    const form: { current?: FormInstance } = {};
    renderItem({ required: true, form });
    await userEvent.click(screen.getByRole("button", { name: "Clear Period" }));
    await act(async () => {
      await form.current!.validateFields().catch(() => {});
    });
    expect(screen.getAllByText("Pick a period.")).toHaveLength(1);
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAccessibleDescription(/Required/);
  });

  it("is disabled by <Form disabled>", () => {
    renderItem({ disabled: true });
    expect(trigger()).toHaveAttribute("aria-disabled", "true");
  });
});
