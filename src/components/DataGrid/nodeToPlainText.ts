import { isValidElement, type ReactNode } from "react";

/**
 * The text of a node: strings and numbers, through elements, fragments and
 * arrays. A textless node (an icon) gives "".
 */
export function nodeToPlainText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToPlainText).join("");
  if (isValidElement(node)) {
    return nodeToPlainText((node.props as { children?: ReactNode }).children);
  }
  return "";
}
