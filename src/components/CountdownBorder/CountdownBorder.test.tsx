import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { CountdownBorder } from "./CountdownBorder";

// jsdom has no layout: give every element a box so the overlay renders.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(80);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(32);
});
afterEach(() => vi.restoreAllMocks());

const rectOf = (container: HTMLElement) =>
  container.querySelector<SVGRectElement>(".uic-countdown-border__fill");

describe("CountdownBorder", () => {
  it("draws a rect the size of the content that fills over durationMs", () => {
    const { container } = render(
      <CountdownBorder durationMs={5000}>
        <button type="button">Refresh</button>
      </CountdownBorder>,
    );
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    const rect = rectOf(container)!;
    expect(rect.getAttribute("width")).toBe("80");
    expect(rect.getAttribute("height")).toBe("32");
    expect(rect.getAttribute("pathLength")).toBe("100");
    expect(rect.style.animationDuration).toBe("5000ms");
    expect(rect.style.animationPlayState).toBe("running");
    expect(rect.style.stroke).toBe("var(--color-accent)");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("hides and freezes the border while paused", () => {
    const { container } = render(
      <CountdownBorder durationMs={1000} isPaused>
        x
      </CountdownBorder>,
    );
    expect(container.querySelector("svg")?.style.visibility).toBe("hidden");
    expect(rectOf(container)?.style.animationPlayState).toBe("paused");
  });

  it("draws nothing when not animated", () => {
    const { container } = render(
      <CountdownBorder durationMs={1000} isAnimated={false}>
        x
      </CountdownBorder>,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("styles the border from style and passes the rest to the wrapper", () => {
    const { container } = render(
      <CountdownBorder
        durationMs={1000}
        className="host"
        style={{
          stroke: "red",
          strokeWidth: 3,
          borderRadius: 2,
          margin: 4,
          position: "static",
        }}
      >
        x
      </CountdownBorder>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("uic-countdown-border", "host");
    expect(wrapper.style.margin).toBe("4px");
    expect(wrapper.style.position).toBe("relative");
    expect(wrapper.style.stroke).toBe("");
    const rect = rectOf(container)!;
    expect(rect.style.stroke).toBe("red");
    expect(rect.getAttribute("stroke-width")).toBe("3");
    expect(rect.getAttribute("rx")).toBe("2");
  });

  it("restarts the fill when resetKey changes", () => {
    const { container, rerender } = render(
      <CountdownBorder durationMs={1000} resetKey={1}>
        x
      </CountdownBorder>,
    );
    const first = rectOf(container);
    rerender(
      <CountdownBorder durationMs={1000} resetKey={2}>
        x
      </CountdownBorder>,
    );
    expect(rectOf(container)).not.toBe(first);
  });
});
