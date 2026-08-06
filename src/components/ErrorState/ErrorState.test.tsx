/**
 * ErrorState Component Tests
 *
 * Tests for the unified error state component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  describe("Basic Rendering", () => {
    it("renders title and message", () => {
      render(<ErrorState title="Test Error" message="This is a test error message" />);

      expect(screen.getByText("Test Error")).toBeInTheDocument();
      expect(screen.getByText("This is a test error message")).toBeInTheDocument();
    });

    it("renders with icon by default", () => {
      render(<ErrorState title="Error" message="Message" />);

      const iconContainer = document.querySelector(".error-state__icon");
      expect(iconContainer).toBeInTheDocument();
    });

    it("hides icon when showIcon is false", () => {
      render(<ErrorState title="Error" message="Message" showIcon={false} />);

      const iconContainer = document.querySelector(".error-state__icon");
      expect(iconContainer).not.toBeInTheDocument();
    });
  });

  describe("Error Types", () => {
    it("applies network error type class", () => {
      render(<ErrorState tone="warning" title="Error" message="Message" />);

      const container = document.querySelector(".error-state--warning");
      expect(container).toBeInTheDocument();
    });

    it("applies configuration error type class", () => {
      render(<ErrorState tone="accent" title="Error" message="Message" />);

      const container = document.querySelector(".error-state--accent");
      expect(container).toBeInTheDocument();
    });

    it("applies model error type class", () => {
      render(<ErrorState tone="danger" title="Error" message="Message" />);

      const container = document.querySelector(".error-state--danger");
      expect(container).toBeInTheDocument();
    });

    it("applies permission error type class", () => {
      render(<ErrorState tone="warning" title="Error" message="Message" />);

      const container = document.querySelector(".error-state--warning");
      expect(container).toBeInTheDocument();
    });

    it("applies generic error type class by default", () => {
      render(<ErrorState title="Error" message="Message" />);

      const container = document.querySelector(".error-state--danger");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("renders primary action button", () => {
      const handleClick = vi.fn();
      render(
        <ErrorState
          title="Error"
          message="Message"
          primaryAction={{ label: "Retry", onClick: handleClick }}
        />,
      );

      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("renders secondary action button", () => {
      const handleClick = vi.fn();
      render(
        <ErrorState
          title="Error"
          message="Message"
          secondaryAction={{ label: "View Logs", onClick: handleClick }}
        />,
      );

      expect(screen.getByText("View Logs")).toBeInTheDocument();
    });

    it("renders both action buttons", () => {
      const handlePrimary = vi.fn();
      const handleSecondary = vi.fn();
      render(
        <ErrorState
          title="Error"
          message="Message"
          primaryAction={{ label: "Retry", onClick: handlePrimary }}
          secondaryAction={{ label: "View Logs", onClick: handleSecondary }}
        />,
      );

      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByText("View Logs")).toBeInTheDocument();
    });

    it("calls primary action onClick handler", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <ErrorState
          title="Error"
          message="Message"
          primaryAction={{ label: "Retry", onClick: handleClick }}
        />,
      );

      await user.click(screen.getByText("Retry"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls secondary action onClick handler", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <ErrorState
          title="Error"
          message="Message"
          secondaryAction={{ label: "View Logs", onClick: handleClick }}
        />,
      );

      await user.click(screen.getByText("View Logs"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("has alert role", () => {
      render(<ErrorState title="Error" message="Message" />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("has aria-live polite attribute", () => {
      render(<ErrorState title="Error" message="Message" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });

    it("icon has aria-hidden attribute", () => {
      render(<ErrorState title="Error" message="Message" />);

      const iconContainer = document.querySelector(".error-state__icon");
      expect(iconContainer).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      render(<ErrorState title="Error" message="Message" className="custom-error" />);

      const container = document.querySelector(".custom-error");
      expect(container).toBeInTheDocument();
    });

    it("preserves error type class when custom className is applied", () => {
      render(
        <ErrorState
          tone="warning"
          title="Error"
          message="Message"
          className="custom-error"
        />,
      );

      const container = document.querySelector(".error-state--warning.custom-error");
      expect(container).toBeInTheDocument();
    });
  });
});
