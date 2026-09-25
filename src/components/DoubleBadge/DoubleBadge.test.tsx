import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { DoubleBadge } from "./DoubleBadge";

const root = (c: HTMLElement) => c.querySelector(".uic-double-badge") as HTMLElement;

describe("DoubleBadge", () => {
  it("anchors the weld on `uic-double-badge` and pins the gap to 0", () => {
    const { container } = render(<DoubleBadge values={["ALIVE", "26.4"]} />);
    expect(root(container)).toBeInTheDocument();
    expect(root(container)).toHaveAttribute("data-gap", "0");
  });

  it("renders each value as a direct, welded badge child with its variant", () => {
    const { container } = render(
      <DoubleBadge
        values={[{ label: "ALIVE", variant: "success" }, { label: "26.4.0" }]}
      />,
    );
    const badges = Array.from(root(container).children);
    expect(badges).toHaveLength(2);
    badges.forEach((el) => expect(el).toHaveClass("uic-double-badge__item"));
    expect(badges.map((el) => el.textContent)).toEqual(["ALIVE", "26.4.0"]);
    expect(badges.map((el) => el.getAttribute("data-variant"))).toEqual([
      "success",
      "neutral",
    ]);
  });

  it("renders the string shorthand as neutral", () => {
    const { container } = render(<DoubleBadge values={["Elapsed", "1m"]} />);
    Array.from(root(container).children).forEach((el) =>
      expect(el).toHaveAttribute("data-variant", "neutral"),
    );
  });

  it("skips empty labels and renders nothing for an empty list", () => {
    const { container } = render(
      <DoubleBadge values={[{ label: "A" }, { label: "" }]} />,
    );
    expect(root(container).children).toHaveLength(1);
    const { container: empty } = render(<DoubleBadge values={[]} />);
    expect(empty).toBeEmptyDOMElement();
  });
});
