/**
 * Tests for SkeletonText component
 *
 * Tests cover:
 * - Rendering with default props
 * - Custom number of lines
 * - Different spacing variants
 * - Line width variations
 * - Custom className
 * - Accessibility attributes
 * - Test ID support
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonText } from "./SkeletonText";

describe("SkeletonText", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<SkeletonText />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toBeInTheDocument();
    });

    it("should render 3 lines by default", () => {
      const { container } = render(<SkeletonText />);

      const lines = container.querySelectorAll(".skeleton");
      expect(lines).toHaveLength(3);
    });
  });

  describe("Line Count", () => {
    it("should render 1 line when specified", () => {
      const { container } = render(<SkeletonText lines={1} />);

      const lines = container.querySelectorAll(".skeleton");
      expect(lines).toHaveLength(1);
    });

    it("should render 5 lines when specified", () => {
      const { container } = render(<SkeletonText lines={5} />);

      const lines = container.querySelectorAll(".skeleton");
      expect(lines).toHaveLength(5);
    });

    it("should render 10 lines when specified", () => {
      const { container } = render(<SkeletonText lines={10} />);

      const lines = container.querySelectorAll(".skeleton");
      expect(lines).toHaveLength(10);
    });
  });

  describe("Line Widths", () => {
    it("should have last line at 60% width", () => {
      const { container } = render(<SkeletonText lines={3} />);

      const lines = container.querySelectorAll(".skeleton");
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toHaveStyle({ width: "60%" });
    });

    it("should have first line at 100% width", () => {
      const { container } = render(<SkeletonText lines={3} />);

      const lines = container.querySelectorAll(".skeleton");
      expect(lines[0]).toHaveStyle({ width: "100%" });
    });

    it("should alternate between 100% and 95% for middle lines", () => {
      const { container } = render(<SkeletonText lines={5} />);

      const lines = container.querySelectorAll(".skeleton");
      // Line 0: 100% (even index)
      // Line 1: 95% (odd index)
      // Line 2: 100% (even index)
      // Line 3: 95% (odd index)
      // Line 4: 60% (last line)
      expect(lines[0]).toHaveStyle({ width: "100%" });
      expect(lines[1]).toHaveStyle({ width: "95%" });
      expect(lines[2]).toHaveStyle({ width: "100%" });
      expect(lines[3]).toHaveStyle({ width: "95%" });
      expect(lines[4]).toHaveStyle({ width: "60%" });
    });

    it("should handle single line (which is also last line)", () => {
      const { container } = render(<SkeletonText lines={1} />);

      const lines = container.querySelectorAll(".skeleton");
      expect(lines[0]).toHaveStyle({ width: "60%" });
    });
  });

  describe("Spacing Variants", () => {
    it("should render with normal spacing by default", () => {
      const { container } = render(<SkeletonText />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toHaveClass("skeleton-text--normal");
    });

    it("should render with compact spacing", () => {
      const { container } = render(<SkeletonText spacing="compact" />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toHaveClass("skeleton-text--compact");
    });

    it("should render with relaxed spacing", () => {
      const { container } = render(<SkeletonText spacing="relaxed" />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toHaveClass("skeleton-text--relaxed");
    });
  });

  describe("CSS Classes", () => {
    it("should include base skeleton-text class", () => {
      const { container } = render(<SkeletonText />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toHaveClass("skeleton-text");
    });

    it("should include custom className", () => {
      const { container } = render(<SkeletonText className="custom-class" />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toHaveClass("skeleton-text", "custom-class");
    });

    it("should render skeleton lines with text variant", () => {
      const { container } = render(<SkeletonText />);

      const lines = container.querySelectorAll(".skeleton--text");
      expect(lines.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("should have role status on container", () => {
      const { container } = render(<SkeletonText />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toHaveAttribute("role", "status");
    });

    it("should have aria-busy set to true on container", () => {
      const { container } = render(<SkeletonText />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("Test ID Support", () => {
    it("should render with data-testid when provided", () => {
      render(<SkeletonText testId="text-test" />);

      const textContainer = screen.getByTestId("text-test");
      expect(textContainer).toBeInTheDocument();
    });

    it("should not render data-testid when not provided", () => {
      const { container } = render(<SkeletonText />);

      const textContainer = container.querySelector(".skeleton-text");
      expect(textContainer).not.toHaveAttribute("data-testid");
    });
  });

  describe("Edge Cases", () => {
    it("should handle all props combined", () => {
      render(
        <SkeletonText
          lines={4}
          spacing="compact"
          className="my-text"
          testId="custom-text"
        />,
      );

      const textContainer = screen.getByTestId("custom-text");
      expect(textContainer).toHaveClass(
        "skeleton-text",
        "skeleton-text--compact",
        "my-text",
      );
      expect(textContainer).toHaveAttribute("role", "status");
      expect(textContainer).toHaveAttribute("aria-busy", "true");

      const lines = textContainer.querySelectorAll(".skeleton");
      expect(lines).toHaveLength(4);
    });

    it("should handle 0 lines gracefully", () => {
      const { container } = render(<SkeletonText lines={0} />);

      const lines = container.querySelectorAll(".skeleton");
      expect(lines).toHaveLength(0);
    });
  });
});
