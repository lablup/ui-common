/**
 * usePrefersReducedMotion Hook
 *
 * Reactive subscription to the `prefers-reduced-motion: reduce` media
 * query. Returns true when the user has asked the OS to minimize
 * non-essential motion; components should disable decorative animation
 * (typewriter reveals, entrance transitions, pulses) in that case.
 *
 * Safe in non-browser/test environments: returns false when
 * `window.matchMedia` is unavailable.
 */

import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getInitialValue(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
