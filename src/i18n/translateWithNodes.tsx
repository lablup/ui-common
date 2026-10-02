/**
 * Formats a catalog message whose placeholders take React nodes, such as a
 * `Token` inside a sentence. Internal: not exported from the package.
 *
 * A message never carries markup (CONTRIBUTING, "Strings"), so a styled part
 * of a sentence is a placeholder the component fills with a node. Each node
 * value is formatted as a marker, and the formatted text is split on the
 * markers, so translators still own the word order around the node.
 */
import { Fragment, type ReactNode } from "react";

import type { UicTranslate } from "./useUicTranslator";

// U+2063 INVISIBLE SEPARATOR: no translation contains it, and ICU leaves it
// alone.
const MARK = "⁣";

export function translateWithNodes(
  t: UicTranslate,
  key: string,
  values: Record<string, ReactNode>,
): ReactNode {
  const nodes: ReactNode[] = [];
  const formatted: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(values)) {
    if (typeof value === "string" || typeof value === "number") {
      formatted[name] = value;
    } else {
      formatted[name] = `${MARK}${nodes.length}${MARK}`;
      nodes.push(value);
    }
  }
  const text = t(key, formatted);
  if (nodes.length === 0) return text;
  // Split on the marker: even parts are text, odd parts are node indexes.
  return text
    .split(MARK)
    .map((part, index) =>
      index % 2 === 1 ? <Fragment key={index}>{nodes[Number(part)]}</Fragment> : part,
    );
}
