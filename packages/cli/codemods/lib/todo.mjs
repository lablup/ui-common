/**
 * Leave `TODO(ui-common-upgrade)` markers where a codemod could not prove a
 * rewrite safe. Where the marker goes:
 * - a JSX child gets a `{/* … *\/}` line right above it;
 * - an element that is a `return` value or a parenthesised expression gets a
 *   `//` line right above it, inside the parentheses;
 * - anything else gets a `//` line above its statement.
 * A marker already there (from an earlier run) is not added twice.
 * `ui-common upgrade` lists every marker in its report, with its line.
 */
import { TODO_TAG } from "./jsx.mjs";

/** @param {any} node */
function isStatement(node) {
  return (
    node &&
    typeof node.type === "string" &&
    /(Statement|Declaration)$/.test(node.type) &&
    !node.type.startsWith("TS")
  );
}

/** @param {any[] | undefined} comments @param {string} text */
function hasComment(comments, text) {
  return (comments ?? []).some((c) => String(c.value).trim() === text);
}

/** @param {any} node @param {string} text */
function carries(node, text) {
  return (
    hasComment(node?.comments, text) ||
    hasComment(node?.innerComments, text) ||
    hasComment(node?.leadingComments, text)
  );
}

/**
 * @param {any} j jscodeshift
 * @param {any} path NodePath of the node the message is about
 * @param {string} message
 */
export function addTodo(j, path, message) {
  const text = `${TODO_TAG}: ${message}`;
  const node = path.node;
  const parent = path.parent?.node;
  const isElement = node.type === "JSXElement" || node.type === "JSXFragment";

  if (
    isElement &&
    parent &&
    (parent.type === "JSXElement" || parent.type === "JSXFragment") &&
    Array.isArray(parent.children)
  ) {
    const index = parent.children.indexOf(node);
    if (index === -1) return;
    // Walk back over whitespace and earlier markers looking for this one.
    for (let i = index - 1; i >= 0; i--) {
      const sibling = parent.children[i];
      if (sibling.type === "JSXText" && sibling.value.trim() === "") continue;
      if (
        sibling.type === "JSXExpressionContainer" &&
        sibling.expression.type === "JSXEmptyExpression"
      ) {
        if (carries(sibling.expression, text)) return;
        continue;
      }
      break;
    }
    const previous = parent.children[index - 1];
    let whitespace = " ";
    if (
      previous?.type === "JSXText" &&
      previous.value.trim() === "" &&
      previous.value.includes("\n")
    ) {
      whitespace = previous.value.slice(previous.value.lastIndexOf("\n"));
    }
    const empty = j.jsxEmptyExpression();
    empty.comments = [j.commentBlock(` ${text} `, false, true)];
    parent.children.splice(
      index,
      0,
      j.jsxExpressionContainer(empty),
      j.jsxText(whitespace),
    );
    return;
  }

  if (isElement && (parent?.type === "ReturnStatement" || node.extra?.parenthesized)) {
    if (carries(node, text)) return;
    node.comments = [...(node.comments ?? []), j.commentLine(` ${text}`, true, false)];
    return;
  }

  let p = path;
  while (p && !isStatement(p.node)) p = p.parent;
  if (!p) return;
  // An exported declaration carries the comment on the export, so it prints
  // above `export`, not between `export` and the declaration.
  if (p.parent && /^Export(Named|Default)Declaration$/.test(p.parent.node.type))
    p = p.parent;
  if (carries(p.node, text)) return;
  p.node.comments = [
    ...(p.node.comments ?? []),
    j.commentLine(` ${text}`, true, false),
  ];
}
