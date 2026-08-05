/**
 * Tests for the PageLayout common component.
 *
 * Covers:
 * - Default "standard" variant class
 * - "wide" variant class
 * - "full" variant class (no max-width clamp)
 * - Additional className passthrough
 * - Children rendering
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLayout } from "./PageLayout";

describe("PageLayout — variant classes", () => {
  it("applies page-layout--standard by default", () => {
    const { container } = render(<PageLayout>content</PageLayout>);
    const el = container.firstElementChild;
    expect(el).toHaveClass("page-layout");
    expect(el).toHaveClass("page-layout--standard");
  });

  it("applies page-layout--wide for the wide variant", () => {
    const { container } = render(<PageLayout variant="wide">content</PageLayout>);
    const el = container.firstElementChild;
    expect(el).toHaveClass("page-layout--wide");
    expect(el).not.toHaveClass("page-layout--standard");
  });

  it("applies page-layout--full for the full variant", () => {
    const { container } = render(<PageLayout variant="full">content</PageLayout>);
    const el = container.firstElementChild;
    expect(el).toHaveClass("page-layout--full");
    expect(el).not.toHaveClass("page-layout--standard");
  });

  it("passes additional className alongside the variant class", () => {
    const { container } = render(
      <PageLayout className="my-custom-class">content</PageLayout>,
    );
    const el = container.firstElementChild;
    expect(el).toHaveClass("page-layout--standard");
    expect(el).toHaveClass("my-custom-class");
  });
});

describe("PageLayout — children", () => {
  it("renders children", () => {
    render(<PageLayout>Hello world</PageLayout>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
