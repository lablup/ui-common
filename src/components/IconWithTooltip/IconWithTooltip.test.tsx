import { useState } from "react";
import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "../../formControls/SegmentedControl";
import { nodeToAccessibleLabel } from "./accessibleLabel";
import { IconWithTooltip } from "./IconWithTooltip";

const glyph = <svg data-testid="glyph" />;

// Not re-rendered by its parent, so only the MutationObserver can restore the id.
const memoIcon = (
  <IconWithTooltip
    icon={glyph}
    content="Replicas wanted"
    focusable={false}
    announceAs="description"
  />
);
function MemoIcon() {
  return memoIcon;
}

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

  it('adds the tooltip text to the enclosing control\'s name with announceAs="name"', async () => {
    const { container } = render(
      <div role="listbox" aria-label="Projects">
        <div role="option" aria-selected="false">
          frontend-default{" "}
          <IconWithTooltip
            icon={glyph}
            content="Project Admin"
            delay={0}
            focusable={false}
            announceAs="name"
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

  it('names a button around a non-focusable trigger with announceAs="name"', () => {
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
          announceAs="name"
        />
      </button>,
    );
    expect(
      screen.getByRole("button", { name: "Name Project Admin" }),
    ).toBeInTheDocument();
  });

  it.each(["name", "description"] as const)(
    'ignores announceAs="%s" on a focusable trigger',
    (announceAs) => {
      render(
        <div role="option" aria-selected="false">
          <IconWithTooltip icon={glyph} content="Hint" announceAs={announceAs} />
        </div>,
      );
      const button = screen.getByRole("button", { name: "Hint" });
      expect(button).toBeInTheDocument();
      // The only "Hint" text is the tooltip's own; no hidden copy is added.
      const texts = screen.getAllByText("Hint", { ignore: false });
      expect(texts).toHaveLength(1);
      expect(texts[0]?.closest('[role="tooltip"]')).not.toBeNull();
      expect(screen.getByRole("option")).not.toHaveAttribute("aria-describedby");
    },
  );

  it('describes an enclosing button with announceAs="description"', () => {
    render(
      <button type="button">
        Serving{" "}
        <IconWithTooltip
          icon={glyph}
          content="Deployments with Desired Replicas set to 1 or more"
          focusable={false}
          announceAs="description"
        />
      </button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName("Serving");
    expect(button).toHaveAccessibleDescription(
      "Deployments with Desired Replicas set to 1 or more",
    );
  });

  it('describes a SegmentedControl item with announceAs="description"', () => {
    render(
      <SegmentedControl aria-label="Status" defaultValue="serving">
        <SegmentedControlItem
          value="serving"
          // Astryx types label as a string but renders it as a child.
          label={
            (
              <>
                Serving{" "}
                <IconWithTooltip
                  icon={glyph}
                  content="Desired Replicas set to 1 or more"
                  focusable={false}
                  announceAs="description"
                />
              </>
            ) as unknown as string
          }
        />
        <SegmentedControlItem value="stopped" label="Stopped" />
      </SegmentedControl>,
    );
    const radio = screen.getByRole("radio", { name: "Serving" });
    expect(radio.tagName).toBe("BUTTON");
    expect(radio).toHaveAccessibleName("Serving");
    expect(radio).toHaveAccessibleDescription("Desired Replicas set to 1 or more");
    expect(screen.getByRole("radio", { name: "Stopped" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it('describes an enclosing option with announceAs="description"', () => {
    render(
      <div role="listbox" aria-label="Projects">
        <div role="option" aria-selected="false">
          frontend-default{" "}
          <IconWithTooltip
            icon={glyph}
            content="Project Admin"
            focusable={false}
            announceAs="description"
          />
        </div>
      </div>,
    );
    const option = screen.getByRole("option");
    expect(option).toHaveAccessibleName("frontend-default");
    expect(option).toHaveAccessibleDescription("Project Admin");
  });

  it("keeps the control's own aria-describedby and removes only its id on unmount", () => {
    function Host({
      showIcon,
      describedBy,
    }: {
      showIcon: boolean;
      describedBy?: string;
    }) {
      return (
        <>
          <p id="own">Own hint.</p>
          <button type="button" aria-describedby={describedBy}>
            Serving{" "}
            {showIcon ? (
              <IconWithTooltip
                icon={glyph}
                content="Replicas wanted"
                focusable={false}
                announceAs="description"
              />
            ) : null}
          </button>
        </>
      );
    }
    const { rerender } = render(<Host showIcon describedBy="own" />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-describedby")).toMatch(/^own \S+$/);
    expect(button).toHaveAccessibleDescription("Own hint. Replicas wanted");

    rerender(<Host showIcon={false} describedBy="own" />);
    expect(button).toHaveAttribute("aria-describedby", "own");

    rerender(<Host showIcon />);
    expect(button.getAttribute("aria-describedby")).toMatch(/^\S+$/);
    rerender(<Host showIcon={false} />);
    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("puts its id back after React rewrites the control's aria-describedby", async () => {
    let setDescribedBy: (value: string) => void = () => {};
    function Host() {
      const [describedBy, set] = useState("a");
      setDescribedBy = set;
      return (
        <>
          <p id="a">First.</p>
          <p id="b">Second.</p>
          <button type="button" aria-describedby={describedBy}>
            Serving <MemoIcon />
          </button>
        </>
      );
    }
    render(<Host />);
    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleDescription("First. Replicas wanted");

    act(() => setDescribedBy("b"));
    await waitFor(() =>
      expect(button).toHaveAccessibleDescription("Second. Replicas wanted"),
    );
    expect(button.getAttribute("aria-describedby")?.split(" ")).toHaveLength(2);
  });

  it("adds nothing and does not throw without an enclosing control", () => {
    const { container } = render(
      <p>
        Serving{" "}
        <IconWithTooltip
          icon={glyph}
          content="Replicas wanted"
          focusable={false}
          announceAs="description"
        />
      </p>,
    );
    expect(
      container.querySelector("[aria-describedby]:not(.uic-icon-with-tooltip)"),
    ).toBeNull();
  });

  it('shows the tooltip on hover with announceAs="description", outside the aria-hidden span', async () => {
    const { container } = render(
      <button type="button">
        Serving{" "}
        <IconWithTooltip
          icon={glyph}
          content="Replicas wanted"
          delay={0}
          focusable={false}
          announceAs="description"
        />
      </button>,
    );
    const trigger = container.querySelector(".uic-icon-with-tooltip");
    await userEvent.hover(screen.getByTestId("glyph"));
    const tooltip = await screen.findByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveTextContent("Replicas wanted");
    expect(trigger?.contains(tooltip)).toBe(false);
    expect(tooltip.closest('[aria-hidden="true"]')).toBeNull();
    // The tooltip stays anchored on the icon, not on the description text.
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("adds no text for assistive tech by default when not focusable", () => {
    render(
      <button type="button">
        Serving{" "}
        <IconWithTooltip icon={glyph} content="Replicas wanted" focusable={false} />
      </button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName("Serving");
    expect(button).not.toHaveAttribute("aria-describedby");
    // The only copy of the text is the tooltip's own.
    const texts = screen.getAllByText("Replicas wanted");
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
