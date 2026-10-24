/**
 * The one level stack every portalled modal surface shares.
 *
 * `Modal` renders into a `document.body` portal instead of the browser's top
 * layer (see Modal.tsx for why). Without the top layer, stacking and
 * inertness are this module's job: a surface opened from inside another
 * paints above it, only the topmost one is interactive, and while any is
 * open the page behind them is inert, except what is marked
 * `MODAL_LIVE_ATTRIBUTE`.
 *
 * Other portalled modal surfaces (a scrimmed drawer, say) claim a level with
 * `useModalLevel` so they stack on the same order as `Modal`.
 */
import {
  createContext,
  useContext,
  useEffectEvent,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import { devWarn } from "@astryxdesign/core/utils";

import { registerInstance } from "../../instance";

/**
 * Marks an open modal root. Scope document queries to it through this
 * constant rather than retyping the string.
 */
export const MODAL_OPEN_ATTRIBUTE = "data-uic-modal-open";

/**
 * The open modal `<dialog>` a surface inside it renders into, instead of
 * `document.body`. `showModal()` makes everything outside the dialog inert,
 * so a `Modal` portalled to the body from inside a scrimmed drawer would sit
 * behind the drawer, unreachable. `Drawer` (src/forks/Drawer) provides its
 * dialog while it is modal; `Modal` renders there and enters the top layer
 * itself, as a manual popover, so it paints above the drawer and escapes the
 * panel's clipping and transform. Internal: not exported from the package.
 */
export const ModalPortalContext = createContext<HTMLElement | null>(null);

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

/** The band's first level; a scrimless Drawer (src/forks/Drawer) stays below it. */
export function modalZIndexBase(): number {
  return band.base;
}

const LEVEL_CSS_VAR = "--modal-level";
const Z_INDEX_CSS_VAR = "--modal-z";

/**
 * The identity of a modal surface in the React tree, for nesting: a surface
 * rendered inside another one's content reads its parent's token here and
 * claims its level above it. `Modal` provides its own token to its content.
 * Internal: not exported from the package.
 */
export type ModalStackNode = { readonly __modalStackNode?: never };

export const ModalStackNodeContext = createContext<ModalStackNode | null>(null);

/** A claim on the stack. Released by reference, never by level. */
export interface ModalLevelEntry {
  level: number;
  zIndex: number;
  isTopmost: boolean;
  root: HTMLElement | null;
  setIsTopmost: (isTopmost: boolean) => void;
  /** The surface's token, and its parent surface's; see ModalStackNodeContext. */
  node: ModalStackNode;
  parent: ModalStackNode | null;
  requestedZIndex?: number;
}

const openModals: ModalLevelEntry[] = [];

const entryOf = (node: ModalStackNode | null) =>
  node === null ? undefined : openModals.find((entry) => entry.node === node);

/** Whether `entry` renders inside the surface `node`, through open surfaces. */
function descendsFrom(entry: ModalLevelEntry, node: ModalStackNode): boolean {
  const seen = new Set<ModalLevelEntry>([entry]);
  for (let parent = entry.parent; parent !== null;) {
    if (parent === node) return true;
    const open = entryOf(parent);
    if (!open || seen.has(open)) return false;
    seen.add(open);
    parent = open.parent;
  }
  return false;
}

/**
 * One step above the surface below (or the band's base), raised by an
 * accepted override. Stacking and inertness therefore run on one order: a
 * surface opened later paints above an earlier one, whatever that one asked.
 */
function resolveZIndex(below: ModalLevelEntry | undefined, requested?: number): number {
  let override = requested;
  if (override != null && (override < band.base || override > band.max)) {
    devWarn(
      "Modal",
      `zIndex ${override} is outside the modal band (${band.base}..${band.max}); ` +
        "ignoring it. Change the band with configureModalZIndex instead.",
    );
    override = undefined;
  }
  const floor = below?.zIndex ?? band.base - band.step;
  return Math.min(Math.max(floor + band.step, override ?? 0), band.max);
}

/**
 * Marks an element that stays reachable while a modal is open: it, and the
 * ancestors it needs, are never made inert. `NotificationStack` sets it on
 * its root, so a notice raised over a modal can still be read and dismissed.
 * The mark is read when a modal opens or closes and on
 * `refreshModalBackground()`; call that after mounting a marked element while
 * a modal is open.
 */
export const MODAL_LIVE_ATTRIBUTE = "data-uic-modal-live";

/** The background elements this module made inert, and only those. */
const inertedBackground = new Set<Element>();

const NEVER_INERT = new Set(["SCRIPT", "STYLE", "LINK", "TEMPLATE", "NOSCRIPT"]);

/**
 * The elements to inert while `keep` stays reachable: every child of
 * `document.body` that holds none of them, and, inside a body child that
 * does, every sibling on the way down to them.
 */
function backgroundOf(keep: Element[]): Element[] {
  const kept = new Set(keep);
  const onPath = new Set<Element>();
  for (const el of keep) {
    for (let node = el.parentElement; node && node !== document.body;) {
      onPath.add(node);
      node = node.parentElement;
    }
  }
  const out: Element[] = [];
  const visit = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      if (kept.has(child) || NEVER_INERT.has(child.tagName)) continue;
      if (onPath.has(child)) visit(child);
      else out.push(child);
    }
  };
  visit(document.body);
  return out;
}

/**
 * While any modal is open the rest of the page is `inert`, which is what
 * `aria-modal` promises. Modal roots (a drawer's too, when it claims a level
 * through `useModalLevel`) and elements marked `MODAL_LIVE_ATTRIBUTE` are
 * spared. An `inert` the page set itself is left alone, before and after.
 */
function syncBackground(): void {
  if (typeof document === "undefined" || !document.body) return;
  const roots = openModals
    .map((entry) => entry.root)
    .filter((root): root is HTMLElement => root != null && root.isConnected);
  const target = new Set(
    openModals.length === 0
      ? []
      : backgroundOf([
          ...roots,
          ...Array.from(document.querySelectorAll(`[${MODAL_LIVE_ATTRIBUTE}]`)),
        ]),
  );
  for (const el of inertedBackground) {
    if (target.has(el)) continue;
    el.removeAttribute("inert");
    inertedBackground.delete(el);
  }
  for (const el of target) {
    if (inertedBackground.has(el) || el.hasAttribute("inert")) continue;
    el.setAttribute("inert", "");
    inertedBackground.add(el);
  }
}

/**
 * Re-reads which elements are marked `MODAL_LIVE_ATTRIBUTE` (and which modal
 * roots are in the document) while a modal is open. A no-op otherwise.
 */
export function refreshModalBackground(): void {
  if (openModals.length > 0 || inertedBackground.size > 0) syncBackground();
}

/**
 * Only the topmost surface stays interactive. A covered one drops its focus
 * trap and goes `inert`: the trap alone lets Tab escape to the parent, and
 * `inert` alone leaves the covered trap swallowing Tab with nothing to focus.
 */
function syncCovered(): void {
  syncBackground();
  openModals.forEach((entry, index) => {
    const isTopmost = index === openModals.length - 1;
    entry.root?.toggleAttribute("inert", !isTopmost);
    if (entry.isTopmost !== isTopmost) {
      entry.isTopmost = isTopmost;
      entry.setIsTopmost(isTopmost);
    }
  });
}

/** Writes an entry's level and z-index onto its root, for the stylesheet. */
function writeLevel(entry: ModalLevelEntry): void {
  entry.root?.style.setProperty(LEVEL_CSS_VAR, String(entry.level));
  entry.root?.style.setProperty(Z_INDEX_CSS_VAR, String(entry.zIndex));
}

/** Re-derives level and z-index from `index` up, after an insertion. */
function relayer(index: number): void {
  for (let i = index; i < openModals.length; i++) {
    const entry = openModals[i]!;
    const level = Math.min(i, MAX_MODAL_LEVEL);
    const zIndex = resolveZIndex(openModals[i - 1], entry.requestedZIndex);
    if (entry.level === level && entry.zIndex === zIndex) continue;
    entry.level = level;
    entry.zIndex = zIndex;
    writeLevel(entry);
  }
}

/**
 * Claims the next level: above every open surface, as the claim order is
 * the opening order. The one exception is a surface whose content already
 * holds an open surface of its own (`node` is an open entry's parent):
 * React runs a child's layout effect before its parent's, so when both open
 * in one commit, or an outer surface reopens over an inner one it kept
 * mounted, the inner one claims first. The outer one then goes in below its
 * descendants, and what sits above moves up a level.
 */
export function claimModalLevel(
  root: HTMLElement | null,
  setIsTopmost: (isTopmost: boolean) => void,
  requestedZIndex?: number,
  node: ModalStackNode = {},
  parent: ModalStackNode | null = null,
): ModalLevelEntry {
  registerInstance();
  const entry: ModalLevelEntry = {
    // Not yet laid out; relayer writes the real values.
    level: -1,
    zIndex: -1,
    isTopmost: true,
    root,
    setIsTopmost,
    node,
    parent,
    requestedZIndex,
  };
  const firstDescendant = openModals.findIndex((open) => descendsFrom(open, node));
  const index = firstDescendant === -1 ? openModals.length : firstDescendant;
  openModals.splice(index, 0, entry);
  relayer(index);
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
 * resolved z-index onto the root as `--modal-level` and `--modal-z`.
 * Returns whether this surface is the topmost one; gate a focus trap on it.
 */
export function useModalLevel(
  rootRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  zIndex?: number,
  node?: ModalStackNode,
): boolean {
  const [isTopmost, setIsTopmost] = useState(true);
  const [ownNode] = useState<ModalStackNode>(() => ({}));
  const parent = useContext(ModalStackNodeContext);
  // Read at claim time only: re-claiming would move an open surface to the
  // top of the stack and inert whatever legitimately covered it.
  const readZIndex = useEffectEvent(() => zIndex);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const root = rootRef.current;
    const entry = claimModalLevel(
      root,
      setIsTopmost,
      readZIndex(),
      node ?? ownNode,
      parent,
    );
    return () => {
      releaseModalLevel(entry);
      root?.style.removeProperty(LEVEL_CSS_VAR);
      root?.style.removeProperty(Z_INDEX_CSS_VAR);
    };
    // An effect event is not a dependency; this plugin version predates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rootRef, node, ownNode, parent]);

  return isTopmost;
}

/**
 * The token a surface hands `useModalLevel` and provides to its content
 * through `ModalStackNodeContext`, so a surface opened inside it stacks
 * above it however the two claim.
 */
export function useModalStackNode(): ModalStackNode {
  const [node] = useState<ModalStackNode>(() => ({}));
  return node;
}
