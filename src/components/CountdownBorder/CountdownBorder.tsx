/**
 * CountdownBorder
 *
 * Wraps its children in a rounded-rect border that fills clockwise over
 * `durationMs` and starts again: a countdown to the next automatic refresh.
 * The wrapper measures its own box, so the outline fits the content at any
 * size; the stroke is centred on the content's edge, so half of it stays
 * visible over opaque children. Under `prefers-reduced-motion` the border
 * does not animate.
 *
 * The border's look comes from `style`: `stroke` (default
 * `var(--color-accent)`), `strokeWidth` (default 1.5) and `borderRadius`
 * (default the theme's `--radius-inner`). The rest of `style` reaches the
 * wrapper.
 *
 * @example
 * <CountdownBorder durationMs={5000} resetKey={fetchKey} isPaused={isFetching}>
 *   <IconButton label="Refresh" icon={<RotateCw />} onClick={refetch} />
 * </CountdownBorder>
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Key,
  type ReactElement,
  type ReactNode,
} from "react";
import { useTheme } from "@astryxdesign/core/theme";

import "./CountdownBorder.css";

export interface CountdownBorderProps {
  children?: ReactNode;
  /** Length of one fill cycle, in milliseconds. */
  durationMs: number;
  /** Whether the border shows and fills. Default: true */
  isAnimated?: boolean;
  /**
   * Restarts the fill on this render when it changes. Pass the trigger of the
   * real refresh, so the countdown never drifts from it.
   */
  resetKey?: Key;
  /** Freezes the fill and hides the border, e.g. while a refresh runs. Default: false */
  isPaused?: boolean;
  className?: string;
  /** Wrapper style; `stroke`, `strokeWidth` and `borderRadius` style the border. */
  style?: CSSProperties;
}

export function CountdownBorder({
  children,
  durationMs,
  isAnimated = true,
  resetKey,
  isPaused = false,
  className,
  style,
}: CountdownBorderProps): ReactElement {
  const { token } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const {
    // A var(), so a nested Astryx Theme's accent applies.
    stroke = "var(--color-accent)",
    strokeWidth = 1.5,
    // `rx` takes a length, not a var(): resolved from the theme.
    borderRadius = token("--radius-inner"),
    ...wrapperStyle
  } = style ?? {};
  const { w, h } = size;

  return (
    <div
      ref={ref}
      className={["uic-countdown-border", className].filter(Boolean).join(" ")}
      // `position: relative` stays last: the overlay depends on it.
      style={{ display: "inline-flex", ...wrapperStyle, position: "relative" }}
    >
      {children}
      {isAnimated && w > 0 && h > 0 && (
        <svg
          aria-hidden
          width={w}
          height={h}
          className="uic-countdown-border__overlay"
          // Hidden, not just paused: at offset 100 the dash edge can still
          // paint a sliver at the path start.
          style={{ visibility: isPaused ? "hidden" : "visible" }}
        >
          <rect
            key={resetKey}
            x={0}
            y={0}
            width={w}
            height={h}
            rx={borderRadius}
            ry={borderRadius}
            fill="none"
            strokeWidth={strokeWidth}
            pathLength={100}
            strokeDasharray={100}
            className="uic-countdown-border__fill"
            style={{
              // A CSS property: var() does not resolve in the stroke attribute.
              stroke,
              animationDuration: `${durationMs}ms`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
          />
        </svg>
      )}
    </div>
  );
}

CountdownBorder.displayName = "CountdownBorder";
