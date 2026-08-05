/**
 * Tests for Skeleton component
 *
 * Tests cover:
 * - Rendering with default props
 * - Custom width and height
 * - Different variants (rect, circle, text)
 * - Custom className
 * - Accessibility attributes (role, aria-busy, aria-label)
 * - Test ID support
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("skeleton", "skeleton--rect");
    });

    it("should render with custom width and height", () => {
      render(<Skeleton width="200px" height="50px" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveStyle({ width: "200px", height: "50px" });
    });

    it("should render with default dimensions when not specified", () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveStyle({ width: "100%", height: "20px" });
    });
  });

  describe("Variants", () => {
    it("should render rect variant by default", () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveClass("skeleton--rect");
    });

    it("should render circle variant", () => {
      render(<Skeleton variant="circle" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveClass("skeleton--circle");
    });

    it("should render text variant", () => {
      render(<Skeleton variant="text" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveClass("skeleton--text");
    });
  });

  describe("CSS Classes", () => {
    it("should include base skeleton class", () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveClass("skeleton");
    });

    it("should include custom className", () => {
      render(<Skeleton className="custom-class" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveClass("skeleton", "custom-class");
    });

    it("should handle empty className", () => {
      render(<Skeleton className="" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveClass("skeleton", "skeleton--rect");
    });
  });

  describe("Accessibility", () => {
    it("should have role status", () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toBeInTheDocument();
    });

    it("should have aria-busy set to true", () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });

    it("should have aria-label for screen readers", () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveAttribute("aria-label", "Loading");
    });

    it("should render a custom loadingLabel when provided", () => {
      render(<Skeleton loadingLabel="Loading models" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveAttribute("aria-label", "Loading models");
    });
  });

  describe("Shimmer Effect", () => {
    it("should render shimmer element", () => {
      const { container } = render(<Skeleton />);

      const shimmer = container.querySelector(".skeleton__shimmer");
      expect(shimmer).toBeInTheDocument();
    });
  });

  describe("Test ID Support", () => {
    it("should render with data-testid when provided", () => {
      render(<Skeleton testId="skeleton-test" />);

      const skeleton = screen.getByTestId("skeleton-test");
      expect(skeleton).toBeInTheDocument();
    });

    it("should not render data-testid when not provided", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.querySelector(".skeleton");
      expect(skeleton).not.toHaveAttribute("data-testid");
    });
  });

  describe("Edge Cases", () => {
    it("should handle percentage values for dimensions", () => {
      render(<Skeleton width="50%" height="100%" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveStyle({ width: "50%", height: "100%" });
    });

    it("should handle rem/em values for dimensions", () => {
      render(<Skeleton width="10rem" height="2em" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveStyle({ width: "10rem", height: "2em" });
    });

    it("should handle combined props", () => {
      render(
        <Skeleton
          width="100px"
          height="40px"
          variant="circle"
          className="my-skeleton"
          testId="custom-skeleton"
        />,
      );

      const skeleton = screen.getByTestId("custom-skeleton");
      expect(skeleton).toHaveClass("skeleton", "skeleton--circle", "my-skeleton");
      expect(skeleton).toHaveStyle({ width: "100px", height: "40px" });
      expect(skeleton).toHaveAttribute("role", "status");
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });
  });
});
