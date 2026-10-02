/**
 * Leave `TODO(ui-common-upgrade)` markers where a codemod could not prove a
 * rewrite safe. Where the marker goes:
 * - a JSX child gets a `{/* … *\/}` line right above it, or right before it
 *   when it shares its line with other children;
 * - an element that is a `return` value or a parenthesised expression gets a
 *   `//` line right above it, inside the parentheses;
 * - anything else gets a `//` line above its statement.
 * A marker already there (from an earlier run) is not added twice.
 * `ui-common upgrade` lists every marker in its report, with its line.
 *
 * A file whose transform calls `addTodo` is printed with `printSource`: the
 * JSX-child markers are written into the printed text, not into the parent's
 * `children`. Adding a child makes recast reprint the parent, and recast's
 * reprint drops the leading whitespace of every text child
 * (`{n} items` -> `{n}items`).
 */
import { TODO_TAG } from "./jsx.mjs";

/** The markers waiting on a JSX child, written by `printSource`. */
const PENDING = Symbol("ui-common-upgrade.todo");
const SENTINEL = "__ui_common_upgrade_todo_";

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
    const pending = (node[PENDING] ??= []);
    if (!pending.includes(text)) pending.push(text);
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

/**
 * `root.toSource(options)`, with the JSX-child markers `addTodo` left
 * pending written in. Each marked element carries a sentinel block comment
 * while it prints: a comment changes the element alone, so recast reprints
 * neither the parent nor its text. The sentinel then becomes the marker:
 * a `{/* … *\/}` line above an element that starts its line, or a
 * `{/* … *\/}` right before one that follows other children on its line,
 * with no whitespace added (the text renders as it did).
 *
 * @param {any} j jscodeshift
 * @param {any} root the file's Collection
 * @param {object} [options] recast print options
 * @returns {string}
 */
export function printSource(j, root, options) {
  /** @type {Map<string, string[]>} */
  const markers = new Map();
  for (const type of [j.JSXElement, j.JSXFragment]) {
    root.find(type).forEach((/** @type {any} */ path) => {
      const texts = path.node[PENDING];
      if (!texts?.length) return;
      const id = `${SENTINEL}${markers.size}__`;
      markers.set(id, texts);
      path.node.comments = [
        ...(path.node.comments ?? []),
        j.commentBlock(id, true, false),
      ];
    });
  }
  let out = root.toSource(options);
  for (const [id, texts] of markers) {
    const comment = `/*${id}*/`;
    const at = out.indexOf(comment);
    if (at === -1) throw new Error(`ui-common upgrade: lost the TODO marker ${id}`);
    // Recast breaks the line after a leading comment; the element follows.
    const after = at + comment.length;
    const gap = /^\s*/.exec(out.slice(after))?.[0] ?? "";
    const lineStart = out.lastIndexOf("\n", at - 1) + 1;
    const indent = out.slice(lineStart, at);
    const blocks = texts.map((text) => `{/* ${text} */}`);
    const insert = /^[ \t]*$/.test(indent)
      ? blocks.map((b) => `${b}\n${indent}`).join("")
      : blocks.join("");
    out = out.slice(0, at) + insert + out.slice(after + gap.length);
  }
  return out;
}
