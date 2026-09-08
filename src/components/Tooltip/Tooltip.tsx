/**
 * Tooltip Component
 *
 * A reusable tooltip component that displays content on hover.
 * Supports both simple text and complex ReactNode content.
 *
 * Accessibility, against the three parts of WCAG 2.1 SC 1.4.13:
 * - Hoverable: the pointer can move onto the tooltip itself without it
 *   disappearing. The content sits 8px away from the trigger, so the pointer
 *   crosses a gap to get there and the hide is deferred over that crossing.
 * - Dismissible: Escape closes it without moving the pointer or focus.
 * - Persistent: it stays while the trigger is hovered or focused.
 *
 * Also uses role="tooltip" and aria-describedby so a screen reader announces
 * the content with the trigger. `toggleable` additionally makes the trigger a
 * button with aria-expanded that Enter and Space operate, for content a reader
 * summons rather than passes over.
 */

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useId,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./Tooltip.css";

export interface TooltipProps {
  /** Tooltip content - can be string or ReactNode */
  content: ReactNode;
  /** Children to wrap with tooltip (trigger element) */
  children: ReactNode;
  /** Additional class name for the wrapper */
  className?: string;
  /** Additional class name for the tooltip content */
  contentClassName?: string;
  /** Custom ID for the tooltip (for aria-describedby association) */
  tooltipId?: string;
  /** Tab index for the wrapper. Use -1 when wrapping already-focusable elements like buttons. Defaults to 0. */
  tabIndex?: number;
  /**
   * Announce the trigger as a button carrying `aria-expanded`, and let Enter
   * and Space toggle the content.
   *
   * Off by default: a trigger whose content only supplements what is already
   * on screen is not a control and should not claim to be one. Turn it on
   * where the content is something a reader summons deliberately. A glossary
   * term is the case this exists for, and two products had independently built
   * the same trigger contract around one.
   *
   * Do not combine with `tabIndex={-1}`, which is for wrapping an element that
   * is already focusable and already owns its role.
   */
  toggleable?: boolean;
}

/** Long enough to cross the 8px gap to the tooltip, short enough not to linger. */
const HIDE_GRACE_MS = 120;

interface TooltipPosition {
  top: number;
  left: number;
  placement: "top" | "bottom";
}

export function Tooltip({
  content,
  children,
  className,
  contentClassName,
  tooltipId,
  tabIndex = 0,
  toggleable = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatedId = useId();
  const effectiveTooltipId = tooltipId ?? `tooltip-${generatedId}`;

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Handle focus events using focusin/focusout which bubble from child elements
  // This ensures tooltips show when keyboard focus moves to children (WCAG 1.4.13)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // focusin/focusout bubble from child elements, unlike focus/blur
    const handleFocusIn = () => {
      if (isMountedRef.current) {
        setIsVisible(true);
      }
    };

    const handleFocusOut = () => {
      if (isMountedRef.current) {
        setIsVisible(false);
        setTooltipPosition(null);
      }
    };

    wrapper.addEventListener("focusin", handleFocusIn);
    wrapper.addEventListener("focusout", handleFocusOut);

    return () => {
      wrapper.removeEventListener("focusin", handleFocusIn);
      wrapper.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  /**
   * Place the tooltip beside the trigger, in whichever direction has room.
   *
   * Reads both boxes at call time rather than closing over them, because this
   * runs again every time the trigger moves under the viewport.
   */
  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    const tooltip = tooltipRef.current;
    if (!isMountedRef.current || !wrapper || !tooltip) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const spaceAbove = wrapperRect.top;
    const spaceBelow = window.innerHeight - wrapperRect.bottom;

    const tooltipHeight = tooltipRect.height;
    const margin = 10;

    // Determine placement
    const placement: "top" | "bottom" =
      spaceAbove < tooltipHeight + margin && spaceBelow > spaceAbove ? "bottom" : "top";

    // Calculate left position (center on wrapper, but ensure it stays within viewport)
    const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
    const tooltipWidth = tooltipRect.width;
    let left = wrapperCenter - tooltipWidth / 2;
    const viewportWidth = window.innerWidth;

    // Keep tooltip within viewport bounds
    if (left + tooltipWidth > viewportWidth - 16) {
      left = viewportWidth - tooltipWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    // Calculate top position
    const top =
      placement === "top"
        ? wrapperRect.top - tooltipHeight - 8
        : wrapperRect.bottom + 8;

    setTooltipPosition({ top, left, placement });
  }, []);

  /**
   * The content is `position: fixed` and lives in a portal, so nothing moves it
   * when the trigger moves. Any scroll between the two, on the page or on a
   * container in between, leaves it pointing at where the trigger used to be,
   * and a resize can leave it off the edge. Scroll events from a container do
   * not bubble, hence the capture phase.
   *
   * A layout effect, not an effect plus a frame. The content is in the DOM by
   * the time this runs and can be measured, and the state it sets is flushed
   * before the browser paints, so the tooltip is never painted unplaced. The
   * frame it used to wait for was a frame the tooltip spent mounted and
   * `visibility: hidden`, which is out of the accessibility tree: present but
   * unreadable, and unfindable by any query that respects that tree.
   */
  useLayoutEffect(() => {
    if (!isVisible) return;

    measure();
    window.addEventListener("scroll", measure, { capture: true, passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [isVisible, measure]);

  const handleShow = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsVisible(true);
  }, []);

  const hideNow = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsVisible(false);
    setTooltipPosition(null);
  }, []);

  /**
   * Deferred so the pointer can cross the 8px gap between the trigger and the
   * tooltip. React propagates enter and leave through the portal, so a direct
   * hop onto the content never fires this; the gap does, because the pointer
   * passes over a node that belongs to neither element. Hiding on that would
   * put the content out of reach (WCAG 2.1 SC 1.4.13, Hoverable). Arriving on
   * either element cancels the pending hide.
   */
  const handleHide = useCallback(() => {
    if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (!isMountedRef.current) return;
      setIsVisible(false);
      setTooltipPosition(null);
    }, HIDE_GRACE_MS);
  }, []);

  // Dismissible: Escape closes without moving the pointer or focus. Bound to
  // the document because focus may sit on a child of the trigger, or nowhere
  // at all when the tooltip was opened by hover.
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideNow();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isVisible, hideNow]);

  /**
   * Enter and Space toggle, for a trigger that is a control rather than
   * incidental hover help. Both default to something else, Space scrolling the
   * page and Enter submitting an enclosing form, so both are prevented.
   */
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (isVisible) {
        hideNow();
      } else {
        handleShow();
      }
    },
    [isVisible, hideNow, handleShow],
  );

  const tooltipElement = isVisible && (
    <div
      ref={tooltipRef}
      id={effectiveTooltipId}
      className={`tooltip__content tooltip__content--${tooltipPosition?.placement ?? "top"} ${contentClassName ?? ""}`}
      style={
        tooltipPosition
          ? {
              top: `${String(tooltipPosition.top)}px`,
              left: `${String(tooltipPosition.left)}px`,
            }
          : { visibility: "hidden" }
      }
      role="tooltip"
    >
      {typeof content === "string" ? (
        <p className="tooltip__text">{content}</p>
      ) : (
        content
      )}
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      className={`tooltip__wrapper ${className ?? ""}`}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onKeyDown={toggleable ? handleKeyDown : undefined}
      tabIndex={tabIndex}
      role={toggleable ? "button" : undefined}
      aria-expanded={toggleable ? isVisible : undefined}
      aria-describedby={isVisible ? effectiveTooltipId : undefined}
    >
      {children}
      {tooltipElement && createPortal(tooltipElement, document.body)}
    </div>
  );
}
