/**
 * Badge Component Tests
 *
 * Tests cover:
 * - Rendering children
 * - Variant class names (default, primary, success, warning, danger, info)
 * - Size class names (small, medium)
 * - Default variant/size when not specified
 * - Custom className passthrough
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders as a span element", () => {
    const { container } = render(<Badge>Active</Badge>);

    expect(container.querySelector("span.badge")).toBeInTheDocument();
  });

  describe("variant", () => {
    (["default", "primary", "success", "warning", "danger", "info"] as const).forEach(
      (variant) => {
        it(`applies badge--${variant} class`, () => {
          const { container } = render(<Badge variant={variant}>Label</Badge>);

          expect(container.querySelector(".badge")).toHaveClass(`badge--${variant}`);
        });
      },
    );

    it("defaults to the default variant", () => {
      const { container } = render(<Badge>Label</Badge>);

      expect(container.querySelector(".badge")).toHaveClass("badge--default");
    });
  });

  describe("size", () => {
    (["small", "medium"] as const).forEach((size) => {
      it(`applies badge--${size} class`, () => {
        const { container } = render(<Badge size={size}>Label</Badge>);

        expect(container.querySelector(".badge")).toHaveClass(`badge--${size}`);
      });
    });

    it("defaults to the small size", () => {
      const { container } = render(<Badge>Label</Badge>);

      expect(container.querySelector(".badge")).toHaveClass("badge--small");
    });
  });

  describe("custom props", () => {
    it("appends a custom className", () => {
      const { container } = render(<Badge className="custom-badge">Label</Badge>);

      const badge = container.querySelector(".badge");
      expect(badge).toHaveClass("badge");
      expect(badge).toHaveClass("custom-badge");
    });

    it("composes variant, size, and custom classes together", () => {
      const { container } = render(
        <Badge variant="success" size="medium" className="extra">
          Label
        </Badge>,
      );

      const badge = container.querySelector(".badge");
      expect(badge).toHaveClass("badge", "badge--success", "badge--medium", "extra");
    });
  });

  describe("content", () => {
    it("renders non-string ReactNode children", () => {
      render(
        <Badge>
          <strong data-testid="badge-strong">Bold</strong>
        </Badge>,
      );

      expect(screen.getByTestId("badge-strong")).toBeInTheDocument();
    });
  });
});
