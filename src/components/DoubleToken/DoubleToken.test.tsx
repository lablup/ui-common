import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DoubleToken, type DoubleTokenProps } from "./DoubleToken";

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

  it("takes shorthand and object values mixed in one list", () => {
    // Type-level too: `pnpm run typecheck` rejects this file if the element
    // type is not a union.
    const values: DoubleTokenProps["values"] = [
      { label: "CUDA", color: "green" },
      "12.4",
    ];
    const { container } = render(<DoubleToken values={values} />);
    expect(
      Array.from(root(container).children).map((el) => [
        el.textContent,
        el.getAttribute("data-color"),
      ]),
    ).toEqual([
      ["CUDA", "green"],
      ["12.4", "blue"],
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

  it("renders a value's endContent in place of its visible label", () => {
    const { container } = render(
      <DoubleToken
        values={[
          { label: "role", color: "default" },
          {
            label: "abc-123",
            endContent: <span data-testid="copyable">abc-123 (copy)</span>,
          },
        ]}
      />,
    );
    const tokens = Array.from(root(container).children);
    expect(tokens[0]).toHaveTextContent("role");
    expect(tokens[1]).toHaveAttribute("aria-label", "abc-123");
    expect(tokens[1]).toContainElement(screen.getByTestId("copyable"));
    // The hidden label is still in the DOM, visually hidden.
    expect(tokens[1]?.textContent).toBe("abc-123abc-123 (copy)");
  });

  it("leaves highlighting inside a caller's endContent to the caller", () => {
    render(
      <DoubleToken
        highlightKeyword="py"
        values={[
          { label: "python" },
          { label: "pytorch", endContent: <span data-testid="own">pytorch</span> },
        ]}
      />,
    );
    expect(screen.getAllByText("py")).toHaveLength(1);
    expect(screen.getByTestId("own")).toHaveTextContent("pytorch");
  });

  // A copy control's tooltip renders as a trailing sibling of the tokens, so
  // `:last-child` would never match the last token and leave its end square.
  it("squares inner end corners by element type, not child position", () => {
    const css = readFileSync(join(__dirname, "DoubleToken.css"), "utf8");
    expect(css).toContain(".uic-double-token__item:not(:last-of-type)");
    expect(css).not.toContain(":not(:last-child)");
  });
});
