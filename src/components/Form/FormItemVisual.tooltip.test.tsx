/**
 * `Form.Item tooltip` renders behind a hover/focus target after the label,
 * never inline in the label row. Asserted is the contract, not the popup: the
 * help text is not in the label's own text, and a trigger reveals it.
 */
import FormItemVisual from "./FormItemVisual";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("FormItemVisual — tooltip", () => {
  it("puts the tooltip text in an overlay layer, not in the label flow", () => {
    render(
      <FormItemVisual label="Memory" tooltip="Computer memory is temporary.">
        <input aria-label="memory" />
      </FormItemVisual>,
    );
    const text = screen.getByText("Computer memory is temporary.");
    // jsdom implements neither the Popover API nor CSS anchor positioning, so
    // Astryx's layer sits in the tree and reads as "visible" here. What makes
    // it a TOOLTIP rather than inline prose is the pair of attributes the
    // browser acts on: `role="tooltip"` and `popover`, which keeps it out of
    // the flow until hover/focus opens it. Before the fix the help text was a
    // bare `<span>` in the label with neither.
    const layer = text.closest('[role="tooltip"]');
    expect(layer).not.toBeNull();
    expect(layer?.hasAttribute("popover")).toBe(true);
  });

  it("renders a focusable trigger after the label", () => {
    render(
      <FormItemVisual label="Memory" tooltip="Computer memory is temporary.">
        <input aria-label="memory" />
      </FormItemVisual>,
    );
    const trigger = document.querySelector(".uic-form-item__tooltip");
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("tabindex")).toBe("0");
    // The glyph, not the prose.
    expect(trigger?.textContent).toBe("");
    expect(trigger?.querySelector("svg")).not.toBeNull();
  });

  it("renders no trigger when there is no tooltip", () => {
    render(
      <FormItemVisual label="Memory">
        <input aria-label="memory" />
      </FormItemVisual>,
    );
    expect(document.querySelector(".uic-form-item__tooltip")).toBeNull();
  });

  it("uses antd’s `tooltip.icon` as the trigger glyph when given", () => {
    render(
      <FormItemVisual
        label="Memory"
        tooltip="Computer memory is temporary."
        tooltipIcon={<span data-testid="custom-glyph">i</span>}
      >
        <input aria-label="memory" />
      </FormItemVisual>,
    );
    expect(screen.getByTestId("custom-glyph")).toBeInTheDocument();
  });
});
