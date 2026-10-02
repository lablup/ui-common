import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TokenList } from "./TokenList";

// jsdom implements no Popover API, so "is it open" is not observable. Which
// control the trigger is wired as is: a Popover trigger carries
// aria-haspopup / aria-expanded, a HoverCard trigger does not.
const ITEMS = ["a@example.com", "b@example.com", "c@example.com", "d@example.com"];

const overflow = () => screen.getByText("+1");

// Badge and Link wrap their label in an inner span; resolve up to the
// element that carries the trigger's role and focusability.
const trigger = () =>
  overflow().closest<HTMLElement>('button, [role="button"], [tabindex]') ?? overflow();

describe("TokenList", () => {
  it("renders inline items as Tokens and the rest behind +N", () => {
    const { container } = render(<TokenList items={["a", 2, "c", "d"]} />);
    const tokens = container.querySelectorAll(".astryx-token");
    expect(Array.from(tokens).map((el) => el.textContent)).toEqual(["a", "2", "c"]);
    expect(overflow()).toBeInTheDocument();
  });

  it("shows no overflow while every item fits", () => {
    render(<TokenList items={["a", "b"]} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("renders the text variant as plain text with a +N badge", () => {
    const { container } = render(
      <TokenList items={ITEMS} maxInline={2} variant="text" />,
    );
    expect(container.querySelectorAll(".astryx-token")).toHaveLength(0);
    expect(screen.getByText("a@example.com")).toHaveClass("uic-token-list__text");
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("falls back to emptyText", () => {
    const { container, rerender } = render(<TokenList items={[]} />);
    expect(container).toHaveTextContent("-");
    rerender(<TokenList items={[]} emptyText="none" />);
    expect(container).toHaveTextContent("none");
  });

  it("opens the overflow on hover by default, in both variants", () => {
    const { unmount } = render(<TokenList items={ITEMS} />);
    expect(trigger()).not.toHaveAttribute("aria-haspopup");
    expect(trigger()).not.toHaveAttribute("aria-expanded");
    unmount();
    render(<TokenList items={ITEMS} variant="text" />);
    expect(trigger()).not.toHaveAttribute("aria-haspopup");
  });

  it('latches open as a popover for trigger="click", on a button', () => {
    render(<TokenList items={ITEMS} trigger="click" />);
    expect(trigger()).toHaveAttribute("aria-haspopup");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(overflow().closest("button")).toBeInTheDocument();
  });

  it.each([
    ["token", undefined],
    ["text", "text"],
  ] as const)("keeps the %s hover trigger focusable", (_name, variant) => {
    render(<TokenList items={ITEMS} variant={variant} />);
    const el = trigger();
    expect(el.tagName === "BUTTON" || el.tabIndex >= 0).toBe(true);
  });

  it("does not put the overflow list in a Tooltip", () => {
    render(<TokenList items={ITEMS} />);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    expect(document.querySelectorAll("[popover]")).toHaveLength(0);
  });
});
