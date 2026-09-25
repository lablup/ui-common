/**
 * The one level stack every portalled modal surface shares.
 *
 * `Modal` renders into a `document.body` portal instead of the browser's top
 * layer (see Modal.tsx for why). Without the top layer, stacking and
 * inertness are this module's job: a surface opened from inside another
 * paints above it, and only the topmost one is interactive.
 *
 * Other portalled modal surfaces (a scrimmed drawer, say) claim a level with
 * `useModalLevel` so they stack on the same order as `Modal`.
 */
import { useEffectEvent, useLayoutEffect, useState, type RefObject } from "react";
import { devWarn } from "@astryxdesign/core/utils";

/**
 * Marks an open modal root. Scope document queries to it through this
 * constant rather than retyping the string.
 */
export const MODAL_OPEN_ATTRIBUTE = "data-uic-modal-open";

/** Nesting depth ceiling. Two surfaces past it share a level. */
export const MAX_MODAL_LEVEL = 80;

/**
 * The z-index band modal roots paint in. `base` is the first level, each
 * nested level adds `step`, and nothing paints above `max`, so whatever the
 * app layers above the band (a notification stack) stays above every modal.
 */
export interface ModalZIndexBand {
  base: number;
  step: number;
  max: number;
}

const DEFAULT_BAND: ModalZIndexBand = { base: 1100, step: 10, max: 10999 };
let band: ModalZIndexBand = DEFAULT_BAND;

/**
 * Sets the z-index band for every modal opened after the call. Call it once,
 * at startup, to fit the app's own layer ladder. The default is
 * `{ base: 1100, step: 10, max: 10999 }`. Pass nothing to restore it.
 */
export function configureModalZIndex(next?: Partial<ModalZIndexBand>): void {
  band = { ...DEFAULT_BAND, ...next };
}

const LEVEL_CSS_VAR = "--uic-modal-level";
const Z_INDEX_CSS_VAR = "--uic-modal-z";

/** A claim on the stack. Released by reference, never by level. */
export interface ModalLevelEntry {
  level: number;
  zIndex: number;
  isTopmost: boolean;
  root: HTMLElement | null;
  setIsTopmost: (isTopmost: boolean) => void;
}

const openModals: ModalLevelEntry[] = [];

/**
 * One step above the topmost surface (or the band's base), raised by an
 * accepted override. Stacking and inertness therefore run on one order: a
 * surface opened later paints above an earlier one, whatever that one asked.
 */
function resolveZIndex(
  topmost: ModalLevelEntry | undefined,
  requested?: number,
): number {
  let override = requested;
  if (override != null && (override < band.base || override > band.max)) {
    devWarn(
      "Modal",
      `zIndex ${override} is outside the modal band (${band.base}..${band.max}); ` +
        "ignoring it. Change the band with configureModalZIndex instead.",
    );
    override = undefined;
  }
  const floor = topmost?.zIndex ?? band.base - band.step;
  return Math.min(Math.max(floor + band.step, override ?? 0), band.max);
}

/**
 * Only the topmost surface stays interactive. A covered one drops its focus
 * trap and goes `inert`: the trap alone lets Tab escape to the parent, and
 * `inert` alone leaves the covered trap swallowing Tab with nothing to focus.
 */
function syncCovered(): void {
  openModals.forEach((entry, index) => {
    const isTopmost = index === openModals.length - 1;
    entry.root?.toggleAttribute("inert", !isTopmost);
    if (entry.isTopmost !== isTopmost) {
      entry.isTopmost = isTopmost;
      entry.setIsTopmost(isTopmost);
    }
  });
}

export function claimModalLevel(
  root: HTMLElement | null,
  setIsTopmost: (isTopmost: boolean) => void,
  requestedZIndex?: number,
): ModalLevelEntry {
  const topmost = openModals.at(-1);
  const entry: ModalLevelEntry = {
    level: Math.min((topmost?.level ?? -1) + 1, MAX_MODAL_LEVEL),
    zIndex: resolveZIndex(topmost, requestedZIndex),
    isTopmost: true,
    root,
    setIsTopmost,
  };
  openModals.push(entry);
  syncCovered();
  return entry;
}

export function releaseModalLevel(entry: ModalLevelEntry): void {
  const index = openModals.indexOf(entry);
  if (index === -1) return;
  entry.root?.removeAttribute("inert");
  openModals.splice(index, 1);
  syncCovered();
}

/**
 * Claims a level for `rootRef` while `isOpen`, and writes the level and the
 * resolved z-index onto the root as `--uic-modal-level` and `--uic-modal-z`.
 * Returns whether this surface is the topmost one; gate a focus trap on it.
 */
export function useModalLevel(
  rootRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  zIndex?: number,
): boolean {
  const [isTopmost, setIsTopmost] = useState(true);
  // Read at claim time only: re-claiming would move an open surface to the
  // top of the stack and inert whatever legitimately covered it.
  const readZIndex = useEffectEvent(() => zIndex);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const root = rootRef.current;
    const entry = claimModalLevel(root, setIsTopmost, readZIndex());
    root?.style.setProperty(LEVEL_CSS_VAR, String(entry.level));
    root?.style.setProperty(Z_INDEX_CSS_VAR, String(entry.zIndex));
    return () => {
      releaseModalLevel(entry);
      root?.style.removeProperty(LEVEL_CSS_VAR);
      root?.style.removeProperty(Z_INDEX_CSS_VAR);
    };
    // An effect event is not a dependency; this plugin version predates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rootRef]);

  return isTopmost;
}
