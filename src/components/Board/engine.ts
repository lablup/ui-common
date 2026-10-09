/**
 * The board's layout engine: what the rest of the board does while one item
 * moves, resizes or leaves.
 *
 * A move or resize is a path of one-cell steps. Each step places the active
 * item, then every item it now overlaps is moved out of the way: a search
 * over the four directions, scored so that a swap with the item the user is
 * pushing against is cheap, a move against the user's direction is dear, and
 * a move that overlaps something else costs more again. The best solution
 * wins; when none exists in time, overlaps are pushed straight down. Then
 * everything but the active item floats up to the first free row.
 *
 * An item the user's own move cannot settle (it reaches past the active
 * item in the direction of the move) is a conflict: nothing else moves, and
 * the step must not be committed.
 *
 * This follows the engine of `@cloudscape-design/board-components`
 * (Apache-2.0), reimplemented here, so a board that moved from it behaves
 * the same.
 */
import { compareLayoutItems, type GridLayout, type GridLayoutItem } from "./layout";

export interface Position {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Direction = "up" | "down" | "left" | "right";

type MoveType = "MOVE" | "OVERLAP" | "FLOAT" | "RESIZE" | "REMOVE";

export interface LayoutMove extends Rect {
  type: MoveType;
  itemId: string;
  direction: Direction;
  distanceX: number;
  distanceY: number;
  score: number;
}

export interface LayoutShift {
  current: GridLayout;
  /** The layout after the moves, in reading order. */
  next: GridLayout;
  moves: LayoutMove[];
  /** Ids of items the step could not settle; a shift with any must not commit. */
  conflicts: string[];
}

export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

const oppositeDirections = (d1: Direction, d2: Direction) =>
  (d1 === "down" && d2 === "up") ||
  (d1 === "up" && d2 === "down") ||
  (d1 === "left" && d2 === "right") ||
  (d1 === "right" && d2 === "left");

function createMove(
  type: MoveType,
  item: Rect & { id: string },
  next: Position,
  score = 0,
): LayoutMove {
  const distanceX = type === "RESIZE" ? next.x - item.width : next.x - item.x;
  const distanceY = type === "RESIZE" ? next.y - item.height : next.y - item.y;
  return {
    type,
    itemId: item.id,
    x: type !== "RESIZE" ? next.x : item.x,
    y: type !== "RESIZE" ? next.y : item.y,
    width: type === "RESIZE" ? next.x : item.width,
    height: type === "RESIZE" ? next.y : item.height,
    direction:
      distanceX > 0 ? "right" : distanceX < 0 ? "left" : distanceY < 0 ? "up" : "down",
    distanceX,
    distanceY,
    score,
  };
}

/** Inclusive edges of where a move started. */
const originalEdges = (move: LayoutMove) => ({
  left: move.x - move.distanceX,
  right: move.x - move.distanceX + move.width - 1,
  top: move.y - move.distanceY,
  bottom: move.y - move.distanceY + move.height - 1,
});

/** Inclusive edges of where a move ends. */
const edges = (move: LayoutMove) => ({
  left: move.x,
  right: move.x + move.width - 1,
  top: move.y,
  bottom: move.y + move.height - 1,
});

/** The items, mutable, with overlap lookups. */
class Grid {
  readonly items: GridLayoutItem[];
  constructor(
    items: ReadonlyArray<GridLayoutItem>,
    readonly columns: number,
  ) {
    this.items = items.map((item) => ({ ...item }));
  }
  clone(): Grid {
    return new Grid(this.items, this.columns);
  }
  get rows(): number {
    return this.items.reduce((max, item) => Math.max(max, item.y + item.height), 0);
  }
  getItem(id: string): GridLayoutItem {
    const item = this.items.find((it) => it.id === id);
    if (!item) throw new Error(`Board: no item "${id}" on the grid.`);
    return item;
  }
  getOverlaps(rect: Rect & { id: string }): GridLayoutItem[] {
    return this.items.filter((item) => item.id !== rect.id && intersects(item, rect));
  }
  move(id: string, x: number, y: number): void {
    const item = this.getItem(id);
    item.x = x;
    item.y = y;
  }
  resize(id: string, width: number, height: number): void {
    const item = this.getItem(id);
    item.width = width;
    item.height = height;
  }
  remove(id: string): void {
    const index = this.items.findIndex((it) => it.id === id);
    if (index !== -1) this.items.splice(index, 1);
  }
}

interface Conflicts {
  direction: Direction;
  items: Set<string>;
}

interface State {
  grid: Grid;
  moves: LayoutMove[];
  /** Index of the user's move in `moves`; what follows resolves it. */
  moveIndex: number;
  conflicts: Conflicts | null;
  /** Overlapping item id → the id of the move that made it overlap. */
  overlaps: Map<string, string>;
  score: number;
}

const newState = (
  grid: Grid,
  moves: LayoutMove[],
  conflicts: Conflicts | null,
): State => ({
  grid: grid.clone(),
  moves: [...moves],
  moveIndex: moves.length,
  conflicts,
  overlaps: new Map(),
  score: 0,
});

const cloneState = (state: State): State => ({
  grid: state.grid.clone(),
  moves: [...state.moves],
  moveIndex: state.moveIndex,
  conflicts: state.conflicts,
  overlaps: new Map(state.overlaps),
  score: state.score,
});

/** Bottom-most first: the order overlaps are resolved in. */
const bottomUp = (items: GridLayoutItem[]) =>
  items.sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y));

function applyMove(state: State, move: LayoutMove): void {
  const { grid } = state;
  switch (move.type) {
    case "MOVE":
    case "OVERLAP":
    case "FLOAT":
      grid.move(move.itemId, move.x, move.y);
      break;
    case "RESIZE":
      grid.resize(move.itemId, move.width, move.height);
      break;
    case "REMOVE":
      grid.remove(move.itemId);
      break;
  }
  if (move.type !== "REMOVE") {
    for (const overlap of grid.getOverlaps({ ...move, id: move.itemId })) {
      if (!state.conflicts?.items.has(overlap.id))
        state.overlaps.set(overlap.id, move.itemId);
    }
  }
  for (const [overlapId, issuerId] of state.overlaps) {
    const a = grid.items.find((it) => it.id === overlapId);
    const b = grid.items.find((it) => it.id === issuerId);
    if (!a || !b || !intersects(a, b)) state.overlaps.delete(overlapId);
  }
  state.moves.push(move);
  state.score += move.score;
}

function findConflicts(
  grid: Grid,
  previous: Conflicts | null,
  userMove: LayoutMove,
): Conflicts | null {
  if (userMove.type !== "MOVE") return null;
  const direction = previous?.direction ?? userMove.direction;
  const overlaps = grid.getOverlaps({ ...userMove, id: userMove.itemId });
  const conflicts = overlaps.filter((overlap) => {
    switch (direction) {
      case "left":
        return overlap.x < userMove.x;
      case "right":
        return overlap.x + overlap.width - 1 > userMove.x + userMove.width - 1;
      case "up":
        return overlap.y < userMove.y;
      case "down":
        return overlap.y + overlap.height - 1 > userMove.y + userMove.height - 1;
    }
  });
  return conflicts.length > 0
    ? { direction, items: new Set(conflicts.map((it) => it.id)) }
    : null;
}

const PRIORITY_DIRECTIONS: Direction[] = ["down", "right", "left", "up"];
const MAX_SOLUTION_DEPTH = 100;
const NUM_BEST_SOLUTIONS = 5;

function lastMoveOf(state: State, itemId: string): LayoutMove | null {
  for (let i = state.moves.length - 1; i >= state.moveIndex; i--) {
    const move = state.moves[i];
    if (move && move.itemId === itemId) return move;
  }
  return null;
}

function moveForDirection(
  target: GridLayoutItem,
  overlap: GridLayoutItem,
  direction: Direction,
): LayoutMove {
  switch (direction) {
    case "up":
      return createMove("OVERLAP", target, {
        x: target.x,
        y: overlap.y - target.height,
      });
    case "down":
      return createMove("OVERLAP", target, {
        x: target.x,
        y: overlap.y + overlap.height,
      });
    case "left":
      return createMove("OVERLAP", target, {
        x: overlap.x - target.width,
        y: target.y,
      });
    case "right":
      return createMove("OVERLAP", target, {
        x: overlap.x + overlap.width,
        y: target.y,
      });
  }
}

/** Everything the move sweeps over on its way, except the item that caused it. */
function pathOverlaps(
  state: State,
  move: LayoutMove,
  issuer: GridLayoutItem,
): Set<GridLayoutItem> {
  const { left, right, top, bottom } = originalEdges(move);
  const startX = move.distanceX <= 0 ? move.x : right + 1;
  const endX = move.distanceX < 0 ? left - 1 : right + move.distanceX;
  const startY = move.distanceY <= 0 ? move.y : bottom + 1;
  const endY = move.distanceY < 0 ? top - 1 : bottom + move.distanceY;
  const found = new Set(
    state.grid.getOverlaps({
      id: move.itemId,
      x: startX,
      width: 1 + endX - startX,
      y: startY,
      height: 1 + endY - startY,
    }),
  );
  found.delete(issuer);
  return found;
}

function isSwap(overlapMove: LayoutMove, issuerMove: LayoutMove): boolean {
  if (issuerMove.type !== "MOVE") return false;
  if (!oppositeDirections(overlapMove.direction, issuerMove.direction)) return false;
  const overlapRect = originalEdges(overlapMove);
  const issuerRect = edges(issuerMove);
  switch (issuerMove.direction) {
    case "up":
      return overlapRect.top === issuerRect.top;
    case "right":
      return overlapRect.right === issuerRect.right;
    case "down":
      return overlapRect.bottom === issuerRect.bottom;
    case "left":
      return overlapRect.left === issuerRect.left;
  }
}

function solutionVector(state: State): Position {
  const vector = { x: 0, y: 0 };
  for (let i = state.moveIndex; i < state.moves.length; i++) {
    const move = state.moves[i];
    if (move?.type === "OVERLAP") {
      vector.x += move.distanceX * move.height;
      vector.y += move.distanceY * move.width;
    }
  }
  return vector;
}

/** The area the user's own move spans, from where it started to where it is. */
function userMoveBounds(state: State) {
  const last = state.moves[state.moveIndex];
  if (!last) throw new Error("Board: no user move to bound.");
  const original = originalEdges(last);
  const current = edges(last);
  return {
    top: Math.min(original.top, current.top),
    right: Math.max(original.right, current.right),
    bottom: Math.max(original.bottom, current.bottom),
    left: Math.min(original.left, current.left),
  };
}

function overlapMove(
  state: State,
  overlapId: string,
  issuerId: string,
  direction: Direction,
): LayoutMove | null {
  const first = state.moves[0];
  if (!first) throw new Error("Board: no user move.");
  const userItem = state.grid.getItem(first.itemId);
  const overlapItem = state.grid.getItem(overlapId);
  const issuerItem = state.grid.getItem(issuerId);
  const move = moveForDirection(overlapItem, issuerItem, direction);
  if (move.x < 0 || move.y < 0 || move.x + move.width > state.grid.columns) return null;

  const previous = lastMoveOf(state, overlapItem.id);
  if (previous && oppositeDirections(previous.direction, direction)) return null;

  const swept = pathOverlaps(state, move, issuerItem);
  for (const item of swept) {
    if (item.id === userItem.id) return null;
    if (state.conflicts?.items.has(item.id)) return null;
    if (state.overlaps.has(item.id)) return null;
  }

  const issuerMove = lastMoveOf(state, issuerItem.id);
  if (!issuerMove) throw new Error("Board: an overlap's issuer has no move.");
  const swap = isSwap(move, issuerMove);
  const differentDirection = direction !== issuerMove.direction;
  const oppositeDirection = oppositeDirections(direction, issuerMove.direction);
  const bounds = userMoveBounds(state);
  const vector = solutionVector(state);

  const swapScore =
    (swap ? 0 : 20) +
    (!swap && differentDirection ? 10 : 0) +
    (!swap && oppositeDirection ? 500 : 0);
  const overlapsScore = swept.size * 50;
  const boundsScore =
    (overlapItem.y + overlapItem.height - 1 < bounds.top ? 500 : 0) +
    (overlapItem.x + overlapItem.width - 1 < bounds.left ? 50 : 0) +
    (overlapItem.x > bounds.right ? 50 : 0);
  const vectorScore =
    (move.distanceX * vector.x < 0 ? vector.x * 2 : 0) +
    (move.distanceY * vector.y < 0 ? vector.y * 2 : 0);
  return { ...move, score: 1 + swapScore + overlapsScore + vectorScore + boundsScore };
}

function nextSolutions(state: State): Array<[State, LayoutMove]> {
  const solutions: Array<[State, LayoutMove]> = [];
  for (const [overlapId, issuerId] of state.overlaps) {
    for (const direction of PRIORITY_DIRECTIONS) {
      const move = overlapMove(state, overlapId, issuerId, direction);
      if (move) solutions.push([cloneState(state), move]);
    }
  }
  return solutions;
}

function pushOverlapsDown(state: State): State {
  while (state.overlaps.size > 0) {
    const overlaps = bottomUp(
      [...state.overlaps.keys()].map((id) => state.grid.getItem(id)),
    );
    for (const overlap of overlaps) {
      let y = overlap.y + 1;
      while (state.grid.getOverlaps({ ...overlap, y }).length > 0) y++;
      applyMove(state, createMove("OVERLAP", overlap, { x: overlap.x, y }));
    }
  }
  return state;
}

function refloat(from: State, userMove: LayoutMove | null): State {
  const state = newState(from.grid, from.moves, from.conflicts);
  const pass = (): boolean => {
    let again = false;
    for (const item of state.grid.items) {
      if (item.id === userMove?.itemId) continue;
      let move: LayoutMove | null = null;
      for (let y = item.y - 1; y >= 0; y--) {
        const attempt = createMove("FLOAT", item, { x: item.x, y });
        if (state.grid.getOverlaps({ ...attempt, id: item.id }).length > 0) break;
        move = attempt;
      }
      if (move) {
        applyMove(state, move);
        again = true;
      }
    }
    return again;
  };
  while (pass()) {
    /* until nothing floats */
  }
  return state;
}

/** One step: the user's move applied and every overlap it causes resolved. */
function resolveOverlaps(from: State, userMove: LayoutMove): State {
  const conflicts = findConflicts(from.grid, from.conflicts, userMove);
  const initial = newState(from.grid, from.moves, conflicts);
  const seen = new Set<string>();
  const keyOf = ([state, move]: [State, LayoutMove]) =>
    `${move.itemId} ${move.x}:${move.y}:${state.score + move.score}`;

  let solutions: Array<[State, LayoutMove]> = [[initial, userMove]];
  let best: State | null = null;
  let depth = MAX_SOLUTION_DEPTH;
  while (solutions.length > 0) {
    const next: Array<[State, LayoutMove]> = [];
    for (let i = 0; i < Math.min(NUM_BEST_SOLUTIONS, solutions.length); i++) {
      const solution = solutions[i];
      if (!solution) break;
      const [state, move] = solution;
      if (best && state.score + move.score >= best.score) continue;
      applyMove(state, move);
      if (state.overlaps.size === 0) {
        best = state;
      } else {
        for (const solution of nextSolutions(state)) {
          const key = keyOf(solution);
          if (!seen.has(key)) {
            seen.add(key);
            next.push(solution);
          }
        }
      }
    }
    solutions = next.sort(
      (a, b) => a[0].score + a[1].score - (b[0].score + b[1].score),
    );
    depth -= 1;
    if (depth <= 0) break;
  }
  if (!best) {
    // The search found nothing: the initial state still needs the user move
    // applied before its overlaps can be pushed down.
    if (initial.moves.length === initial.moveIndex) applyMove(initial, userMove);
    best = initial.conflicts ? initial : pushOverlapsDown(initial);
  }
  return best.conflicts ? best : refloat(best, userMove);
}

/** `path` without a leading return to `origin`, as single-cell steps. */
function normalizeSteps(origin: Position, path: ReadonlyArray<Position>): Position[] {
  const steps: Position[] = [];
  let prevX = origin.x;
  let prevY = origin.y;
  for (const step of path) {
    const vx = Math.sign(step.x - prevX);
    const vy = Math.sign(step.y - prevY);
    for (let x = prevX, y = prevY; x !== step.x || y !== step.y;) {
      if (x !== step.x) x += vx;
      else y += vy;
      steps.push({ x, y });
    }
    prevX = step.x;
    prevY = step.y;
  }
  return steps;
}

function dropLeadingOrigin(
  origin: Position,
  path: ReadonlyArray<Position>,
): Position[] {
  let last = -1;
  path.forEach((p, i) => {
    if (p.x === origin.x && p.y === origin.y) last = i;
  });
  return path.slice(last + 1);
}

/** A move path with its loops cut out: only the last visit to a cell counts. */
export function normalizeMovePath(
  origin: Position,
  path: ReadonlyArray<Position>,
): Position[] {
  const trimmed = dropLeadingOrigin(origin, path);
  const lastIndexOf = new Map<string, number>();
  trimmed.forEach((p, i) => lastIndexOf.set(`${p.x}:${p.y}`, i));
  const direct: Position[] = [];
  for (let i = 0; i < trimmed.length;) {
    const at = trimmed[i];
    if (!at) break;
    const last = lastIndexOf.get(`${at.x}:${at.y}`) ?? i;
    const visit = trimmed[last];
    if (visit) direct.push(visit);
    i = last + 1;
  }
  return normalizeSteps(origin, direct);
}

/** A resize path reduced to the shrink steps that matter and the final size. */
export function normalizeResizePath(
  origin: Position,
  path: ReadonlyArray<Position>,
): Position[] {
  const trimmed = dropLeadingOrigin(origin, path);
  const final = trimmed[trimmed.length - 1];
  if (!final) return [];
  const kept: Position[] = [final];
  for (let i = trimmed.length - 2; i >= 0; i--) {
    const prev = kept[kept.length - 1];
    const current = trimmed[i];
    if (prev && current && (current.x < prev.x || current.y < prev.y))
      kept.push(current);
  }
  kept.reverse();
  return normalizeSteps(origin, kept);
}

/** Appends single-cell steps from the path's end to `next`. */
export function appendPath(path: ReadonlyArray<Position>, next: Position): Position[] {
  const last = path[path.length - 1];
  if (!last) return [next];
  return [...path, ...normalizeSteps(last, [next])];
}

/**
 * Computes layout shifts for one operation. Keep one instance for the whole
 * operation: each step is resolved once and reused while the path's prefix
 * stays the same.
 */
export class LayoutEngine {
  private readonly initial: State;
  private cachedSteps: Position[] = [];
  private cachedStates: State[] = [];

  constructor(readonly layout: GridLayout) {
    this.initial = newState(new Grid(layout.items, layout.columns), [], null);
  }

  move(itemId: string, path: ReadonlyArray<Position>): LayoutShift {
    const item = this.initial.grid.getItem(itemId);
    for (const step of path) {
      if (step.x < 0 || step.y < 0 || step.x + item.width > this.initial.grid.columns) {
        throw new RangeError("Board: move outside the grid.");
      }
    }
    const steps = normalizeMovePath({ x: item.x, y: item.y }, path);
    return this.shift(
      this.run(steps, (state, step) =>
        resolveOverlaps(state, createMove("MOVE", state.grid.getItem(itemId), step)),
      ),
    );
  }

  resize(itemId: string, path: ReadonlyArray<Position>): LayoutShift {
    const item = this.initial.grid.getItem(itemId);
    for (const step of path) {
      if (step.x < 1 || step.y < 1) throw new RangeError("Board: resize to nothing.");
      if (step.x > this.initial.grid.columns)
        throw new RangeError("Board: resize outside the grid.");
    }
    const steps = normalizeResizePath(
      { x: item.x + item.width, y: item.y + item.height },
      path,
    );
    return this.shift(
      this.run(steps, (state, step) => {
        const target = state.grid.getItem(itemId);
        return resolveOverlaps(
          state,
          createMove("RESIZE", target, { x: step.x - target.x, y: step.y - target.y }),
        );
      }),
    );
  }

  remove(itemId: string): LayoutShift {
    const item = this.initial.grid.getItem(itemId);
    const move = createMove("REMOVE", item, { x: item.x, y: item.y });
    return this.shift(resolveOverlaps(this.initial, move));
  }

  private run(steps: Position[], step: (state: State, at: Position) => State): State {
    let reuse = 0;
    while (reuse < steps.length && reuse < this.cachedSteps.length) {
      const cached = this.cachedSteps[reuse];
      const wanted = steps[reuse];
      if (!cached || !wanted || cached.x !== wanted.x || cached.y !== wanted.y) break;
      reuse++;
    }
    this.cachedSteps = this.cachedSteps.slice(0, reuse);
    this.cachedStates = this.cachedStates.slice(0, reuse);
    let state = this.cachedStates[reuse - 1] ?? this.initial;
    for (const at of steps.slice(reuse)) {
      state = step(state, at);
      this.cachedSteps.push(at);
      this.cachedStates.push(state);
    }
    return state;
  }

  private shift(state: State): LayoutShift {
    const items = state.grid.items
      .map((item) => ({ ...item }))
      .sort(compareLayoutItems);
    return {
      current: this.layout,
      next: { items, columns: state.grid.columns, rows: state.grid.rows },
      moves: state.moves,
      conflicts: state.conflicts ? [...state.conflicts.items] : [],
    };
  }
}

/** The layout with `itemId` moved to `(x, y)` in one straight path. */
export function moveItem(
  layout: GridLayout,
  itemId: string,
  x: number,
  y: number,
): GridLayout {
  return new LayoutEngine(layout).move(itemId, [{ x, y }]).next;
}

/** The layout with `itemId` spanning `width` x `height`. */
export function resizeItem(
  layout: GridLayout,
  itemId: string,
  width: number,
  height: number,
): GridLayout {
  const item = layout.items.find((it) => it.id === itemId);
  if (!item) return layout;
  return new LayoutEngine(layout).resize(itemId, [
    { x: item.x + width, y: item.y + height },
  ]).next;
}

/** The layout without `itemId`, the rest floated up into its place. */
export function removeItem(layout: GridLayout, itemId: string): GridLayout {
  return new LayoutEngine(layout).remove(itemId).next;
}
