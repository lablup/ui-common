import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { BoardItemTitle } from "./BoardItemTitle";

describe("BoardItemTitle", () => {
  it("renders a string title as a level-5 heading", () => {
    render(<BoardItemTitle title="Active sessions" />);
    expect(
      screen.getByRole("heading", { level: 5, name: "Active sessions" }),
    ).toBeInTheDocument();
  });

  it("renders a node title as is", () => {
    render(<BoardItemTitle title={<span data-testid="custom">Custom</span>} />);
    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("names a help button after its tooltip only when there is one", () => {
    const { rerender } = render(<BoardItemTitle title="Usage" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <BoardItemTitle
        title="Usage"
        tooltip="Counts running sessions"
        tooltipIcon={<svg data-testid="glyph" />}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Counts running sessions" }),
    ).toContainElement(screen.getByTestId("glyph"));
  });

  it("puts the end content in its own group after the title", () => {
    const { container } = render(
      <BoardItemTitle
        title="Usage"
        endContent={<button type="button">Refresh</button>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("uic-board-item-title");
    const [start, end] = Array.from(root.children);
    expect(start).toHaveTextContent("Usage");
    expect(end).toHaveClass("uic-board-item-title__end");
    expect(end).toContainElement(screen.getByRole("button", { name: "Refresh" }));
  });

  it("renders in place outside a Board item, inline or not", () => {
    const { container, rerender } = render(<BoardItemTitle title="Usage" />);
    expect(container.firstElementChild).toHaveClass("uic-board-item-title");
    rerender(<BoardItemTitle title="Usage" inline />);
    expect(container.firstElementChild).toHaveClass("uic-board-item-title");
    expect(screen.getByRole("heading", { name: "Usage" })).toBeInTheDocument();
  });

  it("passes class names, inline styles and attributes to the row", () => {
    const { container } = render(
      <BoardItemTitle
        title="Usage"
        className="extra"
        style={{ paddingBlock: 0 }}
        data-testid="row"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("uic-board-item-title", "extra");
    expect(root.style.paddingBlock).toBe("0px");
    expect(root).toHaveAttribute("data-testid", "row");
  });

  // jsdom drops `@layer`, so the flex rules are read from the stylesheet source.
  describe("shrinking", () => {
    const CSS = readFileSync(join(__dirname, "BoardItemTitle.css"), "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );

    /** Declarations of every rule whose selector list includes `selector`. */
    function declarationsFor(selector: string): string[] {
      return [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter((m) =>
          (m[1] ?? "")
            .split(",")
            .map((s) => s.trim())
            .includes(selector),
        )
        .flatMap((m) =>
          (m[2] ?? "")
            .split(";")
            .map((d) => d.trim().replace(/\s+/g, " "))
            .filter(Boolean),
        );
    }

    it("lets the title group shrink below its text, so a long title wraps", () => {
      const group = declarationsFor(".uic-board-item-title__group");
      expect(group).toContain("flex-shrink: 1");
      expect(group).toContain("min-width: 0");
    });

    it("keeps the end-content group at its own width", () => {
      expect(declarationsFor(".uic-board-item-title__end")).toContain("flex-shrink: 0");
    });
  });
});
