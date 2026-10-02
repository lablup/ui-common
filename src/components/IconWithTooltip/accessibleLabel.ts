/**
 * Flattens a `ReactNode` into plain text for an accessible name: string and
 * number leaves, through fragments, arrays and elements' children, joined by
 * a space. A node with no text (an icon alone) yields `""`. Text carried in
 * props rather than children is invisible to the walk.
 *
 * Internal: not exported from the package.
 */
import { isValidElement, type ReactNode } from "react";

const MAX_DEPTH = 6;

function walk(node: ReactNode, depth: number, out: string[]): void {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (typeof node === "string") {
    if (node.trim() !== "") out.push(node);
    return;
  }
  if (typeof node === "number") {
    out.push(String(node));
    return;
  }
  if (depth >= MAX_DEPTH) return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child as ReactNode, depth + 1, out);
    return;
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode } | undefined;
    walk(props?.children, depth + 1, out);
  }
}

export function nodeToAccessibleLabel(node: ReactNode): string {
  const out: string[] = [];
  walk(node, 0, out);
  return out.join(" ").replace(/\s+/g, " ").trim();
}
