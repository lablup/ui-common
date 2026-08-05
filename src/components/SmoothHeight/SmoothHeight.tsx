/**
 * SmoothHeight Component
 *
 * Animates a container's height toward its content's natural height, so
 * content that grows in discrete jumps (streaming text wrapping onto new
 * lines) expands smoothly instead of snapping one line at a time.
 *
 * While `active`, the inner content is measured with a ResizeObserver and
 * the outer wrapper gets an explicit pixel height with a CSS height
 * transition. CSS cannot transition to `height: auto` (and the
 * `interpolate-size` opt-in is not available in WebKit), so the explicit
 * measurement is what makes the animation possible cross-platform.
 *
 * The very first activation does not animate: the wrapper goes from
 * `auto` to a pixel height, which CSS treats as non-interpolable and
 * applies instantly. Only subsequent pixel-to-pixel growth animates.
 *
 * When `active` turns off, the pixel height is kept just long enough for
 * the in-flight transition to settle, then released back to `auto` so
 * later reflows (window resizing, images loading) are unaffected.
 *
 * Degrades gracefully: without ResizeObserver (test environments), it
 * renders plain pass-through wrappers with auto height.
 */

import { useLayoutEffect, useRef, type ReactNode } from "react";
import "./SmoothHeight.css";

export interface SmoothHeightProps {
  /** Whether height changes should currently be animated */
  active: boolean;
  children: ReactNode;
  /** Additional class for the outer wrapper */
  className?: string;
}

/**
 * Delay before releasing the explicit height after deactivation, covering
 * the height transition duration (--token-motionDurationMid = 0.2s).
 */
const RELEASE_DELAY_MS = 250;

export function SmoothHeight({ active, children, className }: SmoothHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const releaseTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (typeof ResizeObserver === "undefined") return;

    if (!active) {
      // Keep the last pixel height while the in-flight transition
      // settles, then release to auto.
      releaseTimerRef.current = window.setTimeout(() => {
        outer.style.height = "";
        releaseTimerRef.current = null;
      }, RELEASE_DELAY_MS);
      return () => {
        if (releaseTimerRef.current !== null) {
          window.clearTimeout(releaseTimerRef.current);
          releaseTimerRef.current = null;
        }
      };
    }

    // (Re)activated: cancel any pending release and track the content.
    if (releaseTimerRef.current !== null) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }

    const measure = () => {
      outer.style.height = `${inner.offsetHeight.toFixed(0)}px`;
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    return () => {
      observer.disconnect();
    };
  }, [active]);

  return (
    <div
      ref={outerRef}
      className={`smooth-height${active ? " smooth-height--active" : ""}${className ? ` ${className}` : ""}`}
    >
      <div ref={innerRef} className="smooth-height__content">
        {children}
      </div>
    </div>
  );
}
