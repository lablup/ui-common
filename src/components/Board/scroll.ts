/**
 * Scrolling during a pointer drag on the board.
 *
 * The pointer is read in viewport coordinates, so when an ancestor scrolls
 * mid-drag the grid moves under a pointer that did not: the drag delta has
 * to add how far the grid's origin travelled since the drag started. And the
 * board is often taller than its scroll container, so a drag near that
 * container's edge scrolls it, at a speed that grows with how close to the
 * edge the pointer is.
 */

/** How close to a scroll container's edge, in px, a drag starts scrolling it. */
export const AUTO_SCROLL_EDGE_PX = 48;
/** The most a frame scrolls, in px, right at the edge. */
export const AUTO_SCROLL_MAX_STEP_PX = 16;

export interface Point {
  x: number;
  y: number;
}

/** The pointer's travel since the drag started, with the grid's own travel added back. */
export function compensateForScroll(
  pointer: Point,
  startPointer: Point,
  startGridOrigin: Point,
  gridOrigin: Point,
): Point {
  return {
    x: pointer.x - startPointer.x + (startGridOrigin.x - gridOrigin.x),
    y: pointer.y - startPointer.y + (startGridOrigin.y - gridOrigin.y),
  };
}

const SCROLLS = /^(auto|scroll)/;

/**
 * The nearest ancestor that scrolls (computed `overflow-x` or `overflow-y`
 * `auto` or `scroll`), else the document's scrolling element.
 */
export function findScrollParent(element: Element): Element {
  let node = element.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if (SCROLLS.test(style.overflowY) || SCROLLS.test(style.overflowX)) return node;
    node = node.parentElement;
  }
  return document.scrollingElement ?? document.documentElement;
}

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The visible box of a scroll container; the viewport for the document's. */
export function scrollBounds(container: Element): Bounds {
  if (container === (document.scrollingElement ?? document.documentElement)) {
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
  }
  const rect = container.getBoundingClientRect();
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

/**
 * How far to scroll this frame: nothing while the pointer is inside the
 * edge band, up to `maxStep` at the edge, in the direction of the edge.
 */
export function autoScrollStep(
  pointer: Point,
  bounds: Bounds,
  edge = AUTO_SCROLL_EDGE_PX,
  maxStep = AUTO_SCROLL_MAX_STEP_PX,
): Point {
  const toward = (distance: number) =>
    distance >= edge || edge <= 0
      ? 0
      : Math.ceil(((edge - Math.max(distance, 0)) / edge) * maxStep);
  const x = toward(pointer.x - bounds.left)
    ? -toward(pointer.x - bounds.left)
    : toward(bounds.right - pointer.x);
  const y = toward(pointer.y - bounds.top)
    ? -toward(pointer.y - bounds.top)
    : toward(bounds.bottom - pointer.y);
  return { x, y };
}
