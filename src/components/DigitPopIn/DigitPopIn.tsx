/**
 * DigitPopIn Component
 *
 * Renders text, usually a formatted number, one element per character, each
 * rising into place from a light blur after the one before it. A new `text`
 * replays the animation. Under `prefers-reduced-motion` it renders the plain
 * text and never animates.
 *
 * The characters are hidden from assistive tech and a plain copy of the text
 * is read instead, so a screen reader hears "1,234" rather than five glyphs.
 *
 * `StatCard` uses it for `animate="digits"`; use it directly for a number
 * that is not in a card.
 */

import type { CSSProperties, JSX } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./DigitPopIn.css";

export interface DigitPopInProps {
  /** The text to animate, already formatted ("1,234", "98.5%"). */
  text: string;
  /** Extra class name applied to the root. */
  className?: string;
}

export function DigitPopIn({ text, className = "" }: DigitPopInProps): JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootClass = ["uic-digit-pop-in", className].filter(Boolean).join(" ");

  if (prefersReducedMotion) {
    return <span className={rootClass}>{text}</span>;
  }

  return (
    <span className={rootClass}>
      <span className="uic-digit-pop-in__text">{text}</span>
      {/* Keyed on the text, so a new value remounts the characters and the
          animation plays again. */}
      <span key={text} className="uic-digit-pop-in__digits" aria-hidden="true">
        {Array.from(text).map((char, index) => (
          <span
            // Position is the identity: the list is rebuilt whole whenever
            // the text changes.
            key={index}
            className="uic-digit-pop-in__digit"
            style={{ "--uic-digit-pop-in-index": index } as CSSProperties}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </span>
  );
}
