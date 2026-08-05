/**
 * PageHeader Component Tests
 *
 * Tests cover:
 * - Rendering title, description, and actions
 * - Error banner rendering, dismiss button, and default/custom labels
 * - Custom className passthrough
 * - Accessibility (heading level, alert role)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  describe("rendering", () => {
    it("renders the title as an h1 heading", () => {
      render(<PageHeader title="Models" />);

      expect(
        screen.getByRole("heading", { level: 1, name: "Models" }),
      ).toBeInTheDocument();
    });

    it("renders the description when provided", () => {
      render(<PageHeader title="Models" description="Manage your models" />);

      expect(screen.getByText("Manage your models")).toBeInTheDocument();
    });

    it("does not render a description element when omitted", () => {
      const { container } = render(<PageHeader title="Models" />);

      expect(
        container.querySelector(".page-header__description"),
      ).not.toBeInTheDocument();
    });

    it("renders actions when provided", () => {
      render(
        <PageHeader title="Settings" actions={<button type="button">Save</button>} />,
      );

      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("does not render an actions wrapper when omitted", () => {
      const { container } = render(<PageHeader title="Settings" />);

      expect(container.querySelector(".page-header__actions")).not.toBeInTheDocument();
    });
  });

  describe("error banner", () => {
    it("does not render an error banner by default", () => {
      render(<PageHeader title="Engines" />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders the error message with alert role", () => {
      render(<PageHeader title="Engines" error="Failed to load engines" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Failed to load engines");
    });

    it("does not render a dismiss button when onErrorDismiss is omitted", () => {
      render(<PageHeader title="Engines" error="Something went wrong" />);

      expect(
        screen.queryByRole("button", { name: "Dismiss error" }),
      ).not.toBeInTheDocument();
    });

    it("renders a dismiss button with the default label", () => {
      render(
        <PageHeader
          title="Engines"
          error="Something went wrong"
          onErrorDismiss={() => undefined}
        />,
      );

      expect(screen.getByRole("button", { name: "Dismiss error" })).toBeInTheDocument();
    });

    it("renders a custom dismissErrorLabel", () => {
      render(
        <PageHeader
          title="Engines"
          error="Something went wrong"
          onErrorDismiss={() => undefined}
          dismissErrorLabel="Close notification"
        />,
      );

      expect(
        screen.getByRole("button", { name: "Close notification" }),
      ).toBeInTheDocument();
    });

    it("calls onErrorDismiss when the dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const handleDismiss = vi.fn();
      render(
        <PageHeader
          title="Engines"
          error="Something went wrong"
          onErrorDismiss={handleDismiss}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Dismiss error" }));
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("custom props", () => {
    it("appends a custom className to the header element", () => {
      const { container } = render(
        <PageHeader title="Models" className="custom-header" />,
      );

      const header = container.querySelector("header");
      expect(header).toHaveClass("page-header");
      expect(header).toHaveClass("custom-header");
    });
  });
});
