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
});
