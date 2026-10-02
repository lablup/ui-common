import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ImageWithFallback } from "./ImageWithFallback";

const fallback = <span data-testid="fallback">icon</span>;

describe("ImageWithFallback", () => {
  it("renders the image with its alt text and the other img props", () => {
    render(
      <ImageWithFallback
        src="/a.png"
        alt="Vendor"
        width={16}
        fallbackIcon={fallback}
      />,
    );
    const img = screen.getByRole("img", { name: "Vendor" });
    expect(img).toHaveAttribute("src", "/a.png");
    expect(img).toHaveAttribute("width", "16");
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });

  it("swaps in the fallback once the image fails to load", () => {
    render(<ImageWithFallback src="/a.png" alt="Vendor" fallbackIcon={fallback} />);
    fireEvent.error(screen.getByRole("img"));
    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("tries again when the src changes", () => {
    const { rerender } = render(
      <ImageWithFallback src="/a.png" alt="Vendor" fallbackIcon={fallback} />,
    );
    fireEvent.error(screen.getByRole("img"));
    rerender(<ImageWithFallback src="/b.png" alt="Vendor" fallbackIcon={fallback} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/b.png");
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });

  it("keeps the image's accessible name on the fallback", () => {
    render(<ImageWithFallback src="/a.png" alt="Vendor" fallbackIcon={fallback} />);
    fireEvent.error(screen.getByRole("img"));
    const named = screen.getByRole("img", { name: "Vendor" });
    expect(named).toContainElement(screen.getByTestId("fallback"));
  });

  it("keeps a decorative image's fallback out of the accessibility tree", () => {
    render(<ImageWithFallback src="/a.png" alt="" fallbackIcon={fallback} />);
    fireEvent.error(document.querySelector("img") as HTMLImageElement);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("fallback").closest("[aria-hidden='true']"),
    ).not.toBeNull();
  });
});
