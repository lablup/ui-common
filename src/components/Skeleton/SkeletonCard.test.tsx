/**
 * Tests for SkeletonCard component
 *
 * Tests cover:
 * - Rendering with default variant
 * - Different variants (default, compact, stat)
 * - Custom className
 * - Accessibility attributes
 * - Test ID support
 * - Structure and child elements
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonCard } from "./SkeletonCard";

describe("SkeletonCard", () => {
  describe("Rendering", () => {
    it("should render with default variant", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.querySelector(".uic-skeleton-card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("uic-skeleton-card--default");
    });

    it("should render header section for default variant", () => {
      const { container } = render(<SkeletonCard />);

      const header = container.querySelector(".uic-skeleton-card__header");
      expect(header).toBeInTheDocument();
    });

    it("should render content section for default variant", () => {
      const { container } = render(<SkeletonCard />);

      const content = container.querySelector(".uic-skeleton-card__content");
      expect(content).toBeInTheDocument();
    });

    it("should render footer section for default variant", () => {
      const { container } = render(<SkeletonCard />);

      const footer = container.querySelector(".uic-skeleton-card__footer");
      expect(footer).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    describe("default variant", () => {
      it("should have default class", () => {
        const { container } = render(<SkeletonCard variant="default" />);

        const card = container.querySelector(".uic-skeleton-card");
        expect(card).toHaveClass("uic-skeleton-card--default");
      });

      it("should have header, content, and footer", () => {
        const { container } = render(<SkeletonCard variant="default" />);

        expect(
          container.querySelector(".uic-skeleton-card__header"),
        ).toBeInTheDocument();
        expect(
          container.querySelector(".uic-skeleton-card__content"),
        ).toBeInTheDocument();
        expect(
          container.querySelector(".uic-skeleton-card__footer"),
        ).toBeInTheDocument();
      });

      it("should have 3 skeleton lines in content", () => {
        const { container } = render(<SkeletonCard variant="default" />);

        const content = container.querySelector(".uic-skeleton-card__content");
        const skeletons = content?.querySelectorAll(".uic-skeleton-shape");
        expect(skeletons).toHaveLength(3);
      });

      it("should have 2 buttons in footer", () => {
        const { container } = render(<SkeletonCard variant="default" />);

        const footer = container.querySelector(".uic-skeleton-card__footer");
        const skeletons = footer?.querySelectorAll(".uic-skeleton-shape");
        expect(skeletons).toHaveLength(2);
      });
    });

    describe("compact variant", () => {
      it("should have compact class", () => {
        const { container } = render(<SkeletonCard variant="compact" />);

        const card = container.querySelector(".uic-skeleton-card");
        expect(card).toHaveClass("uic-skeleton-card--compact");
      });

      it("should not have footer section", () => {
        const { container } = render(<SkeletonCard variant="compact" />);

        const footer = container.querySelector(".uic-skeleton-card__footer");
        expect(footer).not.toBeInTheDocument();
      });

      it("should have header and content sections", () => {
        const { container } = render(<SkeletonCard variant="compact" />);

        expect(
          container.querySelector(".uic-skeleton-card__header"),
        ).toBeInTheDocument();
        expect(
          container.querySelector(".uic-skeleton-card__content"),
        ).toBeInTheDocument();
      });
    });

    describe("stat variant", () => {
      it("should have stat class", () => {
        const { container } = render(<SkeletonCard variant="stat" />);

        const card = container.querySelector(".uic-skeleton-card");
        expect(card).toHaveClass("uic-skeleton-card--stat");
      });

      it("should have circle avatar in header", () => {
        const { container } = render(<SkeletonCard variant="stat" />);

        const header = container.querySelector(".uic-skeleton-card__header");
        const circle = header?.querySelector(".uic-skeleton-shape--circle");
        expect(circle).toBeInTheDocument();
      });

      it("should have header text section", () => {
        const { container } = render(<SkeletonCard variant="stat" />);

        const headerText = container.querySelector(".uic-skeleton-card__header-text");
        expect(headerText).toBeInTheDocument();
      });

      it("should have 2 text lines in header text", () => {
        const { container } = render(<SkeletonCard variant="stat" />);

        const headerText = container.querySelector(".uic-skeleton-card__header-text");
        const skeletons = headerText?.querySelectorAll(".uic-skeleton-shape");
        expect(skeletons).toHaveLength(2);
      });

      it("should not have content or footer sections", () => {
        const { container } = render(<SkeletonCard variant="stat" />);

        expect(
          container.querySelector(".uic-skeleton-card__content"),
        ).not.toBeInTheDocument();
        expect(
          container.querySelector(".uic-skeleton-card__footer"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("CSS Classes", () => {
    it("should include base uic-skeleton-card class", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.querySelector(".uic-skeleton-card");
      expect(card).toHaveClass("uic-skeleton-card");
    });

    it("should include custom className", () => {
      const { container } = render(<SkeletonCard className="custom-class" />);

      const card = container.querySelector(".uic-skeleton-card");
      expect(card).toHaveClass("uic-skeleton-card", "custom-class");
    });
  });

  describe("Accessibility", () => {
    it("should have role status on card container", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.querySelector(".uic-skeleton-card");
      expect(card).toHaveAttribute("role", "status");
    });

    it("should have aria-busy set to true on card container", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.querySelector(".uic-skeleton-card");
      expect(card).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("Test ID Support", () => {
    it("should render with data-testid when provided", () => {
      render(<SkeletonCard testId="card-test" />);

      const card = screen.getByTestId("card-test");
      expect(card).toBeInTheDocument();
    });

    it("should not render data-testid when not provided", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.querySelector(".uic-skeleton-card");
      expect(card).not.toHaveAttribute("data-testid");
    });
  });

  describe("Edge Cases", () => {
    it("should handle all props combined", () => {
      render(
        <SkeletonCard variant="compact" className="my-card" testId="custom-card" />,
      );

      const card = screen.getByTestId("custom-card");
      expect(card).toHaveClass(
        "uic-skeleton-card",
        "uic-skeleton-card--compact",
        "my-card",
      );
      expect(card).toHaveAttribute("role", "status");
      expect(card).toHaveAttribute("aria-busy", "true");
    });
  });
});
