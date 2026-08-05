/**
 * Button Component Tests
 *
 * Tests for the shared Button component covering variants, sizes, shapes,
 * icon modes, states (loading, active, disabled), accessibility attributes,
 * ref forwarding, and event handler behavior.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Button } from "./Button";

describe("Button", () => {
  // =============================================
  // Rendering basics
  // =============================================

  it("renders with default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toBeDisabled();
  });

  it("renders children as text content", () => {
    render(<Button>Submit</Button>);

    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("renders without children (icon-only case)", () => {
    render(<Button iconOnly ariaLabel="Close" icon={<svg data-testid="icon" />} />);

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeInTheDocument();
  });

  // =============================================
  // Variant class names
  // =============================================

  describe("variants", () => {
    const variants = [
      "primary",
      "secondary",
      "danger",
      "success",
      "ghost",
      "text",
      "outline",
    ] as const;

    variants.forEach((variant) => {
      it(`applies button--${variant} class`, () => {
        const { container } = render(<Button variant={variant}>Button</Button>);

        const button = container.querySelector(`.button--${variant}`);
        expect(button).toBeInTheDocument();
      });
    });

    it("defaults to secondary variant", () => {
      const { container } = render(<Button>Button</Button>);

      expect(container.querySelector(".button--secondary")).toBeInTheDocument();
    });
  });

  // =============================================
  // Size class names
  // =============================================

  describe("sizes", () => {
    const sizes = ["xsmall", "small", "medium", "large"] as const;

    sizes.forEach((size) => {
      it(`applies button--${size} class`, () => {
        const { container } = render(<Button size={size}>Button</Button>);

        const button = container.querySelector(`.button--${size}`);
        expect(button).toBeInTheDocument();
      });
    });

    it("defaults to medium size", () => {
      const { container } = render(<Button>Button</Button>);

      expect(container.querySelector(".button--medium")).toBeInTheDocument();
    });
  });

  // =============================================
  // Shape
  // =============================================

  describe("shape", () => {
    it("does not apply shape class for default shape", () => {
      const { container } = render(<Button>Button</Button>);

      expect(container.querySelector(".button--default")).not.toBeInTheDocument();
    });

    it("applies button--circle class for circle shape", () => {
      const { container } = render(<Button shape="circle">Button</Button>);

      expect(container.querySelector(".button--circle")).toBeInTheDocument();
    });
  });

  // =============================================
  // Full width
  // =============================================

  it("applies full-width class when fullWidth is true", () => {
    const { container } = render(<Button fullWidth>Button</Button>);

    expect(container.querySelector(".button--full-width")).toBeInTheDocument();
  });

  it("does not apply full-width class by default", () => {
    const { container } = render(<Button>Button</Button>);

    expect(container.querySelector(".button--full-width")).not.toBeInTheDocument();
  });

  // =============================================
  // Icon support
  // =============================================

  describe("icon", () => {
    it("renders icon on the left by default", () => {
      const { container } = render(
        <Button icon={<svg data-testid="test-icon" />}>Label</Button>,
      );

      const iconSpan = container.querySelector(".button__icon");
      expect(iconSpan).toBeInTheDocument();
      expect(iconSpan).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    });

    it("renders icon on the right when iconPosition is right", () => {
      const { container } = render(
        <Button icon={<svg data-testid="right-icon" />} iconPosition="right">
          Label
        </Button>,
      );

      const icons = container.querySelectorAll(".button__icon");
      expect(icons).toHaveLength(1);
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();

      // Verify icon appears after text in DOM order
      const button = container.querySelector(".button")!;
      const children = Array.from(button.children);
      const textIndex = children.findIndex((el) =>
        el.classList.contains("button__text"),
      );
      const iconIndex = children.findIndex((el) =>
        el.classList.contains("button__icon"),
      );
      expect(iconIndex).toBeGreaterThan(textIndex);
    });

    it("hides icon when loading", () => {
      const { container } = render(
        <Button loading icon={<svg data-testid="hidden-icon" />}>
          Loading
        </Button>,
      );

      const iconSpan = container.querySelector(".button__icon");
      expect(iconSpan).not.toBeInTheDocument();
    });
  });

  // =============================================
  // Icon-only mode
  // =============================================

  describe("iconOnly", () => {
    it("applies button--icon-only class", () => {
      const { container } = render(
        <Button iconOnly icon={<svg />} ariaLabel="Action" />,
      );

      expect(container.querySelector(".button--icon-only")).toBeInTheDocument();
    });

    it("does not render text span when iconOnly", () => {
      const { container } = render(
        <Button iconOnly icon={<svg />} ariaLabel="Action" />,
      );

      expect(container.querySelector(".button__text")).not.toBeInTheDocument();
    });

    it("uses children as icon content when no icon prop is provided", () => {
      const { container } = render(
        <Button iconOnly ariaLabel="Close">
          <svg data-testid="child-icon" />
        </Button>,
      );

      const iconSpan = container.querySelector(".button__icon");
      expect(iconSpan).toBeInTheDocument();
      expect(screen.getByTestId("child-icon")).toBeInTheDocument();
    });

    it("generates aria-label from string children when iconOnly", () => {
      render(<Button iconOnly>Close</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Close");
    });

    it("prefers explicit ariaLabel over children string", () => {
      render(
        <Button iconOnly ariaLabel="Explicit label">
          Close
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Explicit label");
    });
  });

  // =============================================
  // Loading state
  // =============================================

  describe("loading", () => {
    it("applies button--loading class", () => {
      const { container } = render(<Button loading>Loading</Button>);

      expect(container.querySelector(".button--loading")).toBeInTheDocument();
    });

    it("renders loading spinner", () => {
      const { container } = render(<Button loading>Loading</Button>);

      const spinner = container.querySelector(".button__loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });

    it("disables the button when loading", () => {
      render(<Button loading>Loading</Button>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("does not call onClick when loading", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const handleClick = vi.fn();

      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>,
      );

      // Button is disabled so click will not fire the handler
      await user.click(screen.getByRole("button"));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not show loading spinner when not loading", () => {
      const { container } = render(<Button>Normal</Button>);

      expect(
        container.querySelector(".button__loading-spinner"),
      ).not.toBeInTheDocument();
    });
  });

  // =============================================
  // Active state
  // =============================================

  describe("active", () => {
    it("applies button--active class when active", () => {
      const { container } = render(<Button active>Active</Button>);

      expect(container.querySelector(".button--active")).toBeInTheDocument();
    });

    it("does not apply button--active class by default", () => {
      const { container } = render(<Button>Normal</Button>);

      expect(container.querySelector(".button--active")).not.toBeInTheDocument();
    });
  });

  // =============================================
  // Disabled state
  // =============================================

  describe("disabled", () => {
    it("disables the button", () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("does not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>,
      );

      await user.click(screen.getByRole("button"));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // Event handlers
  // =============================================

  describe("event handlers", () => {
    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onDoubleClick on double click", async () => {
      const user = userEvent.setup();
      const handleDoubleClick = vi.fn();

      render(<Button onDoubleClick={handleDoubleClick}>Double</Button>);

      await user.dblClick(screen.getByRole("button"));
      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onKeyDown on key press", async () => {
      const user = userEvent.setup();
      const handleKeyDown = vi.fn();

      render(<Button onKeyDown={handleKeyDown}>Key</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");
      expect(handleKeyDown).toHaveBeenCalled();
    });

    it("calls onMouseEnter on hover", async () => {
      const user = userEvent.setup();
      const handleMouseEnter = vi.fn();

      render(<Button onMouseEnter={handleMouseEnter}>Hover</Button>);

      await user.hover(screen.getByRole("button"));
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it("calls onMouseDown on mouse down", async () => {
      const user = userEvent.setup();
      const handleMouseDown = vi.fn();

      render(<Button onMouseDown={handleMouseDown}>Mouse</Button>);

      const button = screen.getByRole("button");
      await user.pointer({ keys: "[MouseLeft>]", target: button });
      expect(handleMouseDown).toHaveBeenCalled();
    });
  });

  // =============================================
  // Accessibility attributes
  // =============================================

  describe("accessibility", () => {
    it("passes aria-label via ariaLabel prop", () => {
      render(<Button ariaLabel="Custom label">Text</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Custom label");
    });

    it("passes title attribute", () => {
      render(<Button title="Tooltip text">Text</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("title", "Tooltip text");
    });

    it("passes role attribute", () => {
      render(<Button role="tab">Tab</Button>);

      expect(screen.getByRole("tab")).toBeInTheDocument();
    });

    it("passes aria-pressed", () => {
      render(<Button aria-pressed={true}>Toggle</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    it("passes aria-selected", () => {
      render(<Button aria-selected={true}>Selected</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-selected", "true");
    });

    it("passes aria-expanded", () => {
      render(<Button aria-expanded={true}>Expand</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    });

    it("passes aria-haspopup", () => {
      render(<Button aria-haspopup="menu">Menu</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-haspopup", "menu");
    });

    it("passes aria-controls", () => {
      render(<Button aria-controls="panel-1">Tab</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-controls", "panel-1");
    });

    it("passes aria-describedby", () => {
      render(<Button aria-describedby="help-text">Help</Button>);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-describedby",
        "help-text",
      );
    });

    it("passes aria-busy", () => {
      render(<Button aria-busy={true}>Busy</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });

    it("passes tabIndex", () => {
      render(<Button tabIndex={-1}>Hidden</Button>);

      expect(screen.getByRole("button", { hidden: true })).toHaveAttribute(
        "tabIndex",
        "-1",
      );
    });

    it("has focus-visible outline support (no visual regression)", () => {
      render(<Button>Focus</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("button");
    });
  });

  // =============================================
  // Additional props
  // =============================================

  describe("additional props", () => {
    it("passes id attribute", () => {
      render(<Button id="my-button">ID</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("id", "my-button");
    });

    it("passes data-testid attribute", () => {
      render(<Button data-testid="submit-btn">Submit</Button>);

      expect(screen.getByTestId("submit-btn")).toBeInTheDocument();
    });

    it("passes style object", () => {
      render(<Button style={{ color: "red" }}>Styled</Button>);

      expect(screen.getByRole("button")).toHaveStyle({
        color: "rgb(255, 0, 0)",
      });
    });

    it("appends custom className", () => {
      const { container } = render(<Button className="custom-class">Custom</Button>);

      const button = container.querySelector(".button.custom-class");
      expect(button).toBeInTheDocument();
    });

    it("sets button type attribute", () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("defaults type to button", () => {
      render(<Button>Default</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });
  });

  // =============================================
  // Ref forwarding
  // =============================================

  describe("ref forwarding", () => {
    it("forwards ref to the button element", () => {
      const ref = createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current!.textContent).toContain("Ref");
    });
  });

  // =============================================
  // Class name composition
  // =============================================

  describe("class name composition", () => {
    it("composes multiple classes correctly", () => {
      const { container } = render(
        <Button
          variant="primary"
          size="large"
          shape="circle"
          fullWidth
          iconOnly
          loading
          active
          className="extra"
        >
          All
        </Button>,
      );

      const button = container.querySelector(".button")!;
      expect(button).toHaveClass("button");
      expect(button).toHaveClass("button--primary");
      expect(button).toHaveClass("button--large");
      expect(button).toHaveClass("button--circle");
      expect(button).toHaveClass("button--full-width");
      expect(button).toHaveClass("button--icon-only");
      expect(button).toHaveClass("button--loading");
      expect(button).toHaveClass("button--active");
      expect(button).toHaveClass("extra");
    });

    it("excludes falsy modifier classes", () => {
      const { container } = render(<Button>Simple</Button>);

      const button = container.querySelector(".button")!;
      expect(button.className).not.toContain("button--icon-only");
      expect(button.className).not.toContain("button--loading");
      expect(button.className).not.toContain("button--active");
      expect(button.className).not.toContain("button--full-width");
      expect(button.className).not.toContain("button--circle");
    });
  });
});
