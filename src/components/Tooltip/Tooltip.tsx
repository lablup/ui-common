/**
 * Tooltip Component
 *
 * A reusable tooltip component that displays content on hover.
 * Supports both simple text and complex ReactNode content.
 *
 * Accessibility:
 * - Shows on mouse hover and keyboard focus (WCAG 1.4.13)
 * - Uses role="tooltip" for screen readers
 * - Accessible via keyboard navigation
 */

import { useState, useRef, useEffect, useCallback, useId, type ReactNode } from "react";
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
}

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
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const generatedId = useId();
  const effectiveTooltipId = tooltipId ?? `tooltip-${generatedId}`;

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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

  // Calculate tooltip position based on available space using fixed positioning
  useEffect(() => {
    if (!isVisible || !wrapperRef.current) return;
    if (!isMountedRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      if (!isMountedRef.current || !tooltipRef.current) return;

      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const spaceAbove = wrapperRect.top;
      const spaceBelow = window.innerHeight - wrapperRect.bottom;

      const tooltipHeight = tooltipRect.height;
      const margin = 10;

      // Determine placement
      const placement: "top" | "bottom" =
        spaceAbove < tooltipHeight + margin && spaceBelow > spaceAbove
          ? "bottom"
          : "top";

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
      let top: number;
      if (placement === "top") {
        top = wrapperRect.top - tooltipHeight - 8;
      } else {
        top = wrapperRect.bottom + 8;
      }

      setTooltipPosition({ top, left, placement });
    });
  }, [isVisible]);

  const handleShow = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleHide = useCallback(() => {
    setIsVisible(false);
    setTooltipPosition(null);
  }, []);

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
      tabIndex={tabIndex}
      aria-describedby={isVisible ? effectiveTooltipId : undefined}
    >
      {children}
      {tooltipElement && createPortal(tooltipElement, document.body)}
    </div>
  );
}
