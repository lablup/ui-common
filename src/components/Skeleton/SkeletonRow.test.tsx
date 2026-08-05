/**
 * Tests for SkeletonRow component
 *
 * Tests cover:
 * - Rendering with default props
 * - Multiple rows (count prop)
 * - Avatar visibility
 * - Action buttons visibility
 * - Custom className
 * - Accessibility attributes
 * - Test ID support with indexing
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonRow } from "./SkeletonRow";

describe("SkeletonRow", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<SkeletonRow />);

      const row = container.querySelector(".skeleton-row");
      expect(row).toBeInTheDocument();
    });

    it("should render 1 row by default", () => {
      const { container } = render(<SkeletonRow />);

      const rows = container.querySelectorAll(".skeleton-row");
      expect(rows).toHaveLength(1);
    });

    it("should render content section", () => {
      const { container } = render(<SkeletonRow />);

      const content = container.querySelector(".skeleton-row__content");
      expect(content).toBeInTheDocument();
    });

    it("should render 2 skeletons in content (timestamp and text)", () => {
      const { container } = render(<SkeletonRow />);

      const content = container.querySelector(".skeleton-row__content");
      const skeletons = content?.querySelectorAll(".skeleton");
      expect(skeletons).toHaveLength(2);
    });
  });

  describe("Row Count", () => {
    it("should render 1 row when count is 1", () => {
      const { container } = render(<SkeletonRow count={1} />);

      const rows = container.querySelectorAll(".skeleton-row");
      expect(rows).toHaveLength(1);
    });

    it("should render 5 rows when count is 5", () => {
      const { container } = render(<SkeletonRow count={5} />);

      const rows = container.querySelectorAll(".skeleton-row");
      expect(rows).toHaveLength(5);
    });

    it("should render 10 rows when count is 10", () => {
      const { container } = render(<SkeletonRow count={10} />);

      const rows = container.querySelectorAll(".skeleton-row");
      expect(rows).toHaveLength(10);
    });
  });

  describe("Avatar Display", () => {
    it("should not show avatar by default", () => {
      const { container } = render(<SkeletonRow />);

      const avatar = container.querySelector(".skeleton-row__avatar");
      expect(avatar).not.toBeInTheDocument();
    });

    it("should show avatar when showAvatar is true", () => {
      const { container } = render(<SkeletonRow showAvatar />);

      const avatar = container.querySelector(".skeleton-row__avatar");
      expect(avatar).toBeInTheDocument();
    });

    it("should render circle skeleton in avatar", () => {
      const { container } = render(<SkeletonRow showAvatar />);

      const avatar = container.querySelector(".skeleton-row__avatar");
      const circle = avatar?.querySelector(".skeleton--circle");
      expect(circle).toBeInTheDocument();
    });

    it("should show avatar on all rows when count > 1", () => {
      const { container } = render(<SkeletonRow showAvatar count={3} />);

      const avatars = container.querySelectorAll(".skeleton-row__avatar");
      expect(avatars).toHaveLength(3);
    });
  });

  describe("Actions Display", () => {
    it("should not show actions by default", () => {
      const { container } = render(<SkeletonRow />);

      const actions = container.querySelector(".skeleton-row__actions");
      expect(actions).not.toBeInTheDocument();
    });

    it("should show actions when showActions is true", () => {
      const { container } = render(<SkeletonRow showActions />);

      const actions = container.querySelector(".skeleton-row__actions");
      expect(actions).toBeInTheDocument();
    });

    it("should render 2 action button skeletons", () => {
      const { container } = render(<SkeletonRow showActions />);

      const actions = container.querySelector(".skeleton-row__actions");
      const buttons = actions?.querySelectorAll(".skeleton");
      expect(buttons).toHaveLength(2);
    });

    it("should show actions on all rows when count > 1", () => {
      const { container } = render(<SkeletonRow showActions count={3} />);

      const actionSections = container.querySelectorAll(".skeleton-row__actions");
      expect(actionSections).toHaveLength(3);
    });
  });

  describe("Combined Avatar and Actions", () => {
    it("should show both avatar and actions when both are true", () => {
      const { container } = render(<SkeletonRow showAvatar showActions />);

      const avatar = container.querySelector(".skeleton-row__avatar");
      const actions = container.querySelector(".skeleton-row__actions");
      expect(avatar).toBeInTheDocument();
      expect(actions).toBeInTheDocument();
    });

    it("should show avatar, actions, and content on all rows", () => {
      const { container } = render(<SkeletonRow showAvatar showActions count={3} />);

      const rows = container.querySelectorAll(".skeleton-row");
      rows.forEach((row) => {
        expect(row.querySelector(".skeleton-row__avatar")).toBeInTheDocument();
        expect(row.querySelector(".skeleton-row__content")).toBeInTheDocument();
        expect(row.querySelector(".skeleton-row__actions")).toBeInTheDocument();
      });
    });
  });

  describe("CSS Classes", () => {
    it("should include base skeleton-row class", () => {
      const { container } = render(<SkeletonRow />);

      const row = container.querySelector(".skeleton-row");
      expect(row).toHaveClass("skeleton-row");
    });

    it("should include custom className", () => {
      const { container } = render(<SkeletonRow className="custom-class" />);

      const row = container.querySelector(".skeleton-row");
      expect(row).toHaveClass("skeleton-row", "custom-class");
    });

    it("should apply custom className to all rows", () => {
      const { container } = render(<SkeletonRow className="custom-class" count={3} />);

      const rows = container.querySelectorAll(".skeleton-row");
      rows.forEach((row) => {
        expect(row).toHaveClass("skeleton-row", "custom-class");
      });
    });
  });

  describe("Accessibility", () => {
    it("should have role status on each row", () => {
      const { container } = render(<SkeletonRow count={3} />);

      const rows = container.querySelectorAll(".skeleton-row");
      rows.forEach((row) => {
        expect(row).toHaveAttribute("role", "status");
      });
    });

    it("should have aria-busy set to true on each row", () => {
      const { container } = render(<SkeletonRow count={2} />);

      const rows = container.querySelectorAll(".skeleton-row");
      rows.forEach((row) => {
        expect(row).toHaveAttribute("aria-busy", "true");
      });
    });
  });

  describe("Test ID Support", () => {
    it("should render with indexed data-testid when provided", () => {
      render(<SkeletonRow testId="row-test" />);

      const row = screen.getByTestId("row-test-0");
      expect(row).toBeInTheDocument();
    });

    it("should render indexed test IDs for multiple rows", () => {
      render(<SkeletonRow testId="row-test" count={3} />);

      expect(screen.getByTestId("row-test-0")).toBeInTheDocument();
      expect(screen.getByTestId("row-test-1")).toBeInTheDocument();
      expect(screen.getByTestId("row-test-2")).toBeInTheDocument();
    });

    it("should not render data-testid when not provided", () => {
      const { container } = render(<SkeletonRow />);

      const row = container.querySelector(".skeleton-row");
      expect(row).not.toHaveAttribute("data-testid");
    });
  });

  describe("Edge Cases", () => {
    it("should handle all props combined", () => {
      render(
        <SkeletonRow
          showAvatar
          showActions
          count={2}
          className="my-row"
          testId="custom-row"
        />,
      );

      const row1 = screen.getByTestId("custom-row-0");
      const row2 = screen.getByTestId("custom-row-1");

      [row1, row2].forEach((row) => {
        expect(row).toHaveClass("skeleton-row", "my-row");
        expect(row).toHaveAttribute("role", "status");
        expect(row).toHaveAttribute("aria-busy", "true");
        expect(row.querySelector(".skeleton-row__avatar")).toBeInTheDocument();
        expect(row.querySelector(".skeleton-row__content")).toBeInTheDocument();
        expect(row.querySelector(".skeleton-row__actions")).toBeInTheDocument();
      });
    });

    it("should handle 0 count gracefully", () => {
      const { container } = render(<SkeletonRow count={0} />);

      const rows = container.querySelectorAll(".skeleton-row");
      expect(rows).toHaveLength(0);
    });

    it("should render as fragment (no wrapper div)", () => {
      render(
        <div data-testid="wrapper">
          <SkeletonRow count={2} />
        </div>,
      );

      const wrapper = screen.getByTestId("wrapper");
      // Direct children should be the skeleton rows
      const rows = wrapper.querySelectorAll(":scope > .skeleton-row");
      expect(rows).toHaveLength(2);
    });
  });
});
