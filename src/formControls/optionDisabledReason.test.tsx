/**
 * `disabled: { reason }` on Selector and MultiSelector options (#106): the
 * option is disabled, Astryx still receives a boolean, the reason is hidden
 * text in the row, and hovering the row shows it (#122). jsdom has no Popover
 * API, so the mock is Astryx's own, and the open panel needs `{ hidden: true }`
 * queries.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
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
/** The reason as read with the option, not the tooltip's copy of it. */
const hiddenReason = (row: HTMLElement, reason: string) =>
  within(row).queryByText(reason, { ignore: '[role="tooltip"] *' });

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
    expect(hiddenReason(withReason, "Why")).not.toBeNull();
    const { container: silent } = render(<>{renderOption!({ value: "y" })}</>);
    expect(silent.querySelector('[role="tooltip"]')).toBeNull();
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
  it("disables the option and reads the reason with it, drawing no glyph", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Control aria-label="Targets" options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole("combobox"));

    const rows = screen.getAllByRole("option", h);
    const bravo = rows.find((row) => row.textContent?.includes("bravo"))!;
    const charlie = rows.find((row) => row.textContent?.includes("charlie"))!;
    expect(bravo).toHaveAttribute("aria-disabled", "true");
    expect(hiddenReason(bravo, "No access")).not.toBeNull();
    expect(bravo.querySelector(".lucide-circle-alert")).toBeNull();
    // A bare `true` disables silently.
    expect(charlie).toHaveAttribute("aria-disabled", "true");
    expect(charlie.querySelector('[role="tooltip"]')).toBeNull();

    await user.click(bravo);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the reason when the row is hovered, not only the glyph", async () => {
    const user = userEvent.setup();
    render(<Control aria-label="Targets" options={OPTIONS} />);
    await user.click(screen.getByRole("combobox"));

    // The one tooltip in the panel: a bare `true` has none.
    const tooltip = screen.getByRole("tooltip", h);
    expect(tooltip).toHaveTextContent("No access");
    expect(tooltip).not.toHaveAttribute("popover-open");

    const rows = screen.getAllByRole("option", h);
    await user.hover(rows.find((row) => row.textContent?.includes("bravo"))!);
    await waitFor(() => expect(tooltip).toHaveAttribute("popover-open"));

    await user.hover(rows.find((row) => row.textContent?.includes("alpha"))!);
    await waitFor(() => expect(tooltip).not.toHaveAttribute("popover-open"));
  });

  it("keeps the caller's renderOption and adds the reason after it", async () => {
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
    expect(hiddenReason(bravo, "No access")).not.toBeNull();
  });
});
