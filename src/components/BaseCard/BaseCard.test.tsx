/**
 * BaseCard Component Tests
 *
 * Tests cover:
 * - Rendering children and default class names
 * - Variant, direction, and state modifier classes
 * - Clickable behavior (auto-detection from onClick, explicit prop)
 * - Keyboard activation (Enter / Space) for clickable cards
 * - Accessibility attributes (role, aria-label, aria-checked, aria-disabled)
 * - Custom className, style, and testId passthrough
 * - Ref forwarding
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type CSSProperties } from "react";
import { BaseCard } from "./BaseCard";

describe("BaseCard", () => {
  describe("rendering", () => {
    it("renders children", () => {
      render(<BaseCard>Card content</BaseCard>);

      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("applies the base class and default variant/state classes", () => {
      const { container } = render(<BaseCard testId="card">Content</BaseCard>);

      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass("base-card");
      expect(card).toHaveClass("base-card--default");
      expect(card).toHaveClass("base-card--hoverable");
      // Idle state does not append a state modifier class.
      expect(card?.className).not.toContain("base-card--idle");
    });
  });

  describe("variant", () => {
    (["default", "installed", "available"] as const).forEach((variant) => {
      it(`applies base-card--${variant} class`, () => {
        const { container } = render(
          <BaseCard variant={variant} testId="card">
            Content
          </BaseCard>,
        );

        expect(container.querySelector('[data-testid="card"]')).toHaveClass(
          `base-card--${variant}`,
        );
      });
    });
  });

  describe("direction", () => {
    it("does not apply a row class by default (column layout)", () => {
      const { container } = render(<BaseCard testId="card">Content</BaseCard>);

      expect(container.querySelector('[data-testid="card"]')).not.toHaveClass(
        "base-card--row",
      );
    });

    it("applies base-card--row when direction is row", () => {
      const { container } = render(
        <BaseCard direction="row" testId="card">
          Content
        </BaseCard>,
      );

      expect(container.querySelector('[data-testid="card"]')).toHaveClass(
        "base-card--row",
      );
    });
  });

  describe("state", () => {
    (["loading", "active", "disabled", "warning"] as const).forEach((state) => {
      it(`applies base-card--${state} class`, () => {
        const { container } = render(
          <BaseCard state={state} testId="card">
            Content
          </BaseCard>,
        );

        expect(container.querySelector('[data-testid="card"]')).toHaveClass(
          `base-card--${state}`,
        );
      });
    });

    it("sets aria-disabled when state is disabled", () => {
      render(
        <BaseCard state="disabled" testId="card">
          Content
        </BaseCard>,
      );

      expect(screen.getByTestId("card")).toHaveAttribute("aria-disabled", "true");
    });

    it("does not set aria-disabled for non-disabled states", () => {
      render(
        <BaseCard state="active" testId="card">
          Content
        </BaseCard>,
      );

      expect(screen.getByTestId("card")).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("hoverable", () => {
    it("omits base-card--hoverable when hoverable is false", () => {
      const { container } = render(
        <BaseCard hoverable={false} testId="card">
          Content
        </BaseCard>,
      );

      expect(container.querySelector('[data-testid="card"]')).not.toHaveClass(
        "base-card--hoverable",
      );
    });
  });

  describe("clickable behavior", () => {
    it("is not clickable by default (no role, no tabIndex)", () => {
      render(<BaseCard testId="card">Content</BaseCard>);

      const card = screen.getByTestId("card");
      expect(card).not.toHaveAttribute("role");
      expect(card).not.toHaveAttribute("tabIndex");
    });

    it("auto-enables clickable styling when onClick is provided", () => {
      render(
        <BaseCard onClick={() => undefined} testId="card">
          Content
        </BaseCard>,
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("base-card--clickable");
      expect(card).toHaveAttribute("role", "button");
      expect(card).toHaveAttribute("tabIndex", "0");
    });

    it("respects an explicit clickable prop without onClick", () => {
      render(
        <BaseCard clickable testId="card">
          Content
        </BaseCard>,
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("base-card--clickable");
      expect(card).toHaveAttribute("role", "button");
    });

    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <BaseCard onClick={handleClick} testId="card">
          Content
        </BaseCard>,
      );

      await user.click(screen.getByTestId("card"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick when Enter is pressed on a clickable card", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <BaseCard onClick={handleClick} testId="card">
          Content
        </BaseCard>,
      );

      screen.getByTestId("card").focus();
      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick when Space is pressed on a clickable card", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <BaseCard onClick={handleClick} testId="card">
          Content
        </BaseCard>,
      );

      screen.getByTestId("card").focus();
      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick for other keys", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <BaseCard onClick={handleClick} testId="card">
          Content
        </BaseCard>,
      );

      screen.getByTestId("card").focus();
      await user.keyboard("a");
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("still calls a custom onKeyDown handler alongside the built-in behavior", async () => {
      const user = userEvent.setup();
      const handleKeyDown = vi.fn();
      render(
        <BaseCard onClick={() => undefined} onKeyDown={handleKeyDown} testId="card">
          Content
        </BaseCard>,
      );

      screen.getByTestId("card").focus();
      await user.keyboard("{Enter}");
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it("respects an explicit tabIndex override", () => {
      render(
        <BaseCard onClick={() => undefined} tabIndex={-1} testId="card">
          Content
        </BaseCard>,
      );

      expect(screen.getByTestId("card")).toHaveAttribute("tabIndex", "-1");
    });
  });

  describe("accessibility", () => {
    it("applies an explicit ariaLabel", () => {
      render(
        <BaseCard ariaLabel="Model card" testId="card">
          Content
        </BaseCard>,
      );

      expect(screen.getByTestId("card")).toHaveAttribute("aria-label", "Model card");
    });

    it("applies an explicit role override even when clickable", () => {
      render(
        <BaseCard onClick={() => undefined} role="checkbox" testId="card">
          Content
        </BaseCard>,
      );

      expect(screen.getByTestId("card")).toHaveAttribute("role", "checkbox");
    });

    it("applies ariaChecked", () => {
      render(
        <BaseCard role="checkbox" ariaChecked testId="card">
          Content
        </BaseCard>,
      );

      expect(screen.getByTestId("card")).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("custom props", () => {
    it("appends a custom className", () => {
      const { container } = render(
        <BaseCard className="custom-card" testId="card">
          Content
        </BaseCard>,
      );

      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass("base-card");
      expect(card).toHaveClass("custom-card");
    });

    it("applies an inline style object", () => {
      render(
        <BaseCard
          style={{ "--corner-accent-color": "red" } as CSSProperties}
          testId="card"
        >
          Content
        </BaseCard>,
      );

      expect(screen.getByTestId("card")).toHaveStyle({
        "--corner-accent-color": "red",
      });
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the root div element", () => {
      const ref = createRef<HTMLDivElement>();
      render(<BaseCard ref={ref}>Content</BaseCard>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.textContent).toBe("Content");
    });
  });
});
