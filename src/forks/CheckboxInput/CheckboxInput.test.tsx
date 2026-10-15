// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.0, src/CheckboxInput/CheckboxInput.test.tsx
// (MIT; see NOTICE). Upstream's tests, run against the fork; ui-common's own tests are
// in the *.fork.test.tsx beside it.
// Left out: the blocks that read the CSS the StyleX dev runtime injects (pressed
// state, forced colors, focus-ring ownership). The fork runs no StyleX compile;
// it renders upstream's compiled classes verbatim, so those rules are upstream's.
// Also left out, for the same reason: the label-gap, RTL thumb-travel and
// coarse-pointer tests, which read dev-runtime class names or injected CSS; and
// "announces a status message that appears after mount", which needs Astryx's
// internal live-region reset between tests.
// Provenance and the drift guard: src/forks/provenance.json.

/**
 * @file CheckboxInput.test.tsx
 * @input Uses vitest, @testing-library/react, CheckboxInput component
 * @output Unit tests for CheckboxInput-specific API, callback, form,
 *   composition, and styling behavior. Shared checkbox semantics live in
 *   __tests__/Checkbox.a11y.test.tsx and its Chromium twin.
 * @position Component-owned regression tests; validates CheckboxInput.tsx without
 *   duplicating outcomes owned by the reusable checkbox contract.
 *
 * SYNC: When CheckboxInput.tsx changes, update tests to match new behavior
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckboxInput } from "./CheckboxInput";

// Mock showPopover/hidePopover (not implemented in jsdom) so the tooltip layer
// reflects its open state via a `popover-open` attribute the tests can assert.
beforeEach(() => {
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute("popover-open", "");
    const event = new Event("toggle", { bubbles: false });
    Object.defineProperty(event, "newState", { value: "open" });
    this.dispatchEvent(event);
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute("popover-open");
    const event = new Event("toggle", { bubbles: false });
    Object.defineProperty(event, "newState", { value: "closed" });
    this.dispatchEvent(event);
  });
  const originalMatches = HTMLElement.prototype.matches;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLElement.prototype as any).matches = function (selector: string): boolean {
    if (selector === ":popover-open") {
      return this.hasAttribute("popover-open");
    }
    return originalMatches.call(this, selector);
  };
});

describe("CheckboxInput", () => {
  it("calls onChange with new checked state when clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <CheckboxInput label="Accept terms" value={false} onChange={handleChange} />,
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("calls onChange with false when unchecking", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<CheckboxInput label="Accept terms" value={true} onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(false, expect.any(Object));
  });

  it("keeps a changeAction-only checkbox editable", async () => {
    const user = userEvent.setup();
    const changeAction = vi.fn();
    render(
      <CheckboxInput label="Accept terms" value={false} changeAction={changeAction} />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toHaveAttribute("aria-readonly");
    await user.click(checkbox);
    await waitFor(() =>
      expect(changeAction).toHaveBeenCalledWith(true, expect.any(Object)),
    );
  });

  it("works when clicking on the label", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <CheckboxInput label="Accept terms" value={false} onChange={handleChange} />,
    );

    const label = screen.getByText("Accept terms");
    await user.click(label);
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("renders description when provided", () => {
    render(
      <CheckboxInput
        label="Subscribe"
        description="Receive weekly updates"
        value={false}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Receive weekly updates")).toBeInTheDocument();
  });

  it("toggles when clicking on the description", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <CheckboxInput
        label="Subscribe"
        description="Receive weekly updates"
        value={false}
        onChange={handleChange}
      />,
    );
    await user.click(screen.getByText("Receive weekly updates"));
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("does not call onChange when isDisabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={handleChange}
        isDisabled
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("forwards data-testid to the input", () => {
    render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        data-testid="accept-terms-checkbox"
      />,
    );
    expect(screen.getByTestId("accept-terms-checkbox")).toBe(
      screen.getByRole("checkbox"),
    );
  });

  it("forwards arbitrary data-* attributes to the input", () => {
    render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        data-tracking-id="checkbox-42"
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "data-tracking-id",
      "checkbox-42",
    );
  });

  it("does not let rest props override checked, disabled, or type", () => {
    // Not part of CheckboxInputProps; spread (rather than named attributes)
    // to sidestep JSX excess-property checks the same way a real caller's
    // spread rest-props object would arrive untyped at runtime.
    const foreignAttrs: Record<string, unknown> = {
      checked: false,
      disabled: false,
      type: "text",
    };
    render(
      <CheckboxInput
        {...foreignAttrs}
        label="Accept terms"
        value={true}
        onChange={() => {}}
        isDisabled
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveAttribute("type", "checkbox");
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(
      <CheckboxInput
        ref={ref}
        label="Accept terms"
        value={false}
        onChange={() => {}}
      />,
    );
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("visually hides label when isLabelHidden is true", () => {
    render(
      <CheckboxInput
        label="Select row"
        isLabelHidden
        value={false}
        onChange={() => {}}
      />,
    );
    const label = screen.getByText("Select row");
    expect(label).toBeInTheDocument();
    // Label should still be accessible
    expect(screen.getByLabelText("Select row")).toBeInTheDocument();
  });

  it("keeps description linked via aria-describedby when isLabelHidden", () => {
    render(
      <CheckboxInput
        label="Select row"
        isLabelHidden
        description="Selects this row for bulk actions"
        value={false}
        onChange={() => {}}
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    const description = screen.getByText("Selects this row for bulk actions");
    expect(description.id).not.toBe("");
    expect(checkbox.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("merges a consumer aria-describedby with its own description id", () => {
    render(
      <>
        <span id="row-hint">Hint from the row</span>
        <CheckboxInput
          label="Select row"
          isLabelHidden
          description="Selects this row for bulk actions"
          aria-describedby="row-hint"
          value={false}
          onChange={() => {}}
        />
      </>,
    );
    const checkbox = screen.getByRole("checkbox");
    const description = screen.getByText("Selects this row for bulk actions");
    const ids = checkbox.getAttribute("aria-describedby")!.split(" ");
    expect(ids).toContain("row-hint");
    expect(ids).toContain(description.id);
  });

  it("shows label visually by default", () => {
    render(<CheckboxInput label="Accept terms" value={false} onChange={() => {}} />);
    const label = screen.getByText("Accept terms");
    expect(label).toBeVisible();
  });

  it("sets aria-busy when loading", () => {
    render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        isLoading
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-busy", "true");
  });

  it("exposes indeterminate state via the native indeterminate property", () => {
    render(
      <CheckboxInput label="Select all" value="indeterminate" onChange={() => {}} />,
    );
    const checkbox = screen.getByRole("checkbox");
    // Native checkboxes expose mixed state through the DOM indeterminate
    // property, which browsers map to aria-checked="mixed". A redundant
    // aria-checked attribute is intentionally NOT set (forms-16).
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    if (checkbox instanceof HTMLInputElement) {
      expect(checkbox.indeterminate).toBe(true);
    }
    expect(checkbox).not.toHaveAttribute("aria-checked");
  });

  it("renders semantic labelIcon names as icons", () => {
    const { container } = render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        labelIcon="info"
      />,
    );

    expect(container.textContent).toBe("Accept terms");
    expect(container.querySelector(".astryx-icon")).toBeInTheDocument();
  });

  it("renders custom labelIcon content", () => {
    render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        labelIcon={<span data-testid="custom-label-icon">Custom</span>}
      />,
    );

    expect(screen.getByTestId("custom-label-icon")).toHaveTextContent("Custom");
  });

  it("renders the status message for an error", () => {
    render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        status={{ type: "error", message: "Required field" }}
      />,
    );
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  describe("disabledMessage", () => {
    const h = { hidden: true } as const;

    function getRow(): HTMLElement {
      return screen.getByRole("checkbox", h).closest("div")!.parentElement!;
    }

    it("shows the reason tooltip on hover when disabled with a reason", async () => {
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Terms are managed by your administrator"
        />,
      );
      const tooltip = screen.getByRole("tooltip", h);
      expect(tooltip).toHaveTextContent("Terms are managed by your administrator");
      fireEvent.mouseEnter(getRow());
      await waitFor(() => expect(tooltip).toHaveAttribute("popover-open"));
      fireEvent.mouseLeave(getRow());
      await waitFor(() => expect(tooltip).not.toHaveAttribute("popover-open"));
    });

    it("shows the reason tooltip on keyboard focus", async () => {
      const user = userEvent.setup();
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Terms are managed by your administrator"
        />,
      );
      const tooltip = screen.getByRole("tooltip", h);
      await user.tab();
      expect(screen.getByRole("checkbox", h)).toHaveFocus();
      await waitFor(() => expect(tooltip).toHaveAttribute("popover-open"));
    });

    it("does not render a tooltip when not disabled", () => {
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={() => {}}
          disabledMessage="Terms are managed by your administrator"
        />,
      );
      expect(screen.queryByRole("tooltip", h)).not.toBeInTheDocument();
    });

    it("keeps a consumer aria-describedby alongside the reason tooltip", () => {
      render(
        <>
          <span id="terms-hint">Required before checkout</span>
          <CheckboxInput
            label="Accept terms"
            value={false}
            onChange={() => {}}
            isDisabled
            disabledMessage="Terms are managed by your administrator"
            aria-describedby="terms-hint"
          />
        </>,
      );
      const checkbox = screen.getByRole("checkbox");
      const tooltip = screen.getByRole("tooltip", h);
      const ids = checkbox.getAttribute("aria-describedby")!.split(" ");
      expect(ids).toContain("terms-hint");
      expect(ids).toContain(tooltip.id);
    });

    it("does not render a tooltip when disabled without a reason", () => {
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={() => {}}
          isDisabled
        />,
      );
      expect(screen.queryByRole("tooltip", h)).not.toBeInTheDocument();
    });

    it("keeps the checkbox focusable via aria-disabled when a reason is provided", () => {
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Terms are managed by your administrator"
        />,
      );
      const checkbox = screen.getByRole("checkbox", h);
      expect(checkbox).not.toBeDisabled();
      expect(checkbox).toHaveAttribute("aria-disabled", "true");
    });

    it("links the reason tooltip via aria-describedby", () => {
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Terms are managed by your administrator"
        />,
      );
      const checkbox = screen.getByRole("checkbox", h);
      const tooltip = screen.getByRole("tooltip", h);
      expect(checkbox.getAttribute("aria-describedby")).toContain(tooltip.id);
    });

    it("blocks toggling while focusable-disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={onChange}
          isDisabled
          disabledMessage="Terms are managed by your administrator"
        />,
      );
      const checkbox = screen.getByRole("checkbox", h);
      await user.click(checkbox);
      expect(onChange).not.toHaveBeenCalled();
      expect(checkbox).not.toBeChecked();
    });

    it("remains natively disabled when disabled without a reason", () => {
      render(
        <CheckboxInput
          label="Accept terms"
          value={false}
          onChange={() => {}}
          isDisabled
        />,
      );
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });
  });
  describe("form participation", () => {
    it("submits under htmlName when checked", () => {
      const { container } = render(
        <form>
          <CheckboxInput
            label="Terms"
            htmlName="terms"
            value={true}
            onChange={() => {}}
          />
        </form>,
      );
      const data = new FormData(container.querySelector("form")!);
      expect(data.get("terms")).toBe("on");
    });

    it("does not block form submission when required and disabled with a disabledMessage", () => {
      const { container } = render(
        <form>
          <CheckboxInput
            label="Terms"
            htmlName="terms"
            value={false}
            onChange={() => {}}
            isRequired
            isDisabled
            disabledMessage="Terms are managed by your administrator"
          />
        </form>,
      );
      expect(container.querySelector("form")!.checkValidity()).toBe(true);
    });

    it("still blocks submission when required and unchecked but enabled", () => {
      const { container } = render(
        <form>
          <CheckboxInput
            label="Terms"
            htmlName="terms"
            value={false}
            onChange={() => {}}
            isRequired
          />
        </form>,
      );
      expect(container.querySelector("form")!.checkValidity()).toBe(false);
    });

    it("is excluded from form data when disabled, even with a disabledMessage", () => {
      const { container } = render(
        <form>
          <CheckboxInput
            label="Terms"
            htmlName="terms"
            value={true}
            onChange={() => {}}
            isDisabled
            disabledMessage="Locked"
          />
        </form>,
      );
      expect([...new FormData(container.querySelector("form")!).keys()]).toEqual([]);
    });

    it("submits nothing when unchecked", () => {
      const { container } = render(
        <form>
          <CheckboxInput
            label="Terms"
            htmlName="terms"
            value={false}
            onChange={() => {}}
          />
        </form>,
      );
      expect([...new FormData(container.querySelector("form")!).keys()]).toEqual([]);
    });
  });
});

describe("label theme target", () => {
  it("names its own label so a theme can style it apart from a field label", () => {
    // The control knows this label shares a row with it; the label does not.
    // Both classes land on the one element, so a theme reaches every label
    // through `astryx-field-label` and only this kind through
    // `astryx-checkbox-label`.
    render(<CheckboxInput label="Notify me" value={false} onChange={() => {}} />);
    const label = screen.getByText("Notify me").closest("label");
    expect(label).toHaveClass("astryx-field-label");
    expect(label).toHaveClass("astryx-checkbox-label");
  });
});
