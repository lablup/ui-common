/**
 * Drawer Component Tests
 *
 * Verifies rendering, open/closed state CSS classes, accessibility attributes,
 * and interaction behavior of the shared Drawer component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Drawer } from "./Drawer";

const defaultProps = {
  isOpen: false,
  onClose: vi.fn(),
  title: "Test Drawer",
  children: <div>Drawer Content</div>,
};

describe("Drawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders drawer with title and content", () => {
      render(<Drawer {...defaultProps} isOpen={true} />);

      expect(screen.getByText("Test Drawer")).toBeInTheDocument();
      expect(screen.getByText("Drawer Content")).toBeInTheDocument();
    });

    it("renders subtitle when provided", () => {
      render(<Drawer {...defaultProps} isOpen={true} subtitle="Test Subtitle" />);

      expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    });

    it("does not render subtitle when not provided", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      expect(container.querySelector(".drawer__subtitle")).not.toBeInTheDocument();
    });

    it("renders footer when provided", () => {
      render(
        <Drawer {...defaultProps} isOpen={true} footer={<div>Footer Content</div>} />,
      );

      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("does not render footer when not provided", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      expect(container.querySelector(".drawer__footer")).not.toBeInTheDocument();
    });

    it("renders close button", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      const closeButton = container.querySelector(".drawer__close-btn");
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("renders custom closeLabel when provided", () => {
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} closeLabel="Dismiss panel" />,
      );

      const closeButton = container.querySelector(".drawer__close-btn");
      expect(closeButton).toHaveAttribute("aria-label", "Dismiss panel");
    });
  });

  describe("CSS class structure - specificity fix", () => {
    it("always applies the base 'drawer' class to the aside element", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={false} />);

      const aside = container.querySelector("aside");
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass("drawer");
    });

    it("applies 'drawer--open' class alongside 'drawer' class when open", async () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      // Wait for animation frame to fire (double rAF in component)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("drawer");
      expect(aside).toHaveClass("drawer--open");
    });

    it("does not apply 'drawer--open' class when closed", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={false} />);

      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("drawer");
      expect(aside).not.toHaveClass("drawer--open");
    });

    it("removes 'drawer--open' class when toggled from open to closed", async () => {
      const { container, rerender } = render(
        <Drawer {...defaultProps} isOpen={true} />,
      );

      // Wait for the open animation to trigger
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("drawer--open");

      rerender(<Drawer {...defaultProps} isOpen={false} />);

      expect(aside).not.toHaveClass("drawer--open");
    });

    it("applies both 'drawer' and 'drawer--open' classes simultaneously when open (required for .drawer.drawer--open selector)", async () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const aside = container.querySelector("aside.drawer.drawer--open");
      expect(aside).toBeInTheDocument();
    });
  });

  describe("Backdrop CSS classes", () => {
    it("applies base 'drawer__backdrop' class at all times", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={false} />);

      expect(container.querySelector(".drawer__backdrop")).toBeInTheDocument();
    });

    it("applies 'drawer__backdrop--open' class when drawer is open", async () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(
        container.querySelector(".drawer__backdrop.drawer__backdrop--open"),
      ).toBeInTheDocument();
    });

    it("does not apply 'drawer__backdrop--open' class when drawer is closed", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={false} />);

      expect(
        container.querySelector(".drawer__backdrop--open"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies additional className to the drawer panel", async () => {
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} className="custom-drawer" />,
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const aside = container.querySelector("aside");
      expect(aside).toHaveClass("drawer");
      expect(aside).toHaveClass("custom-drawer");
    });
  });

  describe("Width presets", () => {
    it("applies narrow width preset (400px)", () => {
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} width="narrow" />,
      );

      const aside = container.querySelector("aside");
      expect(aside).toHaveStyle({ width: "400px" });
    });

    it("applies medium width preset (520px) by default", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      const aside = container.querySelector("aside");
      expect(aside).toHaveStyle({ width: "520px" });
    });

    it("applies wide width preset (900px)", () => {
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} width="wide" />,
      );

      const aside = container.querySelector("aside");
      expect(aside).toHaveStyle({ width: "900px" });
    });

    it("applies custom width value", () => {
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} width="640px" />,
      );

      const aside = container.querySelector("aside");
      expect(aside).toHaveStyle({ width: "640px" });
    });
  });

  describe("Accessibility", () => {
    it("applies role='dialog' and aria-modal to the aside element", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      const dialog = container.querySelector("[role='dialog']");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("sets aria-hidden on backdrop when closed", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={false} />);

      const backdrop = container.querySelector("[role='presentation']");
      expect(backdrop).toHaveAttribute("aria-hidden", "true");
    });

    it("sets aria-hidden to false on backdrop when open", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      const backdrop = container.querySelector("[role='presentation']");
      expect(backdrop).toHaveAttribute("aria-hidden", "false");
    });

    it("connects title via aria-labelledby", () => {
      const { container } = render(<Drawer {...defaultProps} isOpen={true} />);

      const dialog = container.querySelector("[role='dialog']");
      expect(dialog).toBeTruthy();

      const labelId = dialog!.getAttribute("aria-labelledby") ?? "";
      expect(labelId).toBeTruthy();

      const titleEl = container.querySelector(`#${labelId}`);
      expect(titleEl).toHaveTextContent("Test Drawer");
    });
  });

  describe("Close behavior", () => {
    it("calls onClose when close button is clicked", () => {
      const onClose = vi.fn();
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} onClose={onClose} />,
      );

      const closeButton = container.querySelector(
        ".drawer__close-btn",
      ) as HTMLButtonElement;
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} onClose={onClose} />,
      );

      const backdrop = container.querySelector(".drawer__backdrop")!;
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when clicking inside the drawer panel", () => {
      const onClose = vi.fn();
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} onClose={onClose}>
          <button className="inner-button">Inner Button</button>
        </Drawer>,
      );

      const innerButton = container.querySelector(".inner-button") as HTMLButtonElement;
      fireEvent.click(innerButton);

      expect(onClose).not.toHaveBeenCalled();
    });

    it("calls onClose when Escape key is pressed", () => {
      const onClose = vi.fn();
      const { container } = render(
        <Drawer {...defaultProps} isOpen={true} onClose={onClose} />,
      );

      const aside = container.querySelector("aside")!;
      fireEvent.keyDown(aside, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
