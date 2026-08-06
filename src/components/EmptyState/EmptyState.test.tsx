/**
 * EmptyState Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders with required props", () => {
    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test Title"
        description="Test Description"
      />,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders illustration by default", () => {
    const { container } = render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
      />,
    );

    const illustration = container.querySelector(".empty-state__illustration");
    expect(illustration).toBeInTheDocument();
  });

  it("hides illustration when showIllustration is false", () => {
    const { container } = render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        showIllustration={false}
      />,
    );

    const illustration = container.querySelector(".empty-state__illustration");
    expect(illustration).not.toBeInTheDocument();
  });

  it("renders primary action button", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        primaryAction={{
          label: "Click Me",
          onClick: handleClick,
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
  });

  it("calls primaryAction onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        primaryAction={{
          label: "Click Me",
          onClick: handleClick,
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders secondary action as link when href is provided", () => {
    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        secondaryAction={{
          label: "Learn More",
          href: "#learn-more",
        }}
      />,
    );

    const link = screen.getByRole("link", { name: "Learn More" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#learn-more");
  });

  it("renders secondary action as button when onClick is provided", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        secondaryAction={{
          label: "Action",
          onClick: handleClick,
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "Action" });
    expect(button).toBeInTheDocument();
  });

  it("calls secondaryAction onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        secondaryAction={{
          label: "Action",
          onClick: handleClick,
        }}
      />,
    );

    const button = screen.getByRole("button", { name: "Action" });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        className="custom-class"
      />,
    );

    const emptyState = container.querySelector(".empty-state");
    expect(emptyState).toHaveClass("custom-class");
  });

  it("renders the illustration it is given", () => {
    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
      />,
    );

    // The ten named types this replaced were one product's screens, and the
    // modifier class they produced styled nothing.
    expect(screen.getByTestId("illustration")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    const { container } = render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
      />,
    );

    const emptyState = container.querySelector(".empty-state");
    expect(emptyState).toHaveAttribute("role", "status");
    expect(emptyState).toHaveAttribute("aria-live", "polite");
  });

  it("does not render actions section when no actions provided", () => {
    const { container } = render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
      />,
    );

    const actionsSection = container.querySelector(".empty-state__actions");
    expect(actionsSection).not.toBeInTheDocument();
  });

  it("renders both primary and secondary actions together", () => {
    const primaryClick = vi.fn();
    const secondaryClick = vi.fn();

    render(
      <EmptyState
        illustration={<svg data-testid="illustration" />}
        title="Test"
        description="Test"
        primaryAction={{
          label: "Primary",
          onClick: primaryClick,
        }}
        secondaryAction={{
          label: "Secondary",
          onClick: secondaryClick,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Secondary" })).toBeInTheDocument();
  });
});
