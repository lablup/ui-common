/**
 * ui-common's tests for its ComplexSelector fork: the fix it carries
 * (`hasClear` / `onClear`, facebook/astryx#6362), and that everything else
 * renders exactly as Astryx's does.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComplexSelector as UpstreamComplexSelector } from "@astryxdesign/core/ComplexSelector";

import { comparableMarkup } from "../../test/forkParity";
import { ComplexSelector, type ComplexSelectorProps } from "./ComplexSelector";

type Props = Omit<ComplexSelectorProps<string | undefined>, "children">;

function renderSelector(props: Partial<Props> = {}) {
  return render(
    <ComplexSelector<string | undefined>
      label="Fruit"
      value="apple"
      triggerLabel="Apple"
      {...props}
    >
      {() => <button type="button">Banana</button>}
    </ComplexSelector>,
  );
}

const clearButton = () => screen.queryByRole("button", { name: /clear/i });

describe("ComplexSelector fork: hasClear", () => {
  it("renders no clear button unless asked", () => {
    renderSelector();
    expect(clearButton()).not.toBeInTheDocument();
  });

  it("renders a clear button, named after the field, while a value shows", () => {
    renderSelector({ hasClear: true });
    const button = clearButton();
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName(/Fruit/);
  });

  it("puts the clear button between the spinner and the chevron", () => {
    const { container } = renderSelector({ hasClear: true, isLoading: true });
    const trigger = container.querySelector(".astryx-complex-selector")!;
    const order = Array.from(trigger.children).map((el) =>
      el.matches('[role="status"], .astryx-spinner')
        ? "spinner"
        : el.contains(clearButton())
          ? "clear"
          : el.matches(".astryx-complex-selector-indicator-icon")
            ? "chevron"
            : "other",
    );
    expect(order.slice(-3)).toEqual(["spinner", "clear", "chevron"]);
  });

  it("hides the clear button with no value to clear, and while disabled", () => {
    const { unmount } = renderSelector({ hasClear: true, triggerLabel: undefined });
    expect(clearButton()).not.toBeInTheDocument();
    unmount();
    renderSelector({ hasClear: true, isDisabled: true });
    expect(clearButton()).not.toBeInTheDocument();
  });

  it("calls onClear, and does not open the popover", async () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    renderSelector({ hasClear: true, onClear, onChange, onOpenChange });
    await userEvent.click(clearButton()!);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Fruit" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("falls back to onChange(undefined) without onClear", async () => {
    const onChange = vi.fn();
    renderSelector({ hasClear: true, onChange });
    await userEvent.click(clearButton()!);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(undefined);
  });
});

describe("ComplexSelector fork: parity with Astryx", () => {
  const cases: Array<[string, Partial<Props>]> = [
    ["a value", {}],
    ["the placeholder", { triggerLabel: undefined }],
    ["ghost, small, loading", { variant: "ghost", size: "sm", isLoading: true }],
    ["disabled ghost", { variant: "ghost", isDisabled: true }],
    [
      "a status and a description",
      { status: { type: "error", message: "Pick one" }, description: "Help" },
    ],
    ["a start icon, required", { startIcon: "search", isRequired: true }],
  ];

  it.each(cases)("renders Astryx's markup with %s", (_, props) => {
    const fork = render(
      <ComplexSelector<string | undefined>
        label="Fruit"
        value="apple"
        triggerLabel="Apple"
        {...props}
      >
        {() => null}
      </ComplexSelector>,
    );
    const upstream = render(
      <UpstreamComplexSelector<string | undefined>
        label="Fruit"
        value="apple"
        triggerLabel="Apple"
        {...props}
      >
        {() => null}
      </UpstreamComplexSelector>,
    );
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });

  // When this fails, Astryx has shipped the fix: delete the fork and its
  // exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from Astryx's, which has no clear button", () => {
    render(
      <UpstreamComplexSelector
        label="Fruit"
        value="apple"
        triggerLabel="Apple"
        {...({ hasClear: true } as object)}
      >
        {() => null}
      </UpstreamComplexSelector>,
    );
    expect(clearButton()).not.toBeInTheDocument();
  });
});
