/**
 * ProgressBar Component Tests
 *
 * Tests cover:
 * - Determinate rendering (value clamping, fill width, aria-valuenow)
 * - Indeterminate rendering (value=null)
 * - Variant and size class names
 * - Label rendering (showLabel percentage, custom label override)
 * - Animated class toggle
 * - Accessibility attributes (role, aria-value*, aria-busy, aria-label)
 * - Custom className passthrough
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  describe("determinate rendering", () => {
    it("renders with role progressbar", () => {
      render(<ProgressBar value={50} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("sets aria-valuenow, aria-valuemin, and aria-valuemax", () => {
      render(<ProgressBar value={50} />);

      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuenow", "50");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
    });

    it("sets the fill width from value", () => {
      const { container } = render(<ProgressBar value={75} />);

      const fill = container.querySelector(".progress-bar__fill");
      expect(fill).toHaveStyle({ width: "75%" });
    });

    it("clamps values above 100", () => {
      render(<ProgressBar value={150} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    });

    it("clamps values below 0", () => {
      render(<ProgressBar value={-20} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    });

    it("is not aria-busy when determinate", () => {
      render(<ProgressBar value={50} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-busy", "false");
    });
  });

  describe("indeterminate rendering", () => {
    it("applies the indeterminate modifier class when value is null", () => {
      const { container } = render(<ProgressBar value={null} />);

      expect(container.querySelector(".progress-bar")).toHaveClass(
        "progress-bar--indeterminate",
      );
    });

    it("omits aria-valuenow when indeterminate", () => {
      render(<ProgressBar value={null} />);

      expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    });

    it("sets aria-busy when indeterminate", () => {
      render(<ProgressBar value={null} />);

      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-busy", "true");
    });

    it("does not render a percentage label even with showLabel", () => {
      render(<ProgressBar value={null} showLabel />);

      expect(screen.queryByText("%", { exact: false })).not.toBeInTheDocument();
    });
  });

  describe("variant", () => {
    (["primary", "success", "error", "warning"] as const).forEach((variant) => {
      it(`applies progress-bar--${variant} class`, () => {
        const { container } = render(<ProgressBar value={50} variant={variant} />);

        expect(container.querySelector(".progress-bar")).toHaveClass(
          `progress-bar--${variant}`,
        );
      });
    });

    it("defaults to the primary variant", () => {
      const { container } = render(<ProgressBar value={50} />);

      expect(container.querySelector(".progress-bar")).toHaveClass(
        "progress-bar--primary",
      );
    });
  });

  describe("size", () => {
    (["sm", "md", "lg"] as const).forEach((size) => {
      it(`applies progress-bar--${size} class`, () => {
        const { container } = render(<ProgressBar value={50} size={size} />);

        expect(container.querySelector(".progress-bar")).toHaveClass(
          `progress-bar--${size}`,
        );
      });
    });

    it("defaults to the md size", () => {
      const { container } = render(<ProgressBar value={50} />);

      expect(container.querySelector(".progress-bar")).toHaveClass("progress-bar--md");
    });
  });

  describe("label", () => {
    it("does not render a label by default", () => {
      const { container } = render(<ProgressBar value={50} />);

      expect(container.querySelector(".progress-bar__label")).not.toBeInTheDocument();
    });

    it("renders a rounded percentage label when showLabel is true", () => {
      render(<ProgressBar value={42.6} showLabel />);

      expect(screen.getByText("43%")).toBeInTheDocument();
    });

    it("renders a custom label overriding the percentage", () => {
      render(<ProgressBar value={50} showLabel label="Downloading" />);

      expect(screen.getByText("Downloading")).toBeInTheDocument();
      expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });

    it("renders a custom label even without showLabel", () => {
      render(<ProgressBar value={50} label="Custom" />);

      expect(screen.getByText("Custom")).toBeInTheDocument();
    });
  });

  describe("animated", () => {
    it("applies the animated class by default", () => {
      const { container } = render(<ProgressBar value={50} />);

      expect(container.querySelector(".progress-bar")).toHaveClass(
        "progress-bar--animated",
      );
    });

    it("omits the animated class when animated is false", () => {
      const { container } = render(<ProgressBar value={50} animated={false} />);

      expect(container.querySelector(".progress-bar")).not.toHaveClass(
        "progress-bar--animated",
      );
    });
  });

  describe("custom props", () => {
    it("appends a custom className", () => {
      const { container } = render(
        <ProgressBar value={50} className="custom-progress" />,
      );

      const bar = container.querySelector(".progress-bar");
      expect(bar).toHaveClass("progress-bar");
      expect(bar).toHaveClass("custom-progress");
    });

    it("applies an ariaLabel", () => {
      render(<ProgressBar value={50} ariaLabel="Download progress" />);

      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-label",
        "Download progress",
      );
    });
  });
});
