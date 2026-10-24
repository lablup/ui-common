// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.3, src/Switch/Switch.test.tsx
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
 * @file Switch.test.tsx
 * @input Uses vitest, @testing-library/react, Switch component
 * @output Unit tests for Switch's own contract: callbacks, form participation,
 *   composition, and styling
 * @position Testing; validates Switch.tsx implementation
 *
 * The shared switch-pattern outcomes — role, accessible name, exposed on/off
 * state, description, disabled exposure and inoperability, and keyboard and
 * pointer activation — are owned by the reusable accessibility contract in
 * __tests__/Switch.a11y.test.tsx (jsdom) and
 * __tests__/Switch.a11y.chromium.spec.ts (real Chromium, where the computed
 * accessibility tree and real focus can actually be observed). Assertions that
 * this file used to duplicate now live there and are not repeated here.
 *
 * What stays here is Switch's own contract: callback payloads, form data,
 * disabled-reason tooltip composition, the label theme target, forced-colors
 * CSS, RTL thumb travel, and rest forwarding.
 *
 * SYNC: When Switch.tsx changes, update tests to match new behavior
 */

import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./Switch";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

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

describe("Switch", () => {
  it("renders with custom size prop (sm / md)", () => {
    const { rerender } = render(
      <Switch label="Small switch" value={false} size="sm" onChange={() => {}} />,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();

    rerender(
      <Switch label="Medium switch" value={false} size="md" onChange={() => {}} />,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls onChange with new checked state when clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Switch label="Enable notifications" value={false} onChange={handleChange} />,
    );

    const switchEl = screen.getByRole("switch");
    await user.click(switchEl);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("calls onChange with false when turning off", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Switch label="Enable notifications" value={true} onChange={handleChange} />,
    );

    const switchEl = screen.getByRole("switch");
    await user.click(switchEl);
    expect(handleChange).toHaveBeenCalledWith(false, expect.any(Object));
  });

  it("works when clicking on the label", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Switch label="Enable notifications" value={false} onChange={handleChange} />,
    );

    const label = screen.getByText("Enable notifications");
    await user.click(label);
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("renders description when provided", () => {
    render(
      <Switch
        label="Dark mode"
        description="Switch to a darker color scheme"
        value={false}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("Switch to a darker color scheme")).toBeInTheDocument();
  });

  it("toggles when clicking on the description", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Switch
        label="Dark mode"
        description="Switch to a darker color scheme"
        value={false}
        onChange={handleChange}
      />,
    );
    await user.click(screen.getByText("Switch to a darker color scheme"));
    expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("does not fold the description into the switch accessible name", () => {
    // Description stays a sibling of the <label>, so it must not become part
    // of the switch's accessible name — it belongs in the accessible
    // description (aria-describedby) only, to avoid double announcement.
    render(
      <Switch
        label="Dark mode"
        description="Switch to a darker color scheme"
        value={false}
        onChange={() => {}}
      />,
    );
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAccessibleName("Dark mode");
    expect(switchEl).toHaveAccessibleDescription("Switch to a darker color scheme");
  });

  it("does not call onChange when isDisabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={handleChange}
        isDisabled
      />,
    );

    const switchEl = screen.getByRole("switch");
    await user.click(switchEl);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(
      <Switch
        ref={ref}
        label="Enable notifications"
        value={false}
        onChange={() => {}}
      />,
    );
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("visually hides label when isLabelHidden is true", () => {
    render(
      <Switch label="Toggle row" isLabelHidden value={false} onChange={() => {}} />,
    );
    const label = screen.getByText("Toggle row");
    expect(label).toBeInTheDocument();
    // Label should still be accessible
    expect(screen.getByLabelText("Toggle row")).toBeInTheDocument();
  });

  // Retained: the shared contract binds a hidden-label state and a described
  // state, but not a hidden label WITH a description, which is the combination
  // that used to drop the link.
  it("keeps description linked via aria-describedby when isLabelHidden", () => {
    render(
      <Switch
        label="Toggle row"
        isLabelHidden
        description="Enables sync for this row"
        value={false}
        onChange={() => {}}
      />,
    );
    const switchEl = screen.getByRole("switch");
    const description = screen.getByText("Enables sync for this row");
    expect(description.id).not.toBe("");
    expect(switchEl.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("shows label visually by default", () => {
    render(<Switch label="Enable notifications" value={false} onChange={() => {}} />);
    const label = screen.getByText("Enable notifications");
    expect(label).toBeVisible();
  });

  it("renders with labelPosition start (label before switch)", () => {
    const { container } = render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        labelPosition="start"
      />,
    );
    // The outer div wraps the container div which has the label and switch
    const outerDiv = container.firstChild as HTMLElement;
    const containerDiv = outerDiv.firstChild as HTMLElement;
    const children = Array.from(containerDiv.children);
    // First child should be label wrapper, second should be switch wrapper
    expect(children.length).toBe(2);
  });

  it("renders with labelPosition end (switch before label)", () => {
    const { container } = render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        labelPosition="end"
      />,
    );
    // The outer div wraps the container div which has the switch and label
    const outerDiv = container.firstChild as HTMLElement;
    const containerDiv = outerDiv.firstChild as HTMLElement;
    const children = Array.from(containerDiv.children);
    // First child should be switch wrapper, second should be label wrapper
    expect(children.length).toBe(2);
  });

  // Retained on purpose: the shared switch contract encodes no busy expectation
  // — no current record adopts one — so this is the only thing gating it.
  it("sets aria-busy on input when loading", () => {
    render(
      <Switch
        label="Enable notifications"
        value={false}
        isLoading
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-busy", "true");
  });

  it("renders status message when status prop is provided", () => {
    render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        status={{ type: "error", message: "Failed to save setting" }}
      />,
    );
    expect(screen.getByText("Failed to save setting")).toBeInTheDocument();
  });

  // Retained after review, not by oversight. The shared contract's
  // switch.invalid.exposed proves that a switch in error is REPORTED in error,
  // but the bound state is also `isRequired` and off, and Chromium derives an
  // invalid state from constraint validation alone — so that expectation would
  // still pass with this mapping deleted. Switch's own error-status-to-
  // aria-invalid mapping is gated here, together with its negative below.
  it("sets aria-invalid when status type is error", () => {
    render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        status={{ type: "error", message: "Error message" }}
      />,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when status type is not error", () => {
    render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        status={{ type: "warning", message: "Warning message" }}
      />,
    );
    expect(screen.getByRole("switch")).not.toHaveAttribute("aria-invalid");
  });

  it("announces loading state through useAnnounce when busy", async () => {
    const { container, rerender } = render(
      <Switch label="Enable notifications" value={false} onChange={() => {}} />,
    );
    // Does not introduce a permanent live region DOM element per switch
    expect(container.querySelector('[role="status"][aria-live="polite"]')).toBeNull();

    rerender(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        isLoading
      />,
    );
    await waitFor(() => {
      expect(
        document.querySelector('[data-astryx-live-region="polite"]'),
      ).toHaveTextContent("Loading");
    });
  });

  it("announces one busy start once under StrictMode, from the switch alone", async () => {
    // Count every message the shared polite region is given. Each announce
    // writes its text in a later frame, so two announces add it twice.
    const written: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target as Element;
        if (target.getAttribute?.("data-astryx-live-region") !== "polite") {
          continue;
        }
        for (const node of record.addedNodes) {
          if (node.textContent) {
            written.push(node.textContent);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const { container } = render(
      <StrictMode>
        <Switch label="Sync photos" value={false} onChange={() => {}} isLoading />
      </StrictMode>,
    );
    await waitFor(() => {
      expect(written).toContain("Loading");
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    observer.disconnect();

    expect(written.filter((text) => text === "Loading")).toHaveLength(1);
    // The thumb's spinner is a silent indicator: no live role reaches
    // assistive technology from inside the switch.
    for (const status of container.querySelectorAll('[role="status"]')) {
      expect(status.closest('[aria-hidden="true"]')).not.toBeNull();
    }
    expect(container.querySelector("[aria-live]")).toBeNull();
  });

  it("announces again when the switch becomes busy again after settling", async () => {
    const polite = () => document.querySelector('[data-astryx-live-region="polite"]');
    const props = { label: "Sync photos", value: false, onChange: () => {} };
    const { rerender } = render(<Switch {...props} isLoading />);
    await waitFor(() => expect(polite()).toHaveTextContent("Loading"));

    rerender(<Switch {...props} />);
    polite()!.textContent = "";
    rerender(<Switch {...props} isLoading />);
    await waitFor(() => expect(polite()).toHaveTextContent("Loading"));
  });

  it("localizes the loading announcement through the i18n catalog", async () => {
    render(
      <InternationalizationProvider
        locale="fr"
        overrides={{ fr: { "@astryx.switch.loading": "Chargement" } }}
      >
        <Switch
          label="Enable notifications"
          value={false}
          onChange={() => {}}
          isLoading
        />
      </InternationalizationProvider>,
    );
    await waitFor(() => {
      expect(
        document.querySelector('[data-astryx-live-region="polite"]'),
      ).toHaveTextContent("Chargement");
    });
  });

  it("announces loading state while async changeAction is pending", async () => {
    let resolveAction!: () => void;
    const changeAction = vi.fn(
      async () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        changeAction={changeAction}
      />,
    );

    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    expect(changeAction).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        document.querySelector('[data-astryx-live-region="polite"]'),
      ).toHaveTextContent("Loading");
    });

    resolveAction();
  });

  it("calls onFocus and onBlur callbacks", async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />,
    );

    const switchEl = screen.getByRole("switch");
    await user.click(switchEl);
    expect(handleFocus).toHaveBeenCalled();

    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
  });

  // Retained after review. The shared contract's switch.required.declared
  // accepts either the native attribute or aria-required, because a non-native
  // switch can only offer the latter — and Switch sets aria-required from a
  // form-level default too. Only this test pins `isRequired` to the NATIVE
  // attribute, which is what makes the browser block submission.
  it("sets required attribute when isRequired is true", () => {
    render(
      <Switch
        label="Enable notifications"
        value={false}
        onChange={() => {}}
        isRequired
      />,
    );
    expect(screen.getByRole("switch")).toBeRequired();
  });

  describe("disabledMessage", () => {
    const h = { hidden: true } as const;

    function getRow(): HTMLElement {
      return screen.getByRole("switch", h).closest("div")!.parentElement!;
    }

    it("shows the reason tooltip on hover when disabled with a reason", async () => {
      render(
        <Switch
          label="Enable notifications"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Notifications are turned off org-wide"
        />,
      );
      const tooltip = screen.getByRole("tooltip", h);
      expect(tooltip).toHaveTextContent("Notifications are turned off org-wide");
      fireEvent.mouseEnter(getRow());
      await waitFor(() => expect(tooltip).toHaveAttribute("popover-open"));
      fireEvent.mouseLeave(getRow());
      await waitFor(() => expect(tooltip).not.toHaveAttribute("popover-open"));
    });

    it("shows the reason tooltip on keyboard focus", async () => {
      const user = userEvent.setup();
      render(
        <Switch
          label="Enable notifications"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Notifications are turned off org-wide"
        />,
      );
      const tooltip = screen.getByRole("tooltip", h);
      await user.tab();
      expect(screen.getByRole("switch", h)).toHaveFocus();
      await waitFor(() => expect(tooltip).toHaveAttribute("popover-open"));
    });

    it("does not render a tooltip when not disabled", () => {
      render(
        <Switch
          label="Enable notifications"
          value={false}
          onChange={() => {}}
          disabledMessage="Notifications are turned off org-wide"
        />,
      );
      expect(screen.queryByRole("tooltip", h)).not.toBeInTheDocument();
    });

    it("does not render a tooltip when disabled without a reason", () => {
      render(
        <Switch
          label="Enable notifications"
          value={false}
          onChange={() => {}}
          isDisabled
        />,
      );
      expect(screen.queryByRole("tooltip", h)).not.toBeInTheDocument();
    });

    it("keeps the switch focusable via aria-disabled when a reason is provided", () => {
      render(
        <Switch
          label="Enable notifications"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Notifications are turned off org-wide"
        />,
      );
      const control = screen.getByRole("switch", h);
      expect(control).not.toBeDisabled();
      expect(control).toHaveAttribute("aria-disabled", "true");
    });

    it("links the reason tooltip via aria-describedby", () => {
      render(
        <Switch
          label="Enable notifications"
          value={false}
          onChange={() => {}}
          isDisabled
          disabledMessage="Notifications are turned off org-wide"
        />,
      );
      const control = screen.getByRole("switch", h);
      const tooltip = screen.getByRole("tooltip", h);
      expect(control.getAttribute("aria-describedby")).toContain(tooltip.id);
    });

    // The shared switch contract owns whether a switch reported as unavailable
    // actually stays unchanged; what stays here is Switch's own promise that it
    // never calls back while blocked.
    it("does not call onChange while focusable-disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Switch
          label="Enable notifications"
          value={false}
          onChange={onChange}
          isDisabled
          disabledMessage="Notifications are turned off org-wide"
        />,
      );
      await user.click(screen.getByRole("switch", h));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("stays focusable via aria-disabled when disabled without a reason", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onClick = vi.fn();
      render(
        <form>
          <Switch
            label="Enable notifications"
            value={false}
            onChange={onChange}
            onClick={onClick}
            htmlName="notifications"
            isRequired
            isDisabled
          />
        </form>,
      );
      const control = screen.getByRole("switch");
      expect(control).not.toHaveAttribute("disabled");
      expect(control).toHaveAttribute("aria-disabled", "true");
      await user.tab();
      expect(control).toHaveFocus();
      await user.keyboard(" ");
      await user.click(control);
      await user.click(screen.getByText("Enable notifications"));
      expect(onChange).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
      expect(control).not.toBeChecked();
      const form = control.closest("form")!;
      expect(form.checkValidity()).toBe(true);
      expect([...new FormData(form).keys()]).toEqual([]);
    });
  });
  describe("labelSpacing", () => {
    const getField = (container: HTMLElement) =>
      container.querySelector<HTMLElement>(".astryx-switch-field")!;

    it("omits the data attribute for the default hug spacing", () => {
      const { container } = render(
        <Switch label="Notify" value={false} onChange={() => {}} />,
      );
      expect(getField(container)).not.toHaveAttribute("data-label-spacing");
    });

    it("reflects spread spacing as a data attribute and variant class", () => {
      const { container } = render(
        <Switch
          label="Notify"
          value={false}
          onChange={() => {}}
          labelSpacing="spread"
        />,
      );
      expect(getField(container)).toHaveAttribute("data-label-spacing", "spread");
      expect(getField(container)).toHaveAttribute("data-label-spacing", "spread");
    });

    it("renders explicit hug the same as the default", () => {
      const { container: implicit } = render(
        <Switch label="Notify" value={false} onChange={() => {}} />,
      );
      const { container: explicit } = render(
        <Switch label="Notify" value={false} onChange={() => {}} labelSpacing="hug" />,
      );
      expect(getField(explicit)).not.toHaveAttribute("data-label-spacing");
      expect(getField(explicit).className).toBe(getField(implicit).className);
    });
  });
  describe("form participation", () => {
    it("submits under htmlName when on", () => {
      const { container } = render(
        <form>
          <Switch label="Notify" htmlName="notify" value={true} onChange={() => {}} />
        </form>,
      );
      const data = new FormData(container.querySelector("form")!);
      expect(data.get("notify")).toBe("on");
    });

    it("does not block form submission when required and disabled with a disabledMessage", () => {
      const { container } = render(
        <form>
          <Switch
            label="Notify"
            htmlName="notify"
            value={false}
            onChange={() => {}}
            isRequired
            isDisabled
            disabledMessage="Notifications are turned off org-wide"
          />
        </form>,
      );
      expect(container.querySelector("form")!.checkValidity()).toBe(true);
    });

    it("still blocks submission when required and off but enabled", () => {
      const { container } = render(
        <form>
          <Switch
            label="Notify"
            htmlName="notify"
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
          <Switch
            label="Notify"
            htmlName="notify"
            value={true}
            onChange={() => {}}
            isDisabled
            disabledMessage="Locked"
          />
        </form>,
      );
      expect([...new FormData(container.querySelector("form")!).keys()]).toEqual([]);
    });

    it("submits nothing when off or when htmlName is omitted", () => {
      const { container } = render(
        <form>
          <Switch label="Off" htmlName="off" value={false} onChange={() => {}} />
          <Switch label="Unnamed" value={true} onChange={() => {}} />
        </form>,
      );
      const data = new FormData(container.querySelector("form")!);
      expect([...data.keys()]).toEqual([]);
    });
  });

  describe("rest forwarding", () => {
    // ui-common fork: `id` and `aria-label` go to the native checkbox, not
    // the root (the fixes); the rest of aria-* still lands on the root.
    it("forwards data-testid and aria-* to the root element, and id and aria-label to the input", () => {
      const { container } = render(
        <Switch
          label="Notifications"
          value={false}
          onChange={() => {}}
          data-testid="my-switch"
          id="switch-1"
          aria-label="Toggle notifications"
        />,
      );
      const root = container.querySelector('[data-testid="my-switch"]');
      expect(root).not.toBeNull();
      expect(root).not.toHaveAttribute("id");
      expect(screen.getByRole("switch")).toHaveAttribute("id", "switch-1");
      expect(root).not.toHaveAttribute("aria-label");
      expect(screen.getByRole("switch")).toHaveAccessibleName("Toggle notifications");
    });

    it("composes a caller aria-describedby onto the switch control", () => {
      const { container } = render(
        <>
          <p id="external-hint">Applies to every repository</p>
          <Switch
            label="Notifications"
            description="Sends a daily digest"
            value={false}
            onChange={() => {}}
            data-testid="my-switch"
            aria-describedby="external-hint"
          />
        </>,
      );
      const control = screen.getByRole("switch");
      const description = screen.getByText("Sends a daily digest");
      expect(control.getAttribute("aria-describedby")?.split(" ")).toEqual([
        "external-hint",
        description.id,
      ]);
      expect(control).toHaveAccessibleDescription(
        "Applies to every repository Sends a daily digest",
      );
      // The id reference lives on the control only, not on the field wrapper.
      const root = container.querySelector('[data-testid="my-switch"]');
      expect(root).not.toHaveAttribute("aria-describedby");
    });

    it("names the switch control from a caller aria-labelledby", () => {
      const { container } = render(
        <>
          <span id="row-title">Release notes</span>
          <Switch
            label="Pin Release notes"
            isLabelHidden
            value={false}
            onChange={() => {}}
            data-testid="my-switch"
            aria-labelledby="row-title"
          />
        </>,
      );
      const control = screen.getByRole("switch", { name: "Release notes" });
      expect(control).toHaveAttribute("aria-labelledby", "row-title");
      // The id reference lives on the control only, not on the field wrapper.
      const root = container.querySelector('[data-testid="my-switch"]');
      expect(root).not.toHaveAttribute("aria-labelledby");
    });
  });
});

describe("label theme target", () => {
  it("names its own label so a theme can style it apart from a field label", () => {
    // See CheckboxInput: the control names the label it owns.
    render(<Switch label="Wi-Fi" value={false} onChange={() => {}} />);
    const label = screen.getByText("Wi-Fi").closest("label");
    expect(label).toHaveClass("astryx-field-label");
    expect(label).toHaveClass("astryx-switch-label");
  });
});
