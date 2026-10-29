/**
 * `disabled: { reason }` on Selector and MultiSelector options (#106): the
 * option is disabled, Astryx still receives a boolean, and the end of the row
 * carries a glyph named by the reason. jsdom has no Popover API, so the mock
 * is Astryx's own, and the open panel needs `{ hidden: true }` queries.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MultiSelector } from "./MultiSelector";
import { optionDisabledReason, withOptionDisabledReason } from "./optionDisabledReason";
import { Selector } from "./Selector";

const originalMatches = HTMLElement.prototype.matches;

beforeEach(() => {
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

const h = { hidden: true } as const;
const OPTIONS = [
  { value: "a", label: "alpha" },
  { value: "b", label: "bravo", disabled: { reason: "No access" } },
  { value: "c", label: "charlie", disabled: true },
];
const glyph = (row: HTMLElement) =>
  row.querySelector(".uic-option-disabled-reason [aria-label]");

describe("withOptionDisabledReason", () => {
  const renderDefault = (option: { value: string }) => `default ${option.value}`;

  it("turns `{ reason }` into `true`, in sections too, and wraps the reasoned rows", () => {
    const { options, renderOption } = withOptionDisabledReason({
      options: [
        "plain",
        { type: "divider" as const },
        {
          type: "section" as const,
          options: [{ value: "x", label: "x", disabled: { reason: "Why" } }],
        },
        { value: "y", label: "y", disabled: true },
      ],
      renderDefault,
    });
    expect(options[2]).toEqual({
      type: "section",
      options: [{ value: "x", label: "x", disabled: true }],
    });
    expect(options[3]).toEqual({ value: "y", label: "y", disabled: true });

    const { container: withReason } = render(<>{renderOption!({ value: "x" })}</>);
    expect(withReason).toHaveTextContent("default x");
    expect(withReason.querySelector('[aria-label="Why"]')).not.toBeNull();
    const { container: silent } = render(<>{renderOption!({ value: "y" })}</>);
    expect(silent.querySelector(".uic-option-disabled-reason")).toBeNull();
  });

  it("hands options and renderOption back as given when no option has a reason", () => {
    const input = [{ value: "a", disabled: true }];
    const own = () => "own";
    const { options, renderOption } = withOptionDisabledReason({
      options: input,
      renderOption: own,
      renderDefault,
    });
    expect(options[0]).toBe(input[0]);
    expect(renderOption).toBe(own);
    expect(optionDisabledReason({ reason: "" })).toBeUndefined();
  });
});

describe.each([
  ["Selector", Selector],
  ["MultiSelector", MultiSelector],
] as const)("%s option `disabled: { reason }`", (_name, Control) => {
  it("disables the option and names the glyph at its end with the reason", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Control aria-label="Targets" options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole("combobox"));

    const rows = screen.getAllByRole("option", h);
    const bravo = rows.find((row) => row.textContent?.includes("bravo"))!;
    const charlie = rows.find((row) => row.textContent?.includes("charlie"))!;
    expect(bravo).toHaveAttribute("aria-disabled", "true");
    expect(glyph(bravo)).toHaveAttribute("aria-label", "No access");
    // A bare `true` disables silently.
    expect(charlie).toHaveAttribute("aria-disabled", "true");
    expect(glyph(charlie)).toBeNull();

    await user.click(bravo);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the caller's renderOption and adds the glyph after it", async () => {
    const user = userEvent.setup();
    render(
      <Control
        aria-label="Targets"
        options={OPTIONS}
        renderOption={(option) => <span data-testid="custom">{option.label}!</span>}
      />,
    );
    await user.click(screen.getByRole("combobox"));

    const bravo = screen
      .getAllByRole("option", h)
      .find((row) => row.textContent?.includes("bravo!"))!;
    expect(bravo.querySelector('[data-testid="custom"]')).not.toBeNull();
    expect(glyph(bravo)).toHaveAttribute("aria-label", "No access");
  });
});
