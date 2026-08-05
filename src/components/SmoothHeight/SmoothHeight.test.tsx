/**
 * SmoothHeight Component Tests
 */

import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SmoothHeight } from "./SmoothHeight";

type ObserverCallback = (
  entries: ResizeObserverEntry[],
  observer: ResizeObserver,
) => void;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: ObserverCallback;
  observed: Element[] = [];

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve() {}

  disconnect() {
    this.observed = [];
  }

  trigger() {
    this.callback([], this);
  }
}

function setOffsetHeight(element: Element, value: number) {
  Object.defineProperty(element, "offsetHeight", {
    configurable: true,
    get: () => value,
  });
}

describe("SmoothHeight", () => {
  beforeEach(() => {
    MockResizeObserver.instances = [];
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders children", () => {
    const { getByText } = render(
      <SmoothHeight active={false}>
        <p>Hello</p>
      </SmoothHeight>,
    );
    expect(getByText("Hello")).toBeInTheDocument();
  });

  it("applies the active modifier class while active", () => {
    const { container, rerender } = render(
      <SmoothHeight active={false}>content</SmoothHeight>,
    );
    const outer = container.querySelector(".smooth-height");
    expect(outer).not.toHaveClass("smooth-height--active");

    rerender(<SmoothHeight active={true}>content</SmoothHeight>);
    expect(outer).toHaveClass("smooth-height--active");
  });

  it("tracks the measured content height while active", () => {
    const { container } = render(<SmoothHeight active={true}>content</SmoothHeight>);
    const outer = container.querySelector<HTMLElement>(".smooth-height");
    const inner = container.querySelector<HTMLElement>(".smooth-height__content");
    expect(outer?.style.height).toBe("0px");

    // Content grows: the observer fires and the wrapper height follows.
    setOffsetHeight(inner as Element, 120);
    act(() => {
      MockResizeObserver.instances[0]?.trigger();
    });
    expect(outer?.style.height).toBe("120px");
  });

  it("releases the explicit height shortly after deactivation", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <SmoothHeight active={true}>content</SmoothHeight>,
    );
    const outer = container.querySelector<HTMLElement>(".smooth-height");
    const inner = container.querySelector<HTMLElement>(".smooth-height__content");
    setOffsetHeight(inner as Element, 80);
    act(() => {
      MockResizeObserver.instances[0]?.trigger();
    });
    expect(outer?.style.height).toBe("80px");

    rerender(<SmoothHeight active={false}>content</SmoothHeight>);
    // Height is held while the in-flight transition settles
    expect(outer?.style.height).toBe("80px");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(outer?.style.height).toBe("");
  });

  it("renders plain wrappers when ResizeObserver is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { container } = render(<SmoothHeight active={true}>content</SmoothHeight>);
    const outer = container.querySelector<HTMLElement>(".smooth-height");
    expect(outer?.style.height).toBe("");
  });
});
