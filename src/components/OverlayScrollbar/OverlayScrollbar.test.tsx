import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";

import type { OverlayScrollbar as OverlayScrollbarType } from "./OverlayScrollbar";

/*
 * The component caches its `MediaQueryList` in a module-level singleton (the
 * store contract `useSyncExternalStore` requires), so each case imports a
 * fresh module after installing the `matchMedia` answer it wants.
 */
const originalMatchMedia = window.matchMedia;

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

async function loadComponent(isTouchPrimary: boolean) {
  vi.resetModules();
  installMatchMedia(isTouchPrimary);
  const mod = await import("./OverlayScrollbar");
  return mod.OverlayScrollbar;
}

function renderWithTarget(Component: typeof OverlayScrollbarType) {
  const targetRef = createRef<HTMLDivElement>();
  const result = render(
    <div style={{ position: "relative" }}>
      <div ref={targetRef} style={{ overflow: "auto" }}>
        content
      </div>
      <Component targetRef={targetRef} className="extra" />
    </div>,
  );
  return { ...result, targetRef };
}

describe("OverlayScrollbar", () => {
  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("renders a hidden track and opts the target out of its native bar on pointer-fine platforms", async () => {
    const Component = await loadComponent(false);
    const { container, targetRef } = renderWithTarget(Component);

    const track = container.querySelector(".uic-overlay-scrollbar");
    expect(track).toBeInTheDocument();
    expect(track).toHaveClass("extra");
    expect(track).toHaveAttribute("aria-hidden", "true");
    expect(track?.querySelector(".uic-overlay-scrollbar__thumb")).toBeInTheDocument();
    expect(targetRef.current).toHaveAttribute("data-uic-overlay-scrollbar", "true");
  });

  it("removes the opt-in attribute on unmount", async () => {
    const Component = await loadComponent(false);
    const { unmount, targetRef } = renderWithTarget(Component);
    const target = targetRef.current;

    unmount();

    expect(target).not.toHaveAttribute("data-uic-overlay-scrollbar");
  });

  it("marks the track not scrollable when the content fits", async () => {
    const Component = await loadComponent(false);
    const { container } = renderWithTarget(Component);
    expect(container.querySelector(".uic-overlay-scrollbar")).toHaveAttribute(
      "data-scrollable",
      "false",
    );
  });

  it("keeps the thumb inside the track when a fractional scrollTop overshoots the scroll range", async () => {
    const Component = await loadComponent(false);
    const frames: FrameRequestCallback[] = [];
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => frames.push(cb));
    const { container, targetRef } = renderWithTarget(Component);
    const target = targetRef.current;
    if (!target) throw new Error("no target");
    // jsdom has no layout: fake 900px of viewport over 1727px of content,
    // scrolled 0.5px past the integer range.
    Object.defineProperties(target, {
      clientHeight: { configurable: true, value: 900 },
      scrollHeight: { configurable: true, value: 1727 },
      scrollTop: { configurable: true, value: 827.5, writable: true },
    });
    target.dispatchEvent(new Event("scroll"));
    frames.splice(0).forEach((cb) => cb(0));

    const thumb = container.querySelector<HTMLElement>(".uic-overlay-scrollbar__thumb");
    const thumbHeight = (900 / 1727) * 900;
    const maxTop = 900 - thumbHeight;
    expect(thumb?.style.height).toBe(`${thumbHeight}px`);
    expect(thumb?.style.transform).toBe(`translateY(${maxTop}px)`);
    expect(container.querySelector(".uic-overlay-scrollbar")).toHaveAttribute(
      "data-scrollable",
      "true",
    );
    raf.mockRestore();
  });

  it("renders nothing and leaves the native indicator alone on touch-primary platforms", async () => {
    const Component = await loadComponent(true);
    const { container, targetRef } = renderWithTarget(Component);

    expect(container.querySelector(".uic-overlay-scrollbar")).toBeNull();
    expect(targetRef.current).not.toHaveAttribute("data-uic-overlay-scrollbar");
  });
});
