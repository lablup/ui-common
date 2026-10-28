/**
 * ui-common's tests for its Stat fork: the addition it carries (`deltaTooltip`,
 * a tooltip anchored to the delta and reachable by keyboard, with `media`
 * outside it), and that without it everything renders exactly as lab's does.
 */
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Stat as UpstreamStat,
  type StatProps as UpstreamStatProps,
} from "@astryxdesign/lab";

import { comparableMarkup } from "../../test/forkParity";
import { Stat } from "./Stat";

const delta = { value: "-918", direction: "down" } as const;
const explanation = "Previous 7 days: 2,122";
// The tooltip stays in the DOM while closed, hidden from the accessibility tree.
const h = { hidden: true };

const originalMatches = HTMLElement.prototype.matches;

// jsdom has no popover API; reflect the tooltip's open state in an attribute.
// Its `:focus-visible` matches form controls only, where a browser matches any
// element focused from the keyboard, and the tooltip opens on that.
beforeEach(() => {
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute("popover-open", "");
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute("popover-open");
  });
  HTMLElement.prototype.matches = function (this: HTMLElement, selector: string) {
    if (selector === ":popover-open") return this.hasAttribute("popover-open");
    if (selector === ":focus-visible") return this === document.activeElement;
    return originalMatches.call(this, selector);
  };
});

afterEach(() => {
  HTMLElement.prototype.matches = originalMatches;
  // @ts-expect-error: restore jsdom's absence of the popover API
  delete HTMLElement.prototype.showPopover;
  // @ts-expect-error: as above
  delete HTMLElement.prototype.hidePopover;
});

describe("Stat fork: deltaTooltip", () => {
  it("shows the explanation when the delta is hovered", async () => {
    const user = userEvent.setup();
    render(
      <Stat label="Sessions" value="1,204" delta={delta} deltaTooltip={explanation} />,
    );
    const tooltip = screen.getByRole("tooltip", h);
    expect(tooltip).toHaveTextContent(explanation);
    expect(tooltip).not.toHaveAttribute("popover-open");

    await user.hover(screen.getByText("-918"));
    await waitFor(() => expect(tooltip).toHaveAttribute("popover-open"));
  });

  it("makes the delta reachable by keyboard and describes it by the tooltip", async () => {
    const user = userEvent.setup();
    render(
      <Stat label="Sessions" value="1,204" delta={delta} deltaTooltip={explanation} />,
    );
    const deltaElement = screen.getByText("-918");
    const tooltip = screen.getByRole("tooltip", h);
    expect(deltaElement).toHaveAttribute("tabindex", "0");
    expect(deltaElement.getAttribute("aria-describedby")?.split(" ")).toContain(
      tooltip.id,
    );

    await user.tab();
    expect(deltaElement).toHaveFocus();
    await waitFor(() => expect(tooltip).toHaveAttribute("popover-open"));
  });

  it("anchors to the delta, leaving the value and media outside it", async () => {
    const user = userEvent.setup();
    render(
      <Stat
        label="Sessions"
        value="1,204"
        delta={delta}
        deltaTooltip={explanation}
        media={<svg data-testid="sparkline" />}
      />,
    );
    const tooltip = screen.getByRole("tooltip", h);
    await user.hover(screen.getByTestId("sparkline"));
    await user.hover(screen.getByText("1,204"));
    // Longer than the tooltip's 200ms hover delay.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(tooltip).not.toHaveAttribute("popover-open");
    expect(screen.getByTestId("sparkline").closest("[aria-describedby]")).toBeNull();
    expect(screen.getByText("1,204").closest("[aria-describedby]")).toBeNull();
  });

  it("is ignored without a delta", () => {
    const { container } = render(
      <Stat label="Sessions" value="1,204" deltaTooltip={explanation} />,
    );
    expect(screen.queryByRole("tooltip", h)).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(container.querySelector("[aria-describedby]")).toBeNull();
  });

  // When this fails, lab has a way to explain the delta: delete the fork and
  // its exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("is not in lab's Stat, whose delta never takes focus", () => {
    expectTypeOf<UpstreamStatProps>().not.toHaveProperty("deltaTooltip");
    render(<UpstreamStat label="Sessions" value="1,204" delta={delta} />);
    expect(screen.getByText("-918")).not.toHaveAttribute("tabindex");
  });
});

describe("Stat fork: parity with lab", () => {
  const cases: Array<[string, ComponentProps<typeof UpstreamStat>]> = [
    ["label and value", { label: "Sessions", value: "1,204" }],
    [
      "every slot",
      {
        label: "Error rate",
        value: "0.42%",
        delta: { value: "-0.08%", direction: "down", sentiment: "positive" },
        description: "vs. previous 30 days",
        media: <svg data-testid="sparkline" />,
        size: "lg",
        className: "extra",
        style: { margin: 0 },
      },
    ],
    [
      "a flat delta",
      {
        label: "Active users",
        value: "18,204",
        delta: { value: "0.0%", direction: "flat" },
      },
    ],
  ];

  it.each(cases)("renders lab's markup (%s)", (_, props) => {
    const fork = render(<Stat {...props} />);
    const upstream = render(<UpstreamStat {...props} />);
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });
});
