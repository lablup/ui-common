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
    expect(trigger).toHaveAttribute("aria-hidden", "true");
    expect(trigger).not.toHaveAttribute("aria-label");
    expect(trigger).not.toHaveClass("uic-icon-with-tooltip--button");
  });

  it("leaves the name of an enclosing control to that control when not focusable", () => {
    render(
      <>
        <button type="button">
          Serving{" "}
          <IconWithTooltip
            icon={glyph}
            content="Deployments with Desired Replicas set to 1 or more"
            focusable={false}
          />
        </button>
        <label>
          <input type="radio" name="status" />
          Stopped{" "}
          <IconWithTooltip
            icon={glyph}
            content="No replicas wanted"
            focusable={false}
          />
        </label>
      </>,
    );
    expect(screen.getByRole("button", { name: "Serving" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Stopped" })).toBeInTheDocument();
  });

  it("adds the tooltip text to the enclosing control's name with isContentInName", async () => {
    const { container } = render(
      <div role="listbox" aria-label="Projects">
        <div role="option" aria-selected="false">
          frontend-default{" "}
          <IconWithTooltip
            icon={glyph}
            content="Project Admin"
            delay={0}
            focusable={false}
            isContentInName
          />
        </div>
      </div>,
    );
    const option = screen.getByRole("option", {
      name: "frontend-default Project Admin",
    });
    expect(option).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    const trigger = container.querySelector(".uic-icon-with-tooltip");
    expect(trigger).toHaveAttribute("aria-hidden", "true");
    expect(trigger).not.toHaveAttribute("aria-label");

    await userEvent.hover(screen.getByTestId("glyph"));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Project Admin");
    expect(trigger?.contains(tooltip)).toBe(false);
    // The tooltip stays anchored on the icon, not on the hidden text.
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("names a button around a non-focusable trigger with isContentInName", () => {
    render(
      <button type="button">
        Name{" "}
        <IconWithTooltip
          icon={glyph}
          content={
            <>
              Project <strong>Admin</strong>
            </>
          }
          focusable={false}
          isContentInName
        />
      </button>,
    );
    expect(
      screen.getByRole("button", { name: "Name Project Admin" }),
    ).toBeInTheDocument();
  });

  it("ignores isContentInName on a focusable trigger", () => {
    render(<IconWithTooltip icon={glyph} content="Hint" isContentInName />);
    expect(screen.getByRole("button", { name: "Hint" })).toBeInTheDocument();
    // The only "Hint" text is the tooltip's own; no hidden copy is added.
    const texts = screen.getAllByText("Hint");
    expect(texts).toHaveLength(1);
    expect(texts[0]?.closest('[role="tooltip"]')).not.toBeNull();
  });

  it("names a focusable trigger by the tooltip text, apart from its neighbour", () => {
    render(
      <>
        <span>Serving</span>
        <IconWithTooltip
          icon={glyph}
          content="Deployments with Desired Replicas set to 1 or more"
        />
      </>,
    );
    expect(
      screen.getByRole("button", {
        name: "Deployments with Desired Replicas set to 1 or more",
      }),
    ).toBeInTheDocument();
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

  it("shows the tooltip on hover when not focusable", async () => {
    render(
      <IconWithTooltip icon={glyph} content="Hint text" delay={0} focusable={false} />,
    );
    await userEvent.hover(screen.getByTestId("glyph"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Hint text");
  });

  it("keeps a non-focusable trigger's tooltip outside its aria-hidden span, so assistive tech can reach it", async () => {
    // Fails if Astryx ever renders the popover inside the trigger.
    const { container } = render(
      <IconWithTooltip icon={glyph} content="Hint text" delay={0} focusable={false} />,
    );
    const trigger = container.querySelector(".uic-icon-with-tooltip");
    await userEvent.hover(screen.getByTestId("glyph"));
    const tooltip = await screen.findByRole("tooltip", { hidden: true });
    expect(trigger?.contains(tooltip)).toBe(false);
    expect(tooltip.closest('[aria-hidden="true"]')).toBeNull();
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
