import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CountBadge } from "./CountBadge";

const anchor = <span>anchor</span>;

describe("CountBadge", () => {
  it("overlays the count on its child as a named live region", () => {
    render(
      <CountBadge count={3} label="3 unread notifications">
        {anchor}
      </CountBadge>,
    );
    const overlay = screen.getByRole("status", { name: "3 unread notifications" });
    expect(overlay).toHaveTextContent("3");
    expect(screen.getByText("anchor")).toBeInTheDocument();
  });

  it("caps the count at max", () => {
    render(<CountBadge count={120}>{anchor}</CountBadge>);
    expect(screen.getByRole("status")).toHaveTextContent("99+");
  });

  it("takes a custom max", () => {
    render(
      <CountBadge count={12} max={9}>
        {anchor}
      </CountBadge>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("9+");
  });

  it("renders no overlay for a missing or zero count", () => {
    const { rerender } = render(<CountBadge>{anchor}</CountBadge>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<CountBadge count={0}>{anchor}</CountBadge>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps a zero count with isZeroShown", () => {
    render(
      <CountBadge count={0} isZeroShown>
        {anchor}
      </CountBadge>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("renders a dot carrying its variant, with no count", () => {
    const { container } = render(
      <CountBadge hasDot variant="error" label="New">
        {anchor}
      </CountBadge>,
    );
    const dot = container.querySelector(".uic-count-badge__dot");
    expect(dot).toHaveAttribute("data-variant", "error");
    expect(screen.getByRole("status", { name: "New" })).toHaveTextContent("");
  });

  it("puts className and style on the wrapper, an ancestor of the overlay", () => {
    const { container } = render(
      <CountBadge className="scoping-hook" style={{ margin: 4 }} hasDot>
        {anchor}
      </CountBadge>,
    );
    const wrapper = container.querySelector(".scoping-hook");
    expect(wrapper).toHaveClass("uic-count-badge");
    expect(wrapper).toHaveStyle({ margin: "4px" });
    expect(
      container.querySelector(".scoping-hook .uic-count-badge__overlay"),
    ).toBeInTheDocument();
  });

  it("marks the small size and passes the offset as custom properties", () => {
    render(
      <CountBadge count={2} size="sm" offset={[4, -2]}>
        {anchor}
      </CountBadge>,
    );
    const overlay = screen.getByRole("status");
    expect(overlay).toHaveClass("uic-count-badge__overlay--sm");
    expect(overlay.style.getPropertyValue("--uic-count-badge-offset-x")).toBe("4px");
    expect(overlay.style.getPropertyValue("--uic-count-badge-offset-y")).toBe("-2px");
  });

  it("forwards the remaining props to the Badge", () => {
    render(
      <CountBadge count={5} variant="success" data-testid="pill">
        {anchor}
      </CountBadge>,
    );
    const pill = screen.getByTestId("pill");
    expect(pill).toHaveClass("uic-count-badge__pill");
    expect(pill).toHaveAttribute("data-variant", "success");
  });
});
