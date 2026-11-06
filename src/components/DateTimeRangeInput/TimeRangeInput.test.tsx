import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { Form, type FormInstance } from "../Form";
import { TimeRangeInput, type TimeRangeInputValue } from "./TimeRangeInput";

const range = (start: string, end: string) => ({ start, end }) as TimeRangeInputValue;
const WORK = range("09:00", "18:30");

const startButton = () => screen.getByRole("button", { name: /^Hours, Start time/ });
const endButton = () => screen.getByRole("button", { name: /^Hours, End time/ });

const open = async (button = startButton()) => {
  await userEvent.click(button);
  return screen.findByRole("dialog", { name: "Choose time range" });
};

const option = (dialog: HTMLElement, column: string, text: string) =>
  within(within(dialog).getByRole("listbox", { name: column })).getByRole("option", {
    name: text,
  });

const selected = (dialog: HTMLElement, column: string) =>
  within(within(dialog).getByRole("listbox", { name: column }))
    .getAllByRole("option")
    .find((o) => o.getAttribute("aria-selected") === "true")?.textContent;

const confirm = (dialog: HTMLElement) =>
  within(dialog).getByRole("button", { name: "OK" });

describe("TimeRangeInput", () => {
  it("shows each end in its own part, or the placeholders", () => {
    const { rerender } = render(<TimeRangeInput aria-label="Hours" value={WORK} />);
    expect(startButton()).toHaveTextContent("09:00");
    expect(endButton()).toHaveTextContent("18:30");
    rerender(<TimeRangeInput aria-label="Hours" value={null} />);
    expect(startButton()).toHaveTextContent("Start time");
    expect(endButton()).toHaveTextContent("End time");
  });

  it("picks the start, confirms, picks the end, and commits both", async () => {
    const onChange = vi.fn();
    render(<TimeRangeInput aria-label="Hours" onChange={onChange} />);
    const dialog = await open();
    expect(within(dialog).queryByRole("grid")).toBeNull();
    expect(confirm(dialog)).toBeDisabled();
    await userEvent.click(option(dialog, "Hour", "09"));
    await userEvent.click(option(dialog, "Minute", "30"));
    expect(startButton()).toHaveTextContent("09:30");
    await userEvent.click(confirm(dialog));
    expect(endButton()).toHaveAttribute("aria-expanded", "true");
    // The end must be after the start.
    expect(option(dialog, "Hour", "08")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(option(dialog, "Hour", "17"));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(confirm(dialog));
    expect(onChange).toHaveBeenCalledWith(range("09:30", "17:00"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(endButton()).toHaveTextContent("17:00");
  });

  it("puts an end on the start's hour after the start's minute", async () => {
    render(<TimeRangeInput aria-label="Hours" />);
    const dialog = await open();
    await userEvent.click(option(dialog, "Hour", "09"));
    await userEvent.click(option(dialog, "Minute", "30"));
    await userEvent.click(confirm(dialog));
    await userEvent.click(option(dialog, "Hour", "09"));
    expect(selected(dialog, "Minute")).toBe("31");
    expect(option(dialog, "Minute", "30")).toHaveAttribute("aria-disabled", "true");
  });

  it("opens on the end that was clicked", async () => {
    render(<TimeRangeInput aria-label="Hours" value={WORK} />);
    const dialog = await open(endButton());
    expect(within(dialog).getByRole("group", { name: "End time" })).toBeInTheDocument();
    expect(selected(dialog, "Hour")).toBe("18");
    expect(selected(dialog, "Minute")).toBe("30");
  });

  it("moves the panel under the end part while the end is edited", async () => {
    render(<TimeRangeInput aria-label="Hours" value={WORK} />);
    // jsdom has no layout: put the end part 96px into the box.
    const box = startButton().parentElement!;
    box.getBoundingClientRect = () => ({ left: 100, right: 300 }) as DOMRect;
    endButton().getBoundingClientRect = () => ({ left: 196, right: 240 }) as DOMRect;
    const dialog = await open(endButton());
    const layer = (el: HTMLElement): HTMLElement =>
      el.parentElement && !el.style.marginInlineStart ? layer(el.parentElement) : el;
    expect(layer(dialog).style.marginInlineStart).toBe("96px");
    await userEvent.click(startButton());
    expect(screen.queryByRole("dialog")).not.toBeNull();
    expect(
      within(document.body)
        .getByRole("dialog")
        .closest("[style*='margin-inline-start']"),
    ).toBeNull();
  });

  it("drops the draft on Escape", async () => {
    const onChange = vi.fn();
    render(<TimeRangeInput aria-label="Hours" value={WORK} onChange={onChange} />);
    const dialog = await open();
    await userEvent.click(option(dialog, "Hour", "07"));
    fireEvent.keyDown(option(dialog, "Hour", "07"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(startButton()).toHaveTextContent("09:00");
  });

  describe("12-hour clock", () => {
    it("shows the times with AM / PM and picks the period in its own column", async () => {
      const onChange = vi.fn();
      render(
        <TimeRangeInput
          aria-label="Hours"
          hourFormat="12h"
          defaultValue={WORK}
          onChange={onChange}
        />,
      );
      expect(startButton()).toHaveTextContent("9:00 AM");
      expect(endButton()).toHaveTextContent("6:30 PM");
      const dialog = await open(endButton());
      expect(selected(dialog, "Hour")).toBe("06");
      expect(selected(dialog, "AM/PM")).toBe("PM");
      expect(
        within(within(dialog).getByRole("listbox", { name: "Hour" })).getAllByRole(
          "option",
        ),
      ).toHaveLength(12);
      await userEvent.click(option(dialog, "Hour", "12"));
      expect(endButton()).toHaveTextContent("12:30 PM");
      // AM still has times after the 9:00 AM start (9:01 to 11:59).
      expect(option(dialog, "AM/PM", "AM")).not.toHaveAttribute("aria-disabled");
      await userEvent.click(confirm(dialog));
      expect(onChange).toHaveBeenCalledWith(range("09:00", "12:30"));
    });

    it("greys a period that has no time after the start", async () => {
      render(
        <TimeRangeInput
          aria-label="Hours"
          hourFormat="12h"
          defaultValue={range("13:00", "18:00")}
        />,
      );
      const dialog = await open(endButton());
      expect(option(dialog, "AM/PM", "AM")).toHaveAttribute("aria-disabled", "true");
    });
  });

  it("clears, and stays shut while disabled", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TimeRangeInput aria-label="Hours" defaultValue={WORK} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear Hours" }));
    expect(onChange).toHaveBeenCalledWith(null);
    rerender(<TimeRangeInput aria-label="Hours" isDisabled />);
    await userEvent.click(startButton());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("takes its strings from the catalog in the provider's locale", async () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <TimeRangeInput aria-label="시간" hourFormat="12h" />
      </InternationalizationProvider>,
    );
    const start = screen.getByRole("button", { name: /^시간, 시작 시간/ });
    await userEvent.click(start);
    const dialog = await screen.findByRole("dialog", { name: "시간 범위 지정" });
    expect(
      within(dialog).getByRole("listbox", { name: "오전/오후" }),
    ).toBeInTheDocument();
  });

  it("works in a Form.Item", async () => {
    const form: { current?: FormInstance } = {};
    function Harness() {
      const [instance] = Form.useForm();
      form.current = instance;
      return (
        <Form form={instance} initialValues={{ hours: WORK }}>
          <Form.Item label="Hours" name="hours" rules={[{ required: true }]}>
            <TimeRangeInput />
          </Form.Item>
        </Form>
      );
    }
    render(<Harness />);
    expect(startButton()).toHaveAttribute("id", "hours");
    expect(startButton()).toHaveAccessibleDescription(/Required/);
    const dialog = await open(endButton());
    await userEvent.click(option(dialog, "Hour", "20"));
    await act(async () => {
      await userEvent.click(confirm(dialog));
    });
    expect(form.current!.getFieldValue("hours")).toEqual(range("09:00", "20:30"));
  });
});
