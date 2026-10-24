/**
 * 0.2.0-alpha.20 (#72): ui-common's form controls became `Form.Item`
 * wrappers. They take none of Astryx's field chrome (`label`,
 * `isLabelHidden`, `description`, `labelTooltip`, `labelIcon`, `isRequired`,
 * `isOptional`, `statusVariant`, `isDisabled`), and `status` is the border
 * only: `"error" | "warning" | ""`.
 *
 * On an element of a control imported from ui-common the transform rewrites
 * what keeps its meaning:
 * - `label={x} isLabelHidden` → `aria-label={x}`;
 * - `isDisabled` → `disabled`;
 * - `status={{ type: "error" | "warning" }}` → `status="error" | "warning"`;
 * - a `CheckboxInput` / `Switch` `label={x}` → its children.
 * Everything else (an element with a spread, a visible label on a text
 * control, a status object with a message or from an expression, the props
 * that belong to `Form.Item`) is left as written and reported.
 */
import jscodeshift from "jscodeshift";

import {
  CHROME_PROPS,
  scanFormControls,
  wrapperBindings,
} from "../lib/form-controls.mjs";
import {
  attrValue,
  attributes,
  expressionValue,
  getAttr,
  hasSpread,
  meaningfulChildren,
  removeAttr,
  renameAttr,
} from "../lib/jsx.mjs";

/**
 * The controls 0.2.0-alpha.20 made `Form.Item` wrappers (`wraps` on a
 * `formControls/` source in that release's exports.customs.json).
 */
export const WRAPPERS = new Set([
  "CheckboxInput",
  "CheckboxList",
  "DateInput",
  "DateRangeInput",
  "DateTimeInput",
  "FileInput",
  "MultiSelector",
  "NumberInput",
  "RadioList",
  "SegmentedControl",
  "Selector",
  "Slider",
  "Switch",
  "TextArea",
  "TextInput",
  "TimeInput",
  "Tokenizer",
  "Typeahead",
]);

/** The controls whose text beside them is `children`. */
const INLINE_LABEL = new Set(["CheckboxInput", "Switch"]);

/** Where each prop goes that the transform cannot move. */
const MOVE_TO = {
  description: "move it to the Form.Item's `extra`",
  labelTooltip: "move it to the Form.Item's `tooltip`",
  labelIcon: "move it into the Form.Item's `label`",
  isRequired: "the Form.Item's `required` / `rules` own it",
  isOptional: "the Form.Item owns the required mark",
  statusVariant: "drop it: the Form.Item shows the message (`help`)",
};

const STATUS_TYPES = new Set(["error", "warning"]);

/**
 * @typedef {{prop: string, apply?: () => void, why: string}} Change
 */

/**
 * What one element needs: changes with `apply` are safe rewrites; the rest
 * are left for a person, with the reason.
 *
 * @param {any} j
 * @param {any} el JSXElement
 * @param {string} control the ui-common name
 * @returns {Change[]}
 */
export function planElement(j, el, control) {
  /** @type {Change[]} */
  const out = [];
  const chrome = attributes(el).filter(
    (/** @type {any} */ a) =>
      a.type === "JSXAttribute" &&
      a.name?.type === "JSXIdentifier" &&
      CHROME_PROPS.includes(a.name.name),
  );
  if (hasSpread(el)) {
    out.push({
      prop: "{...}",
      why: "props spread into it: a `label`, `isDisabled` or status object in it is dropped",
    });
    for (const a of chrome) {
      if (a.name.name === "status" && attrValue(a).kind === "string") continue;
      out.push({ prop: a.name.name, why: "not rewritten beside a spread" });
    }
    return out;
  }

  const label = getAttr(el, "label");
  const hidden = getAttr(el, "isLabelHidden");
  let labelIsHidden = false;
  if (hidden) {
    const v = attrValue(hidden);
    if (v.kind === "boolean") {
      labelIsHidden = v.value;
      // Without a label, or set to false, it never did anything a wrapper keeps.
      if (!label || !v.value)
        out.push({
          prop: "isLabelHidden",
          apply: () => removeAttr(el, hidden),
          why: "does nothing on a wrapper: remove it",
        });
    } else {
      out.push({
        prop: "isLabelHidden",
        why: "set from an expression: pass `aria-label` where the label was hidden, or move the label to the Form.Item",
      });
    }
  }
  if (label) out.push(planLabel(j, el, control, label, hidden, labelIsHidden));

  const isDisabled = getAttr(el, "isDisabled");
  if (isDisabled) {
    out.push(
      getAttr(el, "disabled")
        ? { prop: "isDisabled", why: "beside `disabled`: keep one, as `disabled`" }
        : {
            prop: "isDisabled",
            apply: () => renameAttr(isDisabled, "disabled"),
            why: "→ `disabled`",
          },
    );
  }

  const status = getAttr(el, "status");
  if (status) {
    const change = planStatus(j, el, status);
    if (change) out.push(change);
  }

  for (const [prop, why] of Object.entries(MOVE_TO)) {
    if (getAttr(el, prop)) out.push({ prop, why });
  }
  return out;
}

/**
 * @param {any} j
 * @param {any} el
 * @param {string} control
 * @param {any} label
 * @param {any} hidden
 * @param {boolean} labelIsHidden
 * @returns {Change}
 */
function planLabel(j, el, control, label, hidden, labelIsHidden) {
  const value = label.value;
  const expression =
    value?.type === "JSXExpressionContainer" ? value.expression : value;
  if (
    value == null ||
    expression?.type === "JSXElement" ||
    expression?.type === "JSXFragment"
  ) {
    return { prop: "label", why: "not a string: move it to the Form.Item's `label`" };
  }
  if (labelIsHidden) {
    if (getAttr(el, "aria-label"))
      return {
        prop: "label",
        why: "hidden, beside `aria-label`: keep one, as `aria-label`",
      };
    return {
      prop: "label",
      apply: () => {
        renameAttr(label, "aria-label");
        removeAttr(el, hidden);
      },
      why: "hidden → `aria-label`",
    };
  }
  if (INLINE_LABEL.has(control)) {
    if (meaningfulChildren(el).length > 0)
      return { prop: "label", why: "beside children: keep one, as children" };
    return {
      prop: "label",
      apply: () => {
        removeAttr(el, label);
        el.openingElement.selfClosing = false;
        el.closingElement = j.jsxClosingElement(el.openingElement.name);
        el.children = [labelChild(j, expression)];
      },
      why: "→ children",
    };
  }
  return {
    prop: "label",
    why: "a visible label: move it to the Form.Item's `label`, or to `aria-label` where the control stands alone",
  };
}

/**
 * JSX text for a plain string, an expression container for anything else.
 *
 * @param {any} j
 * @param {any} expression
 */
function labelChild(j, expression) {
  const text =
    expression.type === "StringLiteral" ||
    (expression.type === "Literal" && typeof expression.value === "string")
      ? expression.value
      : null;
  if (
    text != null &&
    text !== "" &&
    /^[^\s{}<>&][^{}<>&\n]*$/.test(text) &&
    !/\s$/.test(text)
  )
    return j.jsxText(text);
  return j.jsxExpressionContainer(expression);
}

/**
 * @param {any} j
 * @param {any} el
 * @param {any} status
 * @returns {Change | null}
 */
function planStatus(j, el, status) {
  const v = attrValue(status);
  if (v.kind === "string") return null;
  const expression = v.kind === "expression" ? v.expression : null;
  if (expression?.type !== "ObjectExpression")
    return {
      prop: "status",
      why: 'not a literal: pass `"error"`, `"warning"` or `""`; a message goes to the Form.Item\'s `help`',
    };
  const props = expression.properties;
  const type = props.find(
    (/** @type {any} */ p) =>
      (p.type === "ObjectProperty" || p.type === "Property") &&
      !p.computed &&
      (p.key.name === "type" || p.key.value === "type"),
  );
  const typeValue = type ? expressionValue(type.value) : null;
  if (
    props.length !== 1 ||
    typeValue?.kind !== "string" ||
    !STATUS_TYPES.has(typeValue.value)
  ) {
    return {
      prop: "status",
      why:
        props.length > 1
          ? "carries a message: the border becomes `status`, the message the Form.Item's `help`"
          : 'not `{ type: "error" | "warning" }`: pass `"error"`, `"warning"` or `""`',
    };
  }
  return {
    prop: "status",
    apply: () => {
      status.value = j.stringLiteral(typeValue.value);
    },
    why: `→ \`"${typeValue.value}"\``,
  };
}

/** @param {any} name JSXOpeningElement name */
const localName = (name) => (name.type === "JSXIdentifier" ? name.name : null);

/**
 * The transform: the safe rewrites on every ui-common form-control element.
 *
 * @param {{path: string, source: string}} file
 * @param {{jscodeshift: any}} api
 */
export function migrateFieldChrome(file, api) {
  const bindings = wrapperBindings(file.source, WRAPPERS);
  if (bindings.size === 0) return undefined;
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;
  root.find(j.JSXElement).forEach((/** @type {any} */ path) => {
    const control = bindings.get(localName(path.node.openingElement.name));
    if (!control) return;
    for (const change of planElement(j, path.node, control)) {
      if (!change.apply) continue;
      change.apply();
      changed = true;
    }
  });
  if (!changed) return undefined;
  return root.toSource({ quote: /from\s+'/.test(file.source) ? "single" : "double" });
}

export const CATEGORIES = {
  "field-chrome": {
    title: "Form controls: the field chrome moved to Form.Item",
    help: 'Since 0.2.0-alpha.20 ui-common\'s form controls (`TextInput`, `Selector`, `Switch`, …) are wrappers for `Form.Item`: the item owns the label, description (`extra`), tooltip, required mark (`required` / `rules`) and status message (`help`), and the control silently drops Astryx\'s `label`, `isLabelHidden`, `description`, `labelTooltip`, `labelIcon`, `isRequired`, `isOptional`, `statusVariant` and `isDisabled`; `status` is the border only (`"error" | "warning" | ""`). The upgrade rewrote what kept its meaning (a hidden label to `aria-label`, `isDisabled` to `disabled`, `status={{ type }}` to the string, a CheckboxInput / Switch label to children). Move each of these by hand: inside a form to the enclosing `Form.Item`, on its own name the control with `aria-label`. A spread is listed because what it carries is dropped the same way.',
  },
};

const SCRIPT = /\.(?:[cm]?[jt]sx?)$/;

/**
 * A safe change still in the file was outside the paths the run transformed
 * (a test or script it only read).
 *
 * @param {Change} change
 */
const describe = (change) =>
  `\`${change.prop}\` ${change.why}${change.apply ? " (rewritten only in the paths the upgrade transforms)" : ""}`;

/**
 * The field chrome left on ui-common form-control elements after the run.
 *
 * @param {string} file project-relative
 * @param {string} source
 * @returns {import('../lib/form-controls.mjs').Finding[]}
 */
export function scanFieldChrome(file, source) {
  if (!SCRIPT.test(file)) return [];
  const bindings = wrapperBindings(source, WRAPPERS);
  if (bindings.size === 0) return [];
  const j = jscodeshift.withParser(/\.[cm]?tsx?$/.test(file) ? "tsx" : "babel");
  let root;
  try {
    root = j(source);
  } catch {
    return scanFormControls(file, source, WRAPPERS, "field-chrome");
  }
  const lines = source.split("\n");
  /** @type {import('../lib/form-controls.mjs').Finding[]} */
  const out = [];
  root.find(j.JSXElement).forEach((/** @type {any} */ path) => {
    const control = bindings.get(localName(path.node.openingElement.name));
    if (!control) return;
    const changes = planElement(j, path.node, control);
    if (changes.length === 0) return;
    const line = path.node.loc?.start.line ?? 1;
    out.push({
      category: "field-chrome",
      file,
      line,
      text: (lines[line - 1] ?? "").trim(),
      detail: `${control}: ${changes.map(describe).join("; ")}`,
    });
  });
  return out;
}
