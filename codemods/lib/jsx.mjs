/**
 * Small JSX helpers shared by the codemods. Everything works on babel-style
 * AST nodes as jscodeshift's `tsx` and `babel` parsers produce them.
 */

export const TODO_TAG = "TODO(ui-common-upgrade)";

/** @param {any} el JSXElement */
export function attributes(el) {
  return el.openingElement.attributes ?? [];
}

/**
 * @param {any} el JSXElement
 * @param {string} name
 */
export function getAttr(el, name) {
  return (
    attributes(el).find(
      (/** @type {any} */ a) =>
        a.type === "JSXAttribute" &&
        a.name?.type === "JSXIdentifier" &&
        a.name.name === name,
    ) ?? null
  );
}

/** @param {any} el */
export function hasSpread(el) {
  return attributes(el).some((/** @type {any} */ a) => a.type === "JSXSpreadAttribute");
}

/**
 * @param {any} el
 * @param {any} attr
 */
export function removeAttr(el, attr) {
  el.openingElement.attributes = attributes(el).filter(
    (/** @type {any} */ a) => a !== attr,
  );
}

/**
 * The static value of an attribute, when it has one.
 *
 * @param {any} attr JSXAttribute
 * @returns {{kind: 'string', value: string} | {kind: 'boolean', value: boolean} | {kind: 'number', value: number} | {kind: 'null'} | {kind: 'expression', expression: any}}
 */
export function attrValue(attr) {
  const value = attr.value;
  if (value == null) return { kind: "boolean", value: true };
  if (
    value.type === "StringLiteral" ||
    (value.type === "Literal" && typeof value.value === "string")
  ) {
    return { kind: "string", value: value.value };
  }
  if (value.type === "JSXExpressionContainer") {
    return expressionValue(value.expression);
  }
  return { kind: "expression", expression: value };
}

/**
 * @param {any} expression
 * @returns {ReturnType<typeof attrValue>}
 */
export function expressionValue(expression) {
  switch (expression?.type) {
    case "StringLiteral":
      return { kind: "string", value: expression.value };
    case "BooleanLiteral":
      return { kind: "boolean", value: expression.value };
    case "NumericLiteral":
      return { kind: "number", value: expression.value };
    case "NullLiteral":
      return { kind: "null" };
    case "Literal":
      if (expression.value === null) return { kind: "null" };
      if (typeof expression.value === "string")
        return { kind: "string", value: expression.value };
      if (typeof expression.value === "boolean")
        return { kind: "boolean", value: expression.value };
      if (typeof expression.value === "number")
        return { kind: "number", value: expression.value };
      return { kind: "expression", expression };
    case "TemplateLiteral":
      if (expression.expressions.length === 0) {
        return { kind: "string", value: expression.quasis[0]?.value.cooked ?? "" };
      }
      return { kind: "expression", expression };
    default:
      return { kind: "expression", expression };
  }
}

/**
 * The expression an attribute carries, for moving it somewhere else.
 *
 * @param {any} j
 * @param {any} attr
 */
export function attrExpression(j, attr) {
  const value = attr.value;
  if (value == null) return j.booleanLiteral(true);
  if (value.type === "JSXExpressionContainer") return value.expression;
  return value;
}

/**
 * Build an attribute. Strings become `name="value"`, `true` becomes the bare
 * `name`, anything else `name={expression}`.
 *
 * @param {any} j
 * @param {string} name
 * @param {string|number|boolean|any} value
 */
export function makeAttr(j, name, value) {
  if (value === true) return j.jsxAttribute(j.jsxIdentifier(name), null);
  if (typeof value === "string")
    return j.jsxAttribute(j.jsxIdentifier(name), j.stringLiteral(value));
  if (typeof value === "number") {
    return j.jsxAttribute(
      j.jsxIdentifier(name),
      j.jsxExpressionContainer(j.numericLiteral(value)),
    );
  }
  if (value?.type === "StringLiteral")
    return j.jsxAttribute(j.jsxIdentifier(name), value);
  return j.jsxAttribute(j.jsxIdentifier(name), j.jsxExpressionContainer(value));
}

/**
 * Replace `attr` in place with a new attribute, keeping its position.
 *
 * @param {any} el
 * @param {any} attr
 * @param {any} replacement
 */
export function replaceAttr(el, attr, replacement) {
  el.openingElement.attributes = attributes(el).map((/** @type {any} */ a) =>
    a === attr ? replacement : a,
  );
}

/**
 * Rename an attribute, keeping its value.
 *
 * @param {any} attr
 * @param {string} name
 */
export function renameAttr(attr, name) {
  attr.name = { type: "JSXIdentifier", name };
}

/**
 * Set (or add) an attribute.
 *
 * @param {any} j
 * @param {any} el
 * @param {string} name
 * @param {any} value
 */
export function setAttr(j, el, name, value) {
  const existing = getAttr(el, name);
  const next = makeAttr(j, name, value);
  if (existing) replaceAttr(el, existing, next);
  else el.openingElement.attributes = [...attributes(el), next];
}

/** Children that are not layout whitespace. @param {any} el */
export function meaningfulChildren(el) {
  return (el.children ?? []).filter(
    (/** @type {any} */ c) =>
      !(c.type === "JSXText" && c.value.trim() === "") &&
      !(
        c.type === "JSXExpressionContainer" &&
        c.expression.type === "JSXEmptyExpression"
      ),
  );
}

/** Turn `<X ...>children</X>` into `<X ... />`. @param {any} el */
export function makeSelfClosing(el) {
  el.openingElement.selfClosing = true;
  el.closingElement = null;
  el.children = [];
}

/** Whitespace-collapsed JSX text, as React renders it. @param {string} text */
export function jsxTextValue(text) {
  return text
    .split("\n")
    .map((line, i, all) => {
      let l = line;
      if (i > 0) l = l.replace(/^\s+/, "");
      if (i < all.length - 1) l = l.replace(/\s+$/, "");
      return l;
    })
    .filter((l) => l !== "")
    .join(" ");
}

/**
 * Whether an expression certainly evaluates to a string: a literal, a
 * template, or a call to a translation function.
 *
 * @param {any} expression
 */
export function isStringish(expression) {
  if (!expression) return false;
  if (expression.type === "StringLiteral" || expression.type === "TemplateLiteral")
    return true;
  if (expression.type === "Literal" && typeof expression.value === "string")
    return true;
  if (expression.type === "CallExpression") {
    const callee = expression.callee;
    const name =
      callee.type === "Identifier"
        ? callee.name
        : callee.type === "MemberExpression" && callee.property.type === "Identifier"
          ? callee.property.name
          : null;
    return name === "t" || name === "formatMessage" || name === "translate";
  }
  return false;
}

/** Side-effect-free, cheap to evaluate twice. @param {any} expression */
export function isSimpleReference(expression) {
  if (!expression) return false;
  if (expression.type === "Identifier") return true;
  if (
    expression.type === "MemberExpression" ||
    expression.type === "OptionalMemberExpression"
  ) {
    return !expression.computed && isSimpleReference(expression.object);
  }
  return false;
}

const POSITION_KEYS = new Set([
  "loc",
  "start",
  "end",
  "range",
  "original",
  "tokens",
  "comments",
  "extra",
]);

/**
 * A fresh copy of an expression, for using it in a second place. Recast
 * reprints a reused node from its original source position, so a node must
 * never appear twice in the tree.
 *
 * @template T
 * @param {T} node
 * @returns {T}
 */
export function cloneNode(node) {
  if (Array.isArray(node)) return /** @type {any} */ (node.map(cloneNode));
  if (!node || typeof node !== "object") return node;
  /** @type {any} */
  const copy = {};
  for (const [key, value] of Object.entries(node)) {
    if (POSITION_KEYS.has(key)) continue;
    copy[key] = cloneNode(value);
  }
  return copy;
}

/** The element's tag as written, for messages. @param {any} el */
export function tagName(el) {
  const name = el.openingElement.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") {
    return `${tagName({ openingElement: { name: name.object } })}.${name.property.name}`;
  }
  return "?";
}

/**
 * Set the element's tag name (opening and closing).
 *
 * @param {any} el
 * @param {string} name
 */
export function renameElement(el, name) {
  el.openingElement.name = { type: "JSXIdentifier", name };
  if (el.closingElement) el.closingElement.name = { type: "JSXIdentifier", name };
}
