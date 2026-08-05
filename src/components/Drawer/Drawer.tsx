/**
 * Drawer Component
 *
 * A reusable right-side drawer panel with backdrop, animations, and accessibility features.
 * Consolidates common patterns from all drawer implementations.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import "./Drawer.css";

export interface DrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Drawer title */
  title: React.ReactNode;
  /** Optional subtitle */
  subtitle?: React.ReactNode;
  /** Drawer width preset or custom CSS width value */
  width?: "narrow" | "medium" | "wide" | (string & Record<never, never>);
  /** Drawer content */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Additional CSS class for drawer panel */
  className?: string;
  /** ARIA labelledby ID (defaults to internal title ID) */
  ariaLabelledBy?: string;
  /** ARIA describedby ID (defaults to internal subtitle ID if subtitle exists) */
  ariaDescribedBy?: string;
  /** Accessible label for the close button. Default: "Close" */
  closeLabel?: string;
}

const WIDTH_PRESETS = {
  narrow: "400px",
  medium: "520px",
  wide: "900px",
};

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  width = "medium",
  children,
  footer,
  className = "",
  ariaLabelledBy,
  ariaDescribedBy,
  closeLabel = "Close",
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Track if this is the first render to enable animation on initial open
  // Without this, when the component mounts with isOpen=true, there's no
  // transition because CSS transitions only apply to state changes, not initial renders.
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      // First time opening - delay adding open class to trigger animation
      hasInitialized.current = true;
      // Use double rAF to ensure the closed state is painted first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    } else if (isOpen) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [isOpen]);

  // Compute the actual open state for CSS classes
  const isVisuallyOpen = isOpen && shouldAnimate;

  // Compute width value
  const widthValue =
    width in WIDTH_PRESETS ? WIDTH_PRESETS[width as keyof typeof WIDTH_PRESETS] : width;

  // Internal IDs for ARIA
  const titleId = ariaLabelledBy || "drawer-title";
  const subtitleId = ariaDescribedBy || (subtitle ? "drawer-subtitle" : undefined);

  // Focus management and trap
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    const drawer = drawerRef.current;
    if (!drawer) return;

    // Focus close button when drawer opens
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    // Setup focus trap
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Tab key focus trap
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    drawer.addEventListener("keydown", handleKeyDown);

    return () => {
      drawer.removeEventListener("keydown", handleKeyDown);
      // Restore focus when drawer closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      className={`drawer__backdrop ${isVisuallyOpen ? "drawer__backdrop--open" : ""}`}
      onClick={handleBackdropClick}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <aside
        ref={drawerRef}
        className={`drawer ${isVisuallyOpen ? "drawer--open" : ""} ${className}`}
        style={{ width: widthValue, maxWidth: "100vw" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
      >
        {/* Header */}
        <header className="drawer__header">
          <div className="drawer__title-row">
            <h2 id={titleId} className="drawer__title">
              {title}
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="drawer__close-btn"
              onClick={onClose}
              aria-label={closeLabel}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
          {subtitle && (
            <p id={subtitleId} className="drawer__subtitle">
              {subtitle}
            </p>
          )}
        </header>

        {/* Content */}
        <div className="drawer__content">{children}</div>

        {/* Footer */}
        {footer && <footer className="drawer__footer">{footer}</footer>}
      </aside>
    </div>
  );
}
