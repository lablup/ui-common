/**
 * `onOpenChange`, which the wrapper adds to Astryx's Selector the way
 * MultiSelector has it: called on every open and close, however it happened.
 */
import { createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Form } from "../../components/Form";
import { Selector } from "./Selector";

beforeEach(() => {
  // jsdom has no Popover API; the selectors' surfaces call it on mount.
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
});

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("Selector onOpenChange", () => {
  it("is called when the trigger opens and closes the panel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Selector aria-label="Sort" options={OPTIONS} onOpenChange={onOpenChange} />,
    );
    const trigger = screen.getByRole("combobox", { name: "Sort" });
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(trigger);
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("is called when the keyboard opens the panel and Escape closes it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Selector aria-label="Sort" options={OPTIONS} onOpenChange={onOpenChange} />,
    );
    act(() => screen.getByRole("combobox", { name: "Sort" }).focus());

    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));

    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("is called when choosing an option closes the panel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onChange = vi.fn();
    render(
      <Selector
        aria-label="Sort"
        options={OPTIONS}
        onChange={onChange}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));

    await user.click(screen.getByRole("option", { name: "Beta", hidden: true }));
    expect(onChange).toHaveBeenCalledWith("b");
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
  });

  it("reports a panel isDefaultOpen opened on mount", async () => {
    const onOpenChange = vi.fn();
    render(
      <Selector
        aria-label="Sort"
        options={OPTIONS}
        isDefaultOpen
        onOpenChange={onOpenChange}
      />,
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("calls the latest callback", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <Selector aria-label="Sort" options={OPTIONS} onOpenChange={first} />,
    );
    rerender(<Selector aria-label="Sort" options={OPTIONS} onOpenChange={second} />);
    await user.click(screen.getByRole("combobox", { name: "Sort" }));
    await waitFor(() => expect(second).toHaveBeenCalledWith(true));
    expect(first).not.toHaveBeenCalled();
  });

  it("works inside a Form.Item, where the item's label names the trigger", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Form>
        <Form.Item name="region" label="Region">
          <Selector options={OPTIONS} onOpenChange={onOpenChange} />
        </Form.Item>
      </Form>,
    );
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));
  });

  it("still hands the caller's ref the trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Selector aria-label="Sort" options={OPTIONS} ref={ref} onOpenChange={vi.fn()} />,
    );
    expect(ref.current).toBe(screen.getByRole("combobox", { name: "Sort" }));
  });
});
