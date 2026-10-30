/**
 * What a Board item tells the content of its `description`: that it is in an
 * item, and where a `BoardItemTitle` in it can put itself when the item has
 * no `title` of its own.
 */
import { createContext, useContext } from "react";

export interface BoardItemContextValue {
  /**
   * Puts a title in the item's header row, or queues it behind the one
   * already there; returns what takes it back out. Null when the item has a
   * `title` of its own: the header is the title's.
   */
  claimHeader: ((id: string) => () => void) | null;
  /** The id of the title the header row shows, if any. */
  headerOwner: string | null;
  /** The header row's title slot, once it has mounted. */
  headerSlot: HTMLElement | null;
}

export const BoardItemContext = createContext<BoardItemContextValue | null>(null);

/** True inside a `Board` item's `description`, false anywhere else. */
export function useIsInBoardItem(): boolean {
  return useContext(BoardItemContext) !== null;
}
