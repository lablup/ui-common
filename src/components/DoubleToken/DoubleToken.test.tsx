import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DoubleToken } from "./DoubleToken";

// The weld is CSS (jsdom does not lay it out), so these pin the DOM contract
// DoubleToken.css is written against: the item class on direct-child tokens,
// in source order, with no gap between them.
const root = (container: HTMLElement) =>
  container.querySelector(".uic-double-token") as HTMLElement;

describe("DoubleToken", () => {
  it("renders the run with gap 0", () => {
    const { container } = render(<DoubleToken values={["User", "admin"]} />);
    expect(root(container)).toHaveAttribute("data-gap", "0");
  });

  it("renders each value as a direct token child, in source order", () => {
    const { container } = render(
      <DoubleToken
        values={[
          { label: "R", color: "green" },
          { label: "W", color: "blue" },
          { label: "D", color: "red" },
        ]}
      />,
    );
    const tokens = Array.from(root(container).children);
    expect(tokens).toHaveLength(3);
    tokens.forEach((el) => expect(el).toHaveClass("uic-double-token__item"));
    expect(tokens.map((el) => el.textContent)).toEqual(["R", "W", "D"]);
    expect(tokens.map((el) => el.getAttribute("data-color"))).toEqual([
      "green",
      "blue",
      "red",
    ]);
  });

  it("colours the string shorthand blue", () => {
    const { container } = render(<DoubleToken values={["only"]} />);
    expect(root(container).children[0]).toHaveAttribute("data-color", "blue");
  });

  it("skips empty labels and renders nothing for no values", () => {
    const { container } = render(
      <DoubleToken
        values={[
          { label: "User", color: "blue" },
          { label: "", color: "default" },
        ]}
      />,
    );
    expect(root(container).children).toHaveLength(1);

    const empty = render(<DoubleToken values={[]} />);
    expect(empty.container).toBeEmptyDOMElement();
  });

  it("keeps the plain label as the accessible name when highlighting", () => {
    const { container } = render(
      <DoubleToken values={["python", "3.11"]} highlightKeyword="py" />,
    );
    const tokens = Array.from(root(container).children);
    expect(tokens[0]).toHaveAttribute("aria-label", "python");
    expect(screen.getByText("py")).toHaveClass("uic-text-highlighter__match");
  });
});
