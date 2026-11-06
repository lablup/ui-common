import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { Form, type FormInstance } from "../Form";
import {
  DateTimeRangeInput,
  type DateTimeRangeInputPreset,
  type DateTimeRangeInputValue,
} from "./index";
import {
  DAY_MS,
  HOUR_MS,
  defaultEnd,
  formatValue,
  lastEndDay,
  rangeProblem,
  toDate,
} from "./dateTimeRange";

const range = (start: string, end: string) =>
  ({ start, end }) as DateTimeRangeInputValue;

const NOV_5 = range("2026-11-05T09:00", "2026-11-05T18:30");
const NOW = "2026-11-05T12:00" as never;

beforeEach(() => {
  // Only Date: "now" is 2026-11-05 12:00.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 5, 12, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

const startButton = () => screen.getByRole("button", { name: /^Period, Start date/ });
const endButton = () => screen.getByRole("button", { name: /^Period, End date/ });

const open = async (button = startButton()) => {
  await userEvent.click(button);
  return screen.findByRole("dialog", { name: "Choose date and time range" });
};

const day = (dialog: HTMLElement, label: string) =>
  within(dialog).getByRole("button", { name: new RegExp(`^\\w+, ${label}, 2026`) });

const option = (dialog: HTMLElement, column: "Hour" | "Minute", text: string) =>
  within(within(dialog).getByRole("listbox", { name: column })).getByRole("option", {
    name: text,
  });

const selected = (dialog: HTMLElement, column: "Hour" | "Minute") =>
  within(within(dialog).getByRole("listbox", { name: column }))
    .getAllByRole("option")
    .find((o) => o.getAttribute("aria-selected") === "true")?.textContent;

const confirm = (dialog: HTMLElement) =>
  within(dialog).getByRole("button", { name: "OK" });

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

  it("stops the end on the last day a capped range can reach", () => {
    expect(lastEndDay("2026-11-01T00:00", undefined, true)).toBeUndefined();
    expect(lastEndDay("2026-11-01T18:00", 7 * DAY_MS, true)).toBe("2026-11-08");
    expect(lastEndDay("2026-11-01T18:00", 2 * HOUR_MS, true)).toBe("2026-11-01");
    expect(lastEndDay("2026-11-30T23:00", 2 * HOUR_MS, true)).toBe("2026-12-01");
    // Dates only: 00:00 on the first day to 23:59 on the last must fit.
    expect(lastEndDay("2026-11-01T00:00", 7 * DAY_MS, false)).toBe("2026-11-07");
    expect(lastEndDay("2026-11-01T00:00", HOUR_MS, false)).toBe("2026-11-01");
  });

  it("ends a picked end day at 23:59, or now on today, within max and the cap", () => {
    const now = new Date(2026, 10, 5, 12, 0);
    const start = "2026-11-03T00:00" as never;
    expect(defaultEnd("2026-11-04" as never, start, {}, now)).toBe("2026-11-04T23:59");
    expect(defaultEnd("2026-11-05" as never, start, {}, now)).toBe("2026-11-05T12:00");
    expect(
      defaultEnd("2026-11-04" as never, start, { max: "2026-11-04T08:00" }, now),
    ).toBe("2026-11-04T08:00");
    expect(
      defaultEnd("2026-11-04" as never, start, { maxDuration: 30 * HOUR_MS }, now),
    ).toBe("2026-11-04T06:00");
  });

  it("formats an end as the trigger shows it", () => {
    expect(formatValue("2026-11-05T09:00", true)).toBe("2026-11-05 09:00");
    expect(formatValue("2026-11-05T09:00", false)).toBe("2026-11-05");
  });
});

describe("DateTimeRangeInput", () => {
  it("shows each end in its own part, with or without the time", () => {
    const { rerender } = render(
      <DateTimeRangeInput aria-label="Period" value={NOV_5} showTime />,
    );
    expect(startButton()).toHaveTextContent("2026-11-05 09:00");
    expect(endButton()).toHaveTextContent("2026-11-05 18:30");
    expect(startButton()).toHaveAccessibleName("Period, Start date: 2026-11-05 09:00");
    rerender(<DateTimeRangeInput aria-label="Period" value={NOV_5} />);
    expect(startButton()).toHaveTextContent(/^2026-11-05$/);
    expect(endButton()).toHaveTextContent(/^2026-11-05$/);
  });

  it("shows the placeholders when there is no range", () => {
    render(<DateTimeRangeInput aria-label="Period" />);
    expect(startButton()).toHaveTextContent("Start date");
    expect(endButton()).toHaveTextContent("End date");
  });

  it("opens on the end that was clicked and marks it as the one being edited", async () => {
    render(<DateTimeRangeInput aria-label="Period" value={NOV_5} showTime />);
    const dialog = await open(endButton());
    expect(endButton()).toHaveAttribute("aria-expanded", "true");
    expect(endButton()).toHaveClass("uic-date-time-range-input__end--active");
    expect(startButton()).toHaveAttribute("aria-expanded", "false");
    expect(within(dialog).getByRole("group", { name: "End time" })).toBeInTheDocument();
    expect(selected(dialog, "Hour")).toBe("18");
    expect(selected(dialog, "Minute")).toBe("30");
  });

  it("picks the start, confirms, picks the end, and commits both on confirm", async () => {
    const onChange = vi.fn();
    render(<DateTimeRangeInput aria-label="Period" onChange={onChange} showTime />);
    const dialog = await open();
    expect(confirm(dialog)).toBeDisabled();
    await userEvent.click(day(dialog, "November 3"));
    expect(selected(dialog, "Hour")).toBe("00");
    await userEvent.click(option(dialog, "Hour", "10"));
    await userEvent.click(option(dialog, "Minute", "15"));
    await userEvent.click(confirm(dialog));
    expect(onChange).not.toHaveBeenCalled();
    // On to the end: days before the start are off.
    expect(endButton()).toHaveAttribute("aria-expanded", "true");
    expect(day(dialog, "November 2")).toHaveAttribute("aria-disabled", "true");
    expect(confirm(dialog)).toBeDisabled();
    await userEvent.click(day(dialog, "November 4"));
    expect(selected(dialog, "Hour")).toBe("23");
    expect(selected(dialog, "Minute")).toBe("59");
    await userEvent.click(option(dialog, "Hour", "08"));
    await userEvent.click(option(dialog, "Minute", "45"));
    await userEvent.click(confirm(dialog));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-03T10:15", "2026-11-04T08:45"),
    );
    // Uncontrolled: it keeps what was committed.
    expect(startButton()).toHaveTextContent("2026-11-03 10:15");
    expect(endButton()).toHaveTextContent("2026-11-04 08:45");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("moves the start when another day is clicked before confirming", async () => {
    const onChange = vi.fn();
    render(<DateTimeRangeInput aria-label="Period" onChange={onChange} showTime />);
    const dialog = await open();
    await userEvent.click(day(dialog, "November 3"));
    await userEvent.click(day(dialog, "November 6"));
    expect(startButton()).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(confirm(dialog));
    expect(day(dialog, "November 5")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(day(dialog, "November 8"));
    await userEvent.click(confirm(dialog));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-06T00:00", "2026-11-08T23:59"),
    );
  });

  it("ends today at now", async () => {
    const onChange = vi.fn();
    render(<DateTimeRangeInput aria-label="Period" onChange={onChange} showTime />);
    const dialog = await open();
    await userEvent.click(day(dialog, "November 4"));
    await userEvent.click(confirm(dialog));
    await userEvent.click(day(dialog, "November 5"));
    await userEvent.click(confirm(dialog));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-04T00:00", "2026-11-05T12:00"),
    );
  });

  it("commits on the second day without showTime, with no time columns or confirm", async () => {
    const onChange = vi.fn();
    render(<DateTimeRangeInput aria-label="Period" onChange={onChange} />);
    const dialog = await open();
    expect(within(dialog).queryByRole("listbox")).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "OK" })).toBeNull();
    await userEvent.click(day(dialog, "November 2"));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(day(dialog, "November 4"));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-02T00:00", "2026-11-04T23:59"),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables days after max, and days beyond maxDuration from the start", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        onChange={onChange}
        showTime
        max={NOW}
        maxDuration={DAY_MS}
      />,
    );
    const dialog = await open();
    expect(day(dialog, "November 6")).toHaveAttribute("aria-disabled", "true");
    // The month of max is the right one of the two.
    expect(day(dialog, "October 20")).not.toHaveAttribute("aria-disabled");
    await userEvent.click(day(dialog, "November 2"));
    await userEvent.click(confirm(dialog));
    expect(day(dialog, "November 3")).not.toHaveAttribute("aria-disabled");
    expect(day(dialog, "November 4")).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps confirm disabled for a range longer than maxDuration or past max", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        onChange={onChange}
        showTime
        max={NOW}
        maxDuration={DAY_MS}
      />,
    );
    const dialog = await open();
    await userEvent.click(day(dialog, "November 4"));
    await userEvent.click(option(dialog, "Hour", "09"));
    await userEvent.click(confirm(dialog));
    await userEvent.click(day(dialog, "November 5"));
    // The default end is pulled back to the cap: 09:00 the next day.
    expect(selected(dialog, "Hour")).toBe("09");
    await userEvent.click(option(dialog, "Hour", "10"));
    expect(confirm(dialog)).toBeDisabled();
    await userEvent.click(option(dialog, "Hour", "13"));
    expect(confirm(dialog)).toBeDisabled();
    await userEvent.click(confirm(dialog));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(option(dialog, "Hour", "08"));
    await userEvent.click(confirm(dialog));
    expect(onChange).toHaveBeenCalledWith(
      range("2026-11-04T09:00", "2026-11-05T08:00"),
    );
  });

  it("keeps confirm disabled for an end that is not after the start", async () => {
    const onChange = vi.fn();
    render(<DateTimeRangeInput aria-label="Period" onChange={onChange} showTime />);
    const dialog = await open();
    await userEvent.click(day(dialog, "November 3"));
    await userEvent.click(option(dialog, "Hour", "18"));
    await userEvent.click(confirm(dialog));
    await userEvent.click(day(dialog, "November 3"));
    await userEvent.click(option(dialog, "Hour", "09"));
    expect(confirm(dialog)).toBeDisabled();
  });

  it("moves the time with the arrow keys", async () => {
    render(<DateTimeRangeInput aria-label="Period" value={NOV_5} showTime />);
    const dialog = await open();
    const hour = option(dialog, "Hour", "09");
    expect(hour).toHaveAttribute("tabindex", "0");
    hour.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(selected(dialog, "Hour")).toBe("11");
    expect(option(dialog, "Hour", "11")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(selected(dialog, "Hour")).toBe("00");
  });

  it("drops the draft on Escape", async () => {
    const onChange = vi.fn();
    render(
      <DateTimeRangeInput
        aria-label="Period"
        value={NOV_5}
        onChange={onChange}
        showTime
      />,
    );
    const dialog = await open();
    await userEvent.click(day(dialog, "November 2"));
    fireEvent.keyDown(day(dialog, "November 2"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(startButton()).toHaveTextContent("2026-11-05 09:00");
  });

  describe("presets", () => {
    const LAST_HOUR: DateTimeRangeInputPreset = {
      label: "Last 1 hour",
      getRange: () => range("2026-11-05T11:00", "2026-11-05T12:00"),
      isRelative: true,
    };

    it("commits a preset at once, passing it along", async () => {
      const onChange = vi.fn();
      render(
        <DateTimeRangeInput
          aria-label="Period"
          onChange={onChange}
          presets={[LAST_HOUR]}
        />,
      );
      const dialog = await open();
      const presets = within(dialog).getByRole("group", { name: "Preset ranges" });
      await userEvent.click(
        within(presets).getByRole("button", { name: "Last 1 hour" }),
      );
      expect(onChange).toHaveBeenCalledWith(
        range("2026-11-05T11:00", "2026-11-05T12:00"),
        LAST_HOUR,
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
          ]}
        />,
      );
      const dialog = await open();
      expect(
        within(dialog).getByRole("button", { name: "Last 24 hours" }),
      ).toHaveAttribute("aria-current", "true");
      const tooLong = within(dialog).getByRole("button", { name: "Last 30 days" });
      expect(tooLong).toBeDisabled();
      await userEvent.click(tooLong);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("shows a relative preset's label on a compact trigger, while the value keeps its length", async () => {
      function Rolling() {
        return (
          <DateTimeRangeInput
            aria-label="Period"
            size="sm"
            isCompactLabel
            presets={[LAST_HOUR]}
            showTime
          />
        );
      }
      render(<Rolling />);
      const dialog = await open();
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Last 1 hour" }),
      );
      const compact = screen.getByRole("button", { name: "Period: Last 1 hour" });
      expect(compact).toHaveTextContent("Last 1 hour");
      // Picking dates by hand shows the dates again.
      const reopened = await open(compact);
      await userEvent.click(day(reopened, "November 2"));
      await userEvent.click(confirm(reopened));
      await userEvent.click(day(reopened, "November 3"));
      await userEvent.click(confirm(reopened));
      expect(startButton()).toHaveTextContent("2026-11-02 00:00");
    });

    it("shows the dates for a relative preset without isCompactLabel", async () => {
      render(
        <DateTimeRangeInput
          aria-label="Period"
          defaultValue={LAST_HOUR.getRange()}
          presets={[LAST_HOUR]}
          showTime
        />,
      );
      expect(startButton()).toHaveTextContent("2026-11-05 11:00");
    });
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
    expect(startButton()).toHaveTextContent("Start date");
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
    expect(startButton()).toHaveAttribute("aria-disabled", "true");
    expect(endButton()).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(startButton());
    await userEvent.click(endButton());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("marks an error status invalid", () => {
    render(<DateTimeRangeInput aria-label="Period" status="error" />);
    expect(startButton()).toHaveAttribute("aria-invalid", "true");
    expect(endButton()).toHaveAttribute("aria-invalid", "true");
  });

  it("takes its strings from the catalog in the provider's locale", async () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <DateTimeRangeInput aria-label="기간" showTime />
      </InternationalizationProvider>,
    );
    const start = screen.getByRole("button", { name: /^기간, 시작 날짜/ });
    expect(start).toHaveTextContent("시작 날짜");
    await userEvent.click(start);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("listbox", { name: "시" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "확인" })).toBeInTheDocument();
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
            <DateTimeRangeInput showTime />
          </Form.Item>
        </Form>
      );
    }
    return render(<Harness />);
  }

  it("is named by the item's label and shows the item's value", () => {
    renderItem();
    expect(startButton()).toHaveAttribute("id", "period");
    expect(startButton()).toHaveTextContent("2026-11-05 09:00");
    expect(endButton()).toHaveTextContent("2026-11-05 18:30");
  });

  it("writes a committed range back to the form", async () => {
    const form: { current?: FormInstance } = {};
    renderItem({ form });
    const dialog = await open(endButton());
    await userEvent.click(option(dialog, "Hour", "20"));
    await userEvent.click(confirm(dialog));
    expect(form.current!.getFieldValue("period")).toEqual(
      range("2026-11-05T09:00", "2026-11-05T20:30"),
    );
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
    expect(startButton()).toHaveAttribute("aria-invalid", "true");
    expect(startButton()).toHaveAccessibleDescription(/Required/);
  });

  it("is disabled by <Form disabled>", () => {
    renderItem({ disabled: true });
    expect(startButton()).toHaveAttribute("aria-disabled", "true");
  });
});
