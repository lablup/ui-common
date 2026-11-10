/**
 * `showTooltip`: the selected labels in a tooltip on the trigger, held shut
 * while the listbox is open, and absent when it has nothing to say.
 */
import { createRef, useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MultiSelector, type MultiSelectorOptionType } from "./MultiSelector";

const originalMatches = HTMLElement.prototype.matches;

beforeEach(() => {
  // jsdom has no Popover API: Astryx's own mock, which marks an open popover.
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute("popover-open", "");
    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "open" });
    this.dispatchEvent(event);
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute("popover-open");
    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "closed" });
    this.dispatchEvent(event);
  });
  vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (
    this: HTMLElement,
    selector: string,
  ) {
    if (selector === ":popover-open") return this.hasAttribute("popover-open");
    return originalMatches.call(this, selector);
  });
  Element.prototype.scrollIntoView = vi.fn();
});

const OPTIONS: MultiSelectorOptionType[] = [
  "plain",
  { value: "north", label: "North" },
  { value: "bare" },
  {
    type: "section",
    title: "Far",
    options: [{ value: "south", label: "South" }],
  },
];

const trigger = () => screen.getByRole("combobox", { name: "Regions" });
const tooltip = () => screen.queryByRole("tooltip", { hidden: true });

describe("MultiSelector showTooltip", () => {
  it("lists the selected labels, resolved from options and sections", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelector
        aria-label="Regions"
        options={OPTIONS}
        defaultValue={["south", "plain", "bare", "gone"]}
        aria-describedby="hint"
        showTooltip
      />,
    );
    expect(tooltip()).toHaveTextContent("South, plain, bare, gone");
    // The tooltip's id joins the trigger's own description, it does not replace it.
    expect(trigger().getAttribute("aria-describedby")?.split(" ")).toEqual(
      expect.arrayContaining(["hint", tooltip()!.id]),
    );

    await user.hover(trigger());
    await waitFor(() => expect(tooltip()).toHaveAttribute("popover-open"));
  });

  it("follows a controlled value, down to none", () => {
    function Controlled() {
      const [value, setValue] = useState<string[] | undefined>(["north"]);
      return (
        <>
          <MultiSelector
            aria-label="Regions"
            options={OPTIONS}
            value={value}
            showTooltip
          />
          <button onClick={() => setValue(["north", "south"])}>Two</button>
          <button onClick={() => setValue(undefined)}>Clear</button>
        </>
      );
    }
    render(<Controlled />);
    expect(tooltip()).toHaveTextContent("North");
    act(() => screen.getByRole("button", { name: "Two" }).click());
    expect(tooltip()).toHaveTextContent("North, South");
    act(() => screen.getByRole("button", { name: "Clear" }).click());
    expect(tooltip()).toBeNull();
  });

  it("is held shut while the listbox is open, and still reports onOpenChange", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <MultiSelector
        aria-label="Regions"
        options={OPTIONS}
        defaultValue={["north"]}
        onOpenChange={onOpenChange}
        showTooltip
      />,
    );
    await user.hover(trigger());
    await waitFor(() => expect(tooltip()).toHaveAttribute("popover-open"));

    await user.click(trigger());
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));
    await waitFor(() => expect(tooltip()).not.toHaveAttribute("popover-open"));

    // Hovering the trigger again while the listbox is open does not reopen it.
    await user.unhover(trigger());
    await user.hover(trigger());
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(tooltip()).not.toHaveAttribute("popover-open");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    await user.unhover(trigger());
    await user.hover(trigger());
    await waitFor(() => expect(tooltip()).toHaveAttribute("popover-open"));
  });

  it("resolves an option whose disabled carries a reason", () => {
    render(
      <MultiSelector
        aria-label="Regions"
        options={[{ value: "east", label: "East", disabled: { reason: "Busy" } }]}
        defaultValue={["east"]}
        showTooltip
      />,
    );
    const id = trigger().getAttribute("aria-describedby");
    expect(document.getElementById(id ?? "")).toHaveTextContent("East");
  });

  it("merges the caller's ref with its anchor", () => {
    const ref = createRef<HTMLElement>();
    render(
      <MultiSelector
        aria-label="Regions"
        options={OPTIONS}
        defaultValue={["north"]}
        ref={ref}
        showTooltip
      />,
    );
    expect(ref.current).toBe(trigger());
    expect(tooltip()).toHaveTextContent("North");
  });

  it("renders no tooltip with nothing selected, when disabled, or when off", () => {
    const { rerender } = render(
      <MultiSelector aria-label="Regions" options={OPTIONS} showTooltip />,
    );
    expect(tooltip()).toBeNull();

    rerender(
      <MultiSelector
        aria-label="Regions"
        options={OPTIONS}
        defaultValue={["north"]}
        disabled
        showTooltip
      />,
    );
    expect(tooltip()).toBeNull();

    rerender(
      <MultiSelector aria-label="Regions" options={OPTIONS} defaultValue={["north"]} />,
    );
    expect(tooltip()).toBeNull();
    expect(trigger()).not.toHaveAttribute("aria-describedby");
  });

  it("keeps the disabled message's description on a disabled trigger", () => {
    render(
      <MultiSelector
        aria-label="Regions"
        options={OPTIONS}
        defaultValue={["north"]}
        disabled
        disabledMessage="Pick a zone first"
        showTooltip
      />,
    );
    const describedBy = trigger().getAttribute("aria-describedby") ?? "";
    expect(describedBy).not.toBe("");
    const described = describedBy
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");
    expect(described).toContain("Pick a zone first");
    expect(described).not.toContain("North");
  });
});
