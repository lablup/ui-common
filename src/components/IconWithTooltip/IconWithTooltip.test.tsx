import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { nodeToAccessibleLabel } from "./accessibleLabel";
import { IconWithTooltip } from "./IconWithTooltip";

const glyph = <svg data-testid="glyph" />;

describe("IconWithTooltip", () => {
  it("renders a focusable button named by the tooltip text", async () => {
    render(<IconWithTooltip icon={glyph} content="Counts running sessions only" />);
    const trigger = screen.getByRole("button", {
      name: "Counts running sessions only",
    });
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveClass(
      "uic-icon-with-tooltip",
      "uic-icon-with-tooltip--button",
    );
    expect(trigger).toContainElement(screen.getByTestId("glyph"));

    await userEvent.tab();
    expect(trigger).toHaveFocus();
  });

  it("names the trigger from a node's text", () => {
    render(
      <IconWithTooltip
        icon={glyph}
        content={
          <>
            Quota <strong>exceeded</strong>
          </>
        }
      />,
    );
    expect(screen.getByRole("button", { name: "Quota exceeded" })).toBeInTheDocument();
  });

  it("renders a plain span when not focusable", () => {
    const { container } = render(
      <IconWithTooltip icon={glyph} content="Hint" focusable={false} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const trigger = container.querySelector(".uic-icon-with-tooltip");
    expect(trigger?.tagName).toBe("SPAN");
    expect(trigger).toHaveAttribute("aria-label", "Hint");
    expect(trigger).not.toHaveClass("uic-icon-with-tooltip--button");
  });

  it("puts className and style on the trigger", () => {
    render(
      <IconWithTooltip
        icon={glyph}
        content="Hint"
        className="extra"
        style={{ marginInlineStart: 4 }}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Hint" });
    expect(trigger).toHaveClass("extra");
    expect(trigger).toHaveStyle({ marginInlineStart: "4px" });
  });

  it("shows the tooltip on hover", async () => {
    render(<IconWithTooltip icon={glyph} content="Hint text" delay={0} />);
    await userEvent.hover(screen.getByRole("button", { name: "Hint text" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Hint text");
  });
});

describe("nodeToAccessibleLabel", () => {
  it("joins string and number leaves and ignores the rest", () => {
    expect(
      nodeToAccessibleLabel(
        <span>
          {3} <em>items</em>
          {null}
          {false}
          <svg />
        </span>,
      ),
    ).toBe("3 items");
  });

  it("yields an empty string for a node with no text", () => {
    expect(nodeToAccessibleLabel(<svg />)).toBe("");
  });
});
