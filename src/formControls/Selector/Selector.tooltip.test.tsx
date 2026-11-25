/**
 * `showSelectedOptionTooltip`: the selected option's full label on the trigger,
 * shown on hover or focus only while the trigger clips it with an ellipsis,
 * held shut while the listbox is open, and absent when it has nothing to say.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Selector } from "./Selector";

const originalMatches = HTMLElement.prototype.matches;
const originalScrollWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollWidth",
);
const originalClientWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientWidth",
);

/** The trigger label's sizes, or `null` while it fits. jsdom reports 0 for both. */
let clipped: { scrollWidth: number; clientWidth: number } | null = null;

const isTriggerLabel = (element: HTMLElement) =>
  element.tagName === "SPAN" && element.closest('[role="combobox"]') != null;

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
    // jsdom does not match :focus-visible; the tooltip opens on focused triggers.
    if (selector === ":focus-visible") return document.activeElement === this;
    return originalMatches.call(this, selector);
  });
  Element.prototype.scrollIntoView = vi.fn();

  clipped = null;
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return clipped && isTriggerLabel(this) ? clipped.scrollWidth : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return clipped && isTriggerLabel(this) ? clipped.clientWidth : 0;
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  restoreSize("scrollWidth", originalScrollWidth);
  restoreSize("clientWidth", originalClientWidth);
});

/** Put back the size getter this file shadowed on `HTMLElement.prototype`. */
function restoreSize(
  name: "scrollWidth" | "clientWidth",
  original: PropertyDescriptor | undefined,
) {
  if (original) {
    Object.defineProperty(HTMLElement.prototype, name, original);
  } else {
    delete (HTMLElement.prototype as Partial<HTMLElement>)[name];
  }
}

const OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "A long southern region name" },
];

const trigger = () => screen.getByRole("combobox", { name: "Region" });
const tooltip = () => screen.queryByRole("tooltip", { hidden: true });

describe("Selector showSelectedOptionTooltip", () => {
  it("shows the selected label on hover when the trigger clips it", async () => {
    const user = userEvent.setup();
    clipped = { scrollWidth: 200, clientWidth: 100 };
    render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        defaultValue="south"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() =>
      expect(tooltip()).toHaveTextContent("A long southern region name"),
    );

    await user.hover(trigger());
    await waitFor(() => expect(tooltip()).toHaveAttribute("popover-open"));
  });

  it("shows it on keyboard focus too", async () => {
    clipped = { scrollWidth: 200, clientWidth: 100 };
    render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        defaultValue="south"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() => expect(tooltip()).not.toBeNull());

    act(() => trigger().focus());
    await waitFor(() => expect(tooltip()).toHaveAttribute("popover-open"));
  });

  it("is absent while the label fits", () => {
    render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        defaultValue="north"
        showSelectedOptionTooltip
      />,
    );
    expect(tooltip()).toBeNull();
    expect(trigger()).not.toHaveAttribute("aria-describedby");
  });

  it("follows the value: it appears when a longer one clips, and goes when it fits", async () => {
    const { rerender } = render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        value="north"
        showSelectedOptionTooltip
      />,
    );
    expect(tooltip()).toBeNull();

    clipped = { scrollWidth: 200, clientWidth: 100 };
    rerender(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        value="south"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() =>
      expect(tooltip()).toHaveTextContent("A long southern region name"),
    );

    clipped = null;
    rerender(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        value="north"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() => expect(tooltip()).toBeNull());
    expect(trigger()).not.toHaveAttribute("aria-describedby");
  });

  it("opens on a trigger that already has focus when its label starts to clip", async () => {
    const { rerender } = render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        value="north"
        showSelectedOptionTooltip
      />,
    );
    act(() => trigger().focus());
    expect(tooltip()).toBeNull();

    clipped = { scrollWidth: 200, clientWidth: 100 };
    rerender(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        value="south"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() => expect(tooltip()).toHaveAttribute("popover-open"));
  });

  it("still measures without a ResizeObserver", async () => {
    vi.stubGlobal("ResizeObserver", undefined);
    clipped = { scrollWidth: 200, clientWidth: 100 };
    render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        defaultValue="south"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() =>
      expect(tooltip()).toHaveTextContent("A long southern region name"),
    );
  });

  it("joins the caller's aria-describedby with the tooltip's id", async () => {
    clipped = { scrollWidth: 200, clientWidth: 100 };
    render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        defaultValue="south"
        aria-describedby="hint"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() => expect(tooltip()).not.toBeNull());
    expect(trigger().getAttribute("aria-describedby")?.split(" ")).toEqual(
      expect.arrayContaining(["hint", tooltip()!.id]),
    );
  });

  it("shows nothing with no selection, when disabled, or when off", async () => {
    clipped = { scrollWidth: 200, clientWidth: 100 };
    const { rerender } = render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        placeholder="Pick a region"
        showSelectedOptionTooltip
      />,
    );
    expect(tooltip()).toBeNull();

    rerender(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        defaultValue="south"
        disabled
        showSelectedOptionTooltip
      />,
    );
    expect(tooltip()).toBeNull();
    expect(trigger()).not.toHaveAttribute("aria-describedby");

    rerender(<Selector aria-label="Region" options={OPTIONS} defaultValue="south" />);
    expect(tooltip()).toBeNull();
    expect(trigger()).not.toHaveAttribute("aria-describedby");
  });

  it("stays shut while the listbox is open", async () => {
    const user = userEvent.setup();
    clipped = { scrollWidth: 200, clientWidth: 100 };
    render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        defaultValue="south"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() => expect(tooltip()).not.toBeNull());

    await user.click(trigger());
    await waitFor(() => expect(trigger()).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(tooltip()).not.toHaveAttribute("popover-open"));

    await user.unhover(trigger());
    await user.hover(trigger());
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(tooltip()).not.toHaveAttribute("popover-open");
  });

  it("falls back to the value for an option with no label, and resolves sections", async () => {
    clipped = { scrollWidth: 200, clientWidth: 100 };
    render(
      <Selector
        aria-label="Region"
        options={[{ type: "section", title: "All", options: [{ value: "bare" }] }]}
        defaultValue="bare"
        showSelectedOptionTooltip
      />,
    );
    await waitFor(() => expect(tooltip()).toHaveTextContent("bare"));
  });

  it("does not re-attach the caller's callback ref on re-render", async () => {
    clipped = { scrollWidth: 200, clientWidth: 100 };
    const ref = vi.fn();
    const { rerender } = render(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        value="south"
        ref={ref}
        showSelectedOptionTooltip
      />,
    );
    rerender(
      <Selector
        aria-label="Region"
        options={OPTIONS}
        value="north"
        ref={ref}
        showSelectedOptionTooltip
      />,
    );
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledWith(trigger());
  });
});
