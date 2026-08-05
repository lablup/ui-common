/**
 * Tests for SkeletonChart component
 *
 * Tests cover:
 * - Rendering with default props
 * - Different chart variants (bar, line, pie, area)
 * - Custom height
 * - Custom className
 * - Accessibility attributes
 * - Test ID support
 * - Chart structure and child elements
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonChart } from "./SkeletonChart";

describe("SkeletonChart", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toBeInTheDocument();
    });

    it("should render bar variant by default", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveClass("skeleton-chart--bar");
    });

    it("should render with default height of 300px", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveStyle({ height: "300px" });
    });
  });

  describe("Variants", () => {
    describe("bar variant", () => {
      it("should have bar class", () => {
        const { container } = render(<SkeletonChart variant="bar" />);

        const chart = container.querySelector(".skeleton-chart");
        expect(chart).toHaveClass("skeleton-chart--bar");
      });

      it("should render bars container", () => {
        const { container } = render(<SkeletonChart variant="bar" />);

        const barsContainer = container.querySelector(".skeleton-chart__bars");
        expect(barsContainer).toBeInTheDocument();
      });

      it("should render 8 bars with varying heights", () => {
        const { container } = render(<SkeletonChart variant="bar" />);

        const bars = container.querySelectorAll(".skeleton-chart__bar");
        expect(bars).toHaveLength(8);
      });

      it("should not render pie or line containers", () => {
        const { container } = render(<SkeletonChart variant="bar" />);

        expect(container.querySelector(".skeleton-chart__pie")).not.toBeInTheDocument();
        expect(
          container.querySelector(".skeleton-chart__line"),
        ).not.toBeInTheDocument();
      });
    });

    describe("line variant", () => {
      it("should have line class", () => {
        const { container } = render(<SkeletonChart variant="line" />);

        const chart = container.querySelector(".skeleton-chart");
        expect(chart).toHaveClass("skeleton-chart--line");
      });

      it("should render line container", () => {
        const { container } = render(<SkeletonChart variant="line" />);

        const lineContainer = container.querySelector(".skeleton-chart__line");
        expect(lineContainer).toBeInTheDocument();
      });

      it("should render a skeleton inside line container", () => {
        const { container } = render(<SkeletonChart variant="line" />);

        const lineContainer = container.querySelector(".skeleton-chart__line");
        const skeleton = lineContainer?.querySelector(".skeleton");
        expect(skeleton).toBeInTheDocument();
      });
    });

    describe("pie variant", () => {
      it("should have pie class", () => {
        const { container } = render(<SkeletonChart variant="pie" />);

        const chart = container.querySelector(".skeleton-chart");
        expect(chart).toHaveClass("skeleton-chart--pie");
      });

      it("should render pie container", () => {
        const { container } = render(<SkeletonChart variant="pie" />);

        const pieContainer = container.querySelector(".skeleton-chart__pie");
        expect(pieContainer).toBeInTheDocument();
      });

      it("should render circle skeleton for pie", () => {
        const { container } = render(<SkeletonChart variant="pie" />);

        const pieContainer = container.querySelector(".skeleton-chart__pie");
        const circle = pieContainer?.querySelector(".skeleton--circle");
        expect(circle).toBeInTheDocument();
      });

      it("should render legend section", () => {
        const { container } = render(<SkeletonChart variant="pie" />);

        const legend = container.querySelector(".skeleton-chart__legend");
        expect(legend).toBeInTheDocument();
      });

      it("should render 4 legend items", () => {
        const { container } = render(<SkeletonChart variant="pie" />);

        const legendItems = container.querySelectorAll(".skeleton-chart__legend-item");
        expect(legendItems).toHaveLength(4);
      });

      it("should render circle and text skeleton in each legend item", () => {
        const { container } = render(<SkeletonChart variant="pie" />);

        const legendItems = container.querySelectorAll(".skeleton-chart__legend-item");

        legendItems.forEach((item) => {
          const circle = item.querySelector(".skeleton--circle");
          const skeletons = item.querySelectorAll(".skeleton");
          expect(circle).toBeInTheDocument();
          expect(skeletons).toHaveLength(2); // circle + text
        });
      });
    });

    describe("area variant", () => {
      it("should have area class", () => {
        const { container } = render(<SkeletonChart variant="area" />);

        const chart = container.querySelector(".skeleton-chart");
        expect(chart).toHaveClass("skeleton-chart--area");
      });

      it("should render line container (same as line variant)", () => {
        const { container } = render(<SkeletonChart variant="area" />);

        const lineContainer = container.querySelector(".skeleton-chart__line");
        expect(lineContainer).toBeInTheDocument();
      });
    });
  });

  describe("Custom Height", () => {
    it("should render with custom height", () => {
      const { container } = render(<SkeletonChart height="400px" />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveStyle({ height: "400px" });
    });

    it("should handle percentage height", () => {
      const { container } = render(<SkeletonChart height="100%" />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveStyle({ height: "100%" });
    });

    it("should handle rem height", () => {
      const { container } = render(<SkeletonChart height="20rem" />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveStyle({ height: "20rem" });
    });
  });

  describe("CSS Classes", () => {
    it("should include base skeleton-chart class", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveClass("skeleton-chart");
    });

    it("should include custom className", () => {
      const { container } = render(<SkeletonChart className="custom-class" />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveClass("skeleton-chart", "custom-class");
    });
  });

  describe("Accessibility", () => {
    it("should have role status on chart container", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveAttribute("role", "status");
    });

    it("should have aria-busy set to true on chart container", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveAttribute("aria-busy", "true");
    });

    it("should have aria-label for screen readers on chart container", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).toHaveAttribute("aria-label", "Loading chart");
    });
  });

  describe("Test ID Support", () => {
    it("should render with data-testid when provided", () => {
      render(<SkeletonChart testId="chart-test" />);

      const chart = screen.getByTestId("chart-test");
      expect(chart).toBeInTheDocument();
    });

    it("should not render data-testid when not provided", () => {
      const { container } = render(<SkeletonChart />);

      const chart = container.querySelector(".skeleton-chart");
      expect(chart).not.toHaveAttribute("data-testid");
    });
  });

  describe("Edge Cases", () => {
    it("should handle all props combined", () => {
      render(
        <SkeletonChart
          variant="pie"
          height="500px"
          className="my-chart"
          testId="custom-chart"
        />,
      );

      const chart = screen.getByTestId("custom-chart");
      expect(chart).toHaveClass("skeleton-chart", "skeleton-chart--pie", "my-chart");
      expect(chart).toHaveStyle({ height: "500px" });
      expect(chart).toHaveAttribute("role", "status");
      expect(chart).toHaveAttribute("aria-busy", "true");
      expect(chart).toHaveAttribute("aria-label", "Loading chart");
    });
  });
});
