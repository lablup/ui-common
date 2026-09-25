import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { DigitPopIn } from "./DigitPopIn";

function digits(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(".uic-digit-pop-in__digit"),
  );
}

function mockReducedMotion(): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

describe("DigitPopIn", () => {
  it("renders one staggered element per character", () => {
    const { container } = render(<DigitPopIn text="1,234" />);
    const chars = digits(container);
    expect(chars.map((char) => char.textContent)).toEqual(["1", ",", "2", "3", "4"]);
    expect(chars[4]?.style.getPropertyValue("--uic-digit-pop-in-index")).toBe("4");
  });

  it("hides the characters from assistive tech and exposes the whole text", () => {
    const { container } = render(<DigitPopIn text="1,234" />);
    expect(container.querySelector(".uic-digit-pop-in__digits")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector(".uic-digit-pop-in__text")).toHaveTextContent(
      "1,234",
    );
  });

  it("keeps a space as a non-breaking character so it holds its width", () => {
    const { container } = render(<DigitPopIn text="12 ms" />);
    expect(digits(container)[2]?.textContent).toBe(" ");
  });

  it("remounts the characters when the text changes, so they play again", () => {
    const { container, rerender } = render(<DigitPopIn text="12" />);
    const before = container.querySelector(".uic-digit-pop-in__digit");
    rerender(<DigitPopIn text="13" />);
    expect(digits(container).map((char) => char.textContent)).toEqual(["1", "3"]);
    expect(container.querySelector(".uic-digit-pop-in__digit")).not.toBe(before);
  });

  it("keeps the same characters when the text does not change", () => {
    const { container, rerender } = render(<DigitPopIn text="12" />);
    const before = container.querySelector(".uic-digit-pop-in__digit");
    rerender(<DigitPopIn text="12" className="x" />);
    expect(container.querySelector(".uic-digit-pop-in__digit")).toBe(before);
  });

  it("renders plain text under reduced motion", () => {
    const restore = mockReducedMotion();
    try {
      const { container } = render(<DigitPopIn text="1,234" />);
      expect(container.querySelector(".uic-digit-pop-in__digit")).toBeNull();
      expect(screen.getByText("1,234")).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
