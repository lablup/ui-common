/**
 * OverlayScrollbar
 *
 * A persistent scroll thumb painted over a scroll container instead of beside
 * it. On pointer-driven platforms it hides the target's native bar and draws
 * its own track, so becoming scrollable never changes the content width
 * (`overflow: overlay` is gone from Chromium, and `scrollbar-gutter: stable`
 * leaves a permanently empty strip). The thumb stays visible while the
 * content overflows, which is what makes scrollability discoverable, and it
 * can be dragged. Every update writes to the DOM directly, so scrolling stays
 * out of React's render loop.
 *
 * Render it inside the target's positioned ancestor: the track is
 * `position: absolute`. On touch-primary platforms it renders nothing and
 * leaves the native indicator alone.
 *
 * The track's stacking order is `--uic-overlay-scrollbar-z` (default 1);
 * raise it to clear sticky chrome inside the scroll column.
 *
 * @example
 * <div style={{ position: "relative" }}>
 *   <div ref={scrollRef} style={{ overflow: "auto", height: "100%" }}>...</div>
 *   <OverlayScrollbar targetRef={scrollRef} />
 * </div>
 */
import { useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";

import "./OverlayScrollbar.css";

/** The attribute that opts a target into hiding its native bar. */
export const OVERLAY_SCROLLBAR_ATTRIBUTE = "data-uic-overlay-scrollbar";

const MIN_THUMB_HEIGHT = 24;

/*
 * Touch-primary platforms keep their native indicator: it already floats over
 * the content, a persistent bar is not the convention there, and iOS momentum
 * scrolling starves JS of the events a drawn thumb needs. The gate is the
 * pointer type, not the measured scrollbar width: macOS with a trackpad has
 * zero-width overlay bars, yet a transient bar is the problem this solves.
 *
 * A module-level singleton and a boolean snapshot, per the store contract
 * `useSyncExternalStore` requires.
 */
const COARSE_POINTER_QUERY = "(pointer: coarse)";
let coarsePointerQueryList: MediaQueryList | null = null;

function getCoarsePointerQueryList(): MediaQueryList {
  if (!coarsePointerQueryList) {
    coarsePointerQueryList = window.matchMedia(COARSE_POINTER_QUERY);
  }
  return coarsePointerQueryList;
}

function subscribeToPointerType(onStoreChange: () => void): () => void {
  const list = getCoarsePointerQueryList();
  list.addEventListener("change", onStoreChange);
  return () => list.removeEventListener("change", onStoreChange);
}

const getIsTouchPrimary = (): boolean => getCoarsePointerQueryList().matches;
// Assume touch on the server, so nothing is hidden before hydration measures.
const getIsTouchPrimaryOnServer = (): boolean => true;

export interface OverlayScrollbarProps {
  /** The scroll container the thumb tracks. */
  targetRef: RefObject<HTMLElement | null>;
  /** Extra class names on the track. */
  className?: string;
}

export function OverlayScrollbar({ targetRef, className }: OverlayScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isTouchPrimary = useSyncExternalStore(
    subscribeToPointerType,
    getIsTouchPrimary,
    getIsTouchPrimaryOnServer,
  );

  useLayoutEffect(() => {
    const el = targetRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (isTouchPrimary || !el || !track || !thumb) {
      return;
    }

    // Set here, not in markup, so the native bar is untouched wherever this
    // never renders a thumb.
    el.setAttribute(OVERLAY_SCROLLBAR_ATTRIBUTE, "true");

    let rafId: number | undefined;

    const layout = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const scrollable = scrollHeight > clientHeight + 1;
      track.dataset.scrollable = scrollable ? "true" : "false";
      if (!scrollable) {
        return;
      }
      const thumbHeight = Math.max(
        (clientHeight / scrollHeight) * clientHeight,
        MIN_THUMB_HEIGHT,
      );
      const maxTop = clientHeight - thumbHeight;
      // A fractional scrollTop (zoom, DPR > 1) can exceed the integer range.
      const top = Math.min(
        Math.max((scrollTop / (scrollHeight - clientHeight)) * maxTop || 0, 0),
        maxTop,
      );
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${top}px)`;
    };

    const scheduleLayout = () => {
      if (rafId !== undefined) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        rafId = undefined;
        layout();
      });
    };

    el.addEventListener("scroll", scheduleLayout, { passive: true });
    const resizeObserver = new ResizeObserver(scheduleLayout);
    resizeObserver.observe(el);
    // `scrollHeight` changes with content, which no ResizeObserver on the
    // scroller reports: watch subtree mutations, rAF-throttled.
    const mutationObserver = new MutationObserver(scheduleLayout);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // The native bar is hidden, so the thumb owns dragging.
    let dragStartY = 0;
    let dragStartScrollTop = 0;
    const onPointerMove = (event: PointerEvent) => {
      const { scrollHeight, clientHeight } = el;
      const thumbHeight = thumb.getBoundingClientRect().height;
      const maxTop = clientHeight - thumbHeight;
      if (maxTop <= 0) {
        return;
      }
      const deltaRatio = (event.clientY - dragStartY) / maxTop;
      el.scrollTop = dragStartScrollTop + deltaRatio * (scrollHeight - clientHeight);
    };
    const onPointerUp = () => {
      track.dataset.dragging = "false";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      dragStartY = event.clientY;
      dragStartScrollTop = el.scrollTop;
      track.dataset.dragging = "true";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };
    thumb.addEventListener("pointerdown", onPointerDown);

    layout();

    return () => {
      el.removeAttribute(OVERLAY_SCROLLBAR_ATTRIBUTE);
      el.removeEventListener("scroll", scheduleLayout);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      thumb.removeEventListener("pointerdown", onPointerDown);
      onPointerUp();
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [targetRef, isTouchPrimary]);

  if (isTouchPrimary) {
    return null;
  }

  return (
    <div
      ref={trackRef}
      className={["uic-overlay-scrollbar", className].filter(Boolean).join(" ")}
      data-scrollable="false"
      aria-hidden="true"
    >
      <div ref={thumbRef} className="uic-overlay-scrollbar__thumb" />
    </div>
  );
}

OverlayScrollbar.displayName = "OverlayScrollbar";
