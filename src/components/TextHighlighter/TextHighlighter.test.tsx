import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { TextHighlighter } from "./TextHighlighter";

const matches = (container: HTMLElement) =>
  [...container.querySelectorAll(".uic-text-highlighter__match")].map(
    (el) => el.textContent,
  );

describe("TextHighlighter", () => {
  it("marks every case-insensitive occurrence, keeping the original case", () => {
    const { container } = render(
      <TextHighlighter keyword="backend">Backend.AI runs backend work</TextHighlighter>,
    );
    expect(matches(container)).toEqual(["Backend", "backend"]);
    expect(container.textContent).toBe("Backend.AI runs backend work");
  });

  it("matches regex characters literally", () => {
    const { container } = render(
      <TextHighlighter keyword="(a+b)">sum (a+b) and a+b</TextHighlighter>,
    );
    expect(matches(container)).toEqual(["(a+b)"]);
  });

  it("renders plain text without a keyword and nothing without text", () => {
    const plain = render(<TextHighlighter>plain</TextHighlighter>);
    expect(plain.container.textContent).toBe("plain");
    expect(matches(plain.container)).toEqual([]);

    const empty = render(<TextHighlighter keyword="x">{null}</TextHighlighter>);
    expect(empty.container).toBeEmptyDOMElement();
  });

  it("applies highlightStyle to each mark and className to the root", () => {
    const { container } = render(
      <TextHighlighter
        keyword="a"
        className="host"
        highlightStyle={{ fontWeight: 700 }}
      >
        a-a
      </TextHighlighter>,
    );
    expect(container.firstElementChild).toHaveClass("uic-text-highlighter", "host");
    const marks = container.querySelectorAll<HTMLElement>(
      ".uic-text-highlighter__match",
    );
    expect(marks).toHaveLength(2);
    expect(marks[0]?.style.fontWeight).toBe("700");
  });

  it("paints the mark from the custom property, defaulting to warning-muted", () => {
    const css = readFileSync(join(__dirname, "TextHighlighter.css"), "utf8");
    expect(css).toMatch(
      /background-color:\s*var\(\s*--uic-text-highlighter-background,\s*var\(--color-warning-muted\)\s*\)/,
    );
  });
});
