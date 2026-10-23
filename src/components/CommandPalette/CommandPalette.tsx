/**
 * CommandPalette, Astryx's with one change: it sits at a fixed offset from
 * the top of the viewport (`--command-palette-top`, 15dvh) instead of
 * centred. Astryx's dialog re-centres on every height change, so a result
 * list that shrinks while the user types moves the input under the caret.
 * Pinned, the input stays put and the surface grows and shrinks downward
 * only; `maxHeight` is capped by the viewport left below the offset. The
 * inline preview (`isInline`) is not a positioned dialog and is unchanged.
 * The API is Astryx's, unchanged.
 */
import {
  CommandPalette as AstryxCommandPalette,
  type CommandPaletteProps,
} from "@astryxdesign/core/CommandPalette";
import type { SearchableItem } from "@astryxdesign/core/Typeahead";

import "./CommandPalette.css";

export type { CommandPaletteProps };

/** Astryx's default `maxHeight`. */
const DEFAULT_MAX_HEIGHT = 480;

/** The viewport below the top offset, less the gutter Astryx's dialog keeps. */
const AVAILABLE_HEIGHT = "calc(100dvh - var(--command-palette-top) - var(--spacing-4))";

function toCssLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

export function CommandPalette<T extends SearchableItem = SearchableItem>({
  isInline,
  maxHeight = DEFAULT_MAX_HEIGHT,
  className,
  ...rest
}: CommandPaletteProps<T>) {
  if (isInline) {
    return (
      <AstryxCommandPalette<T>
        {...rest}
        isInline
        maxHeight={maxHeight}
        className={className}
      />
    );
  }
  return (
    <AstryxCommandPalette<T>
      {...rest}
      maxHeight={`min(${toCssLength(maxHeight)}, ${AVAILABLE_HEIGHT})`}
      className={["uic-command-palette", className].filter(Boolean).join(" ")}
    />
  );
}

CommandPalette.displayName = "CommandPalette";
