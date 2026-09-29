/**
 * Per-component JSX rewrites for the 0.1 -> 0.2 upgrade. The data (renames,
 * value maps, manual notes) comes from `migration/0.1-to-0.2.json` through
 * ./map.mjs; the functions here apply it to one element of a removed 0.1
 * component. What cannot be proven safe stays in place with a
 * TODO(ui-common-upgrade) marker (see ../lib/todo.mjs), worded from the map's
 * `manual` notes where one fits.
 */
import {
  attrExpression,
  attrValue,
  cloneNode,
  getAttr,
  isSimpleReference,
  isStringish,
  jsxTextValue,
  makeAttr,
  makeSelfClosing,
  meaningfulChildren,
  removeAttr,
  renameAttr,
  replaceAttr,
  setAttr,
} from "../lib/jsx.mjs";
import { manualNote } from "./map.mjs";

/**
 * @typedef {object} Helpers
 * @property {any} j jscodeshift
 * @property {any} path NodePath of the element
 * @property {any} el the JSXElement
 * @property {import('./map.mjs').Removed} removed the component's map entry
 * @property {(message: string) => void} todo
 * @property {(name: string, subpath: string) => string} ensureImport
 * @property {(name: string) => void} setTag switch to an alternative component
 * @property {(candidates: string[]) => string} freeName the first candidate no
 *   identifier in the file uses, else the last one numbered
 * @property {boolean} isTS
 */

/**
 * @param {any} el
 * @param {string} from
 * @param {string} to
 */
function rename(el, from, to) {
  const attr = getAttr(el, from);
  if (attr) renameAttr(attr, to);
  return attr;
}

/**
 * A TODO worded from the map's manual note about `word`, or `fallback`.
 *
 * @param {Helpers} h
 * @param {string} word
 * @param {string} fallback
 */
function todoAbout(h, word, fallback) {
  h.todo(manualNote(h.removed, word) ?? fallback);
}

/**
 * Apply the map's value map for `prop` to a literal attribute: a mapped value
 * replaces it; `null` (no counterpart) leaves it with a TODO. A dynamic value
 * is renamed (when `to` differs) and gets a TODO listing the map.
 *
 * @param {Helpers} h
 * @param {string} prop
 * @param {{to?: string, table?: Record<string, string|number|null>}} [options]
 */
function mapValue(h, prop, { to = prop, table = h.removed.spec.valueMaps[prop] } = {}) {
  const attr = getAttr(h.el, prop);
  if (!attr || !table) return;
  const value = attrValue(attr);
  const component = h.removed.name;
  if (value.kind === "string" || value.kind === "number") {
    const key = String(value.value);
    if (!(key in table)) {
      todoAbout(
        h,
        key,
        `${component} ${prop}="${key}" has no known Astryx counterpart.`,
      );
      return;
    }
    const mapped = table[key];
    if (mapped === null) {
      todoAbout(h, key, `${component} ${prop}="${key}" has no Astryx counterpart.`);
      return;
    }
    replaceAttr(h.el, attr, makeAttr(h.j, to, mapped));
    return;
  }
  if (to !== prop) renameAttr(attr, to);
  h.todo(
    `${component} ${prop} is dynamic; map its values onto Astryx's: ${Object.entries(
      table,
    )
      .map(([k, v]) => `${k}→${v === null ? "(none)" : v}`)
      .join(", ")}.`,
  );
}

/**
 * The map's plain renames (no kind, condition or value), except `skip`.
 *
 * @param {Helpers} h
 * @param {string[]} [skip]
 */
function plainRenames(h, skip = []) {
  for (const r of h.removed.spec.propRenames) {
    if (r.kind || r.onlyWhen || r.value !== undefined || skip.includes(r.from))
      continue;
    rename(h.el, r.from, r.to);
  }
}

/**
 * The map's renames that carry a fixed value: `fullWidth` -> `width="100%"`.
 *
 * @param {Helpers} h
 */
function valueRenames(h) {
  for (const r of h.removed.spec.propRenames) {
    if (r.value === undefined) continue;
    booleanToValue(h, r.from, r.to, () => h.j.stringLiteral(String(r.value)));
  }
}

/**
 * A boolean 0.1 prop that becomes another prop's value.
 *
 * @param {Helpers} h
 * @param {string} name
 * @param {string} to
 * @param {() => any} whenTrue
 */
function booleanToValue(h, name, to, whenTrue) {
  const attr = getAttr(h.el, name);
  if (!attr) return;
  const value = attrValue(attr);
  if (value.kind === "boolean") {
    if (value.value) replaceAttr(h.el, attr, makeAttr(h.j, to, whenTrue()));
    else removeAttr(h.el, attr);
    return;
  }
  const { j } = h;
  replaceAttr(
    h.el,
    attr,
    makeAttr(
      j,
      to,
      j.conditionalExpression(
        attrExpression(j, attr),
        whenTrue(),
        j.identifier("undefined"),
      ),
    ),
  );
}

/**
 * A 0.1 prop with no counterpart: a literal equal to its 0.1 default is
 * dropped silently, anything else stays with a TODO from the manual notes.
 *
 * @param {Helpers} h
 * @param {string} name
 * @param {Array<string|boolean>} [defaults]
 */
function unsupported(h, name, defaults = []) {
  const attr = getAttr(h.el, name);
  if (!attr) return;
  const value = attrValue(attr);
  if (
    (value.kind === "string" || value.kind === "boolean") &&
    defaults.includes(value.value)
  ) {
    removeAttr(h.el, attr);
    return;
  }
  todoAbout(h, name, `${h.removed.name} "${name}" has no Astryx counterpart.`);
}

/**
 * Move the children into a prop (the map's `children-to-prop` rename).
 * - "string": only provably-string children move silently; others move with a TODO
 * - "node": any children move (the target prop is a ReactNode)
 *
 * @param {Helpers} h
 * @param {string} prop
 * @param {"string" | "node"} mode
 * @returns {boolean} whether children were moved
 */
function childrenToProp(h, prop, mode) {
  const { j, el } = h;
  const children = meaningfulChildren(el);
  if (children.length === 0) return false;
  if (children.length === 1 && children[0].type === "JSXText") {
    setAttr(j, el, prop, j.stringLiteral(jsxTextValue(children[0].value)));
    makeSelfClosing(el);
    return true;
  }
  if (children.length === 1 && children[0].type === "JSXExpressionContainer") {
    const expression = children[0].expression;
    setAttr(j, el, prop, expression);
    makeSelfClosing(el);
    if (mode === "string" && !isStringish(expression)) {
      h.todo(
        `${h.removed.name} "${prop}" must be a string; it was the element's children.`,
      );
    }
    return true;
  }
  if (mode === "node") {
    const fragment = j.jsxFragment(
      j.jsxOpeningFragment(),
      j.jsxClosingFragment(),
      el.children,
    );
    setAttr(j, el, prop, fragment);
    makeSelfClosing(el);
    return true;
  }
  return false;
}

/** @param {Helpers} h */
export function Button(h) {
  const { j, el } = h;
  mapValue(h, "variant");
  mapValue(h, "size");
  valueRenames(h);
  unsupported(h, "shape", ["default"]);
  unsupported(h, "inline", [false]);
  unsupported(h, "active", [false]);
  unsupported(h, "iconPosition", ["left"]);

  // `label` is required: take it from the children, else from ariaLabel (then
  // it is the accessible name), else from title on an icon-only button.
  if (!getAttr(el, "label")) {
    const ariaLabel = getAttr(el, "ariaLabel");
    if (childrenToProp(h, "label", "string")) {
      // ariaLabel falls through to the plain rename (aria-label).
    } else if (meaningfulChildren(el).length > 0) {
      if (ariaLabel) renameAttr(ariaLabel, "label");
      else todoAbout(h, "label", "Button needs a string `label`.");
    } else if (ariaLabel) {
      renameAttr(ariaLabel, "label");
    } else {
      const title = getAttr(el, "title");
      if (title && getAttr(el, "iconOnly")) {
        setAttr(j, el, "label", cloneNode(attrExpression(j, title)));
      } else {
        todoAbout(
          h,
          "label",
          "Button needs a string `label`; this call had no text, ariaLabel or title to take it from.",
        );
      }
    }
  }
  plainRenames(h);
}

/** @param {Helpers} h */
export function Badge(h) {
  mapValue(h, "variant");
  // The map says to drop size: Astryx Badge has one size.
  const size = getAttr(h.el, "size");
  if (size) removeAttr(h.el, size);
  childrenToProp(h, "label", "node");
  plainRenames(h);
}

/** @param {Helpers} h */
export function StatusTag(h) {
  const { j, el } = h;
  const table = /** @type {Record<string, string>} */ (h.removed.spec.valueMaps.state);
  const pulsing = h.removed.spec.defaultsToMaterialize?.isPulsing?.whenState ?? [];
  const state = getAttr(el, "state");
  const pulse = rename(el, "pulse", "isPulsing");
  if (state) {
    const value = attrValue(state);
    if (value.kind === "string" && value.value in table) {
      replaceAttr(el, state, makeAttr(j, "variant", table[value.value]));
      if (!pulse && pulsing.includes(value.value)) setAttr(j, el, "isPulsing", true);
    } else if (value.kind === "expression" && isSimpleReference(value.expression)) {
      // A lookup in the map itself, typed `as const` in TypeScript.
      const map = j.objectExpression(
        Object.entries(table).map(([k, v]) =>
          j.objectProperty(j.identifier(k), j.stringLiteral(v)),
        ),
      );
      const typedMap = j.parenthesizedExpression(
        h.isTS ? j.tsAsExpression(map, j.tsTypeReference(j.identifier("const"))) : map,
      );
      replaceAttr(
        el,
        state,
        makeAttr(j, "variant", j.memberExpression(typedMap, value.expression, true)),
      );
      if (!pulse && pulsing.length > 0) {
        setAttr(
          j,
          el,
          "isPulsing",
          j.callExpression(
            j.memberExpression(
              j.arrayExpression(
                pulsing.map((/** @type {string} */ s) => j.stringLiteral(s)),
              ),
              j.identifier("includes"),
            ),
            [cloneNode(value.expression)],
          ),
        );
      }
    } else {
      renameAttr(state, "variant");
      h.todo(
        `StatusDot "variant" replaces StatusTag "state": ${Object.entries(table)
          .map(([k, v]) => `${k}→${v}`)
          .join(", ")}.`,
      );
    }
  }
  unsupported(h, "size", ["small"]);
  todoAbout(
    h,
    "label",
    "StatusDot shows no text: `label` is its accessible name only.",
  );
}

/** @param {Helpers} h */
export function Tooltip(h) {
  const { j, el } = h;
  mapValue(h, "placement");
  // toggleable meant "a tap toggles it"; that is Astryx's touchTrigger="tap".
  const toggleable = getAttr(el, "toggleable");
  if (toggleable) {
    const value = attrValue(toggleable);
    if (value.kind === "boolean") {
      if (value.value) replaceAttr(el, toggleable, makeAttr(j, "touchTrigger", "tap"));
      else removeAttr(el, toggleable);
    } else {
      replaceAttr(
        el,
        toggleable,
        makeAttr(
          j,
          "touchTrigger",
          j.conditionalExpression(
            value.expression,
            j.stringLiteral("tap"),
            j.stringLiteral("auto"),
          ),
        ),
      );
    }
  }
  for (const name of ["contentClassName", "tooltipId", "tabIndex"])
    unsupported(h, name);
  if (getAttr(el, "className")) {
    h.todo("Astryx Tooltip takes no className: style the trigger, not the tooltip.");
  }
  plainRenames(h);
}

/** @param {Helpers} h */
export function ProgressBar(h) {
  const { j, el } = h;
  mapValue(h, "variant");
  unsupported(h, "size", ["md"]);
  unsupported(h, "animated", [true]);
  const value = getAttr(el, "value");
  if (value && attrValue(value).kind === "null") {
    replaceAttr(el, value, makeAttr(j, "isIndeterminate", true));
  }
  plainRenames(h);

  // `label` is required and is the accessible name. A 0.1 `label` was visible
  // text, so it stays and stays visible; a 0.1 ariaLabel was not, so it
  // becomes a hidden label.
  const label = getAttr(el, "label");
  const ariaLabel = getAttr(el, "ariaLabel");
  if (label && ariaLabel) {
    removeAttr(el, ariaLabel);
    h.todo(
      "ProgressBar had both a visible label and ariaLabel; Astryx has one `label`, now the visible one.",
    );
  } else if (ariaLabel) {
    renameAttr(ariaLabel, "label");
    setAttr(j, el, "isLabelHidden", true);
  } else if (!label) {
    todoAbout(h, "label", "ProgressBar needs a `label`.");
  }
}

/**
 * `{label, onClick, href}` of a 0.1 action object literal.
 *
 * @param {any} object
 */
function actionFields(object) {
  if (object?.type !== "ObjectExpression") return null;
  /** @type {Record<string, any>} */
  const fields = {};
  for (const property of object.properties) {
    if (
      (property.type !== "ObjectProperty" && property.type !== "Property") ||
      property.computed ||
      property.key.type !== "Identifier"
    ) {
      return null;
    }
    fields[property.key.name] = property.shorthand ? property.key : property.value;
  }
  return fields;
}

/** @param {Helpers} h */
export function EmptyState(h) {
  const { j, el } = h;
  plainRenames(h);
  const icon = getAttr(el, "icon");
  const show = getAttr(el, "showIllustration");
  if (show) {
    const value = attrValue(show);
    removeAttr(el, show);
    if (value.kind === "boolean") {
      if (!value.value && icon) removeAttr(el, icon);
    } else if (icon) {
      replaceAttr(
        el,
        icon,
        makeAttr(
          j,
          "icon",
          j.conditionalExpression(
            value.expression,
            attrExpression(j, icon),
            j.identifier("undefined"),
          ),
        ),
      );
    }
  }

  const buttons = [];
  for (const [name, variant] of /** @type {const} */ ([
    ["primaryAction", "primary"],
    ["secondaryAction", "secondary"],
  ])) {
    const attr = getAttr(el, name);
    if (!attr) continue;
    const fields = actionFields(
      attrValue(attr).kind === "expression" ? attrExpression(j, attr) : null,
    );
    if (!fields || !fields.label) {
      todoAbout(h, name, `EmptyState "${name}" becomes a <Button> in "actions".`);
      continue;
    }
    const button = h.ensureImport("Button", "Button");
    const attrs = [makeAttr(j, "variant", variant), makeAttr(j, "label", fields.label)];
    if (fields.onClick) attrs.push(makeAttr(j, "onClick", fields.onClick));
    if (fields.href) attrs.push(makeAttr(j, "href", fields.href));
    buttons.push(
      j.jsxElement(j.jsxOpeningElement(j.jsxIdentifier(button), attrs, true), null, []),
    );
    removeAttr(el, attr);
  }
  if (buttons.length === 1) setAttr(j, el, "actions", buttons[0]);
  if (buttons.length > 1) {
    setAttr(
      j,
      el,
      "actions",
      j.jsxFragment(j.jsxOpeningFragment(), j.jsxClosingFragment(), buttons),
    );
  }
  if (meaningfulChildren(el).length > 0) {
    todoAbout(h, "children", "Astryx EmptyState takes no children.");
  }
  for (const name of ["title", "description"]) {
    const attr = getAttr(el, name);
    const expression = attr ? attrExpression(j, attr) : null;
    if (
      expression &&
      (expression.type === "JSXElement" || expression.type === "JSXFragment")
    ) {
      h.todo(`Astryx EmptyState "${name}" is a string, not markup.`);
    }
  }
}

/** @param {Helpers} h */
export function Skeleton(h) {
  const { j, el } = h;
  // From the map's manual note: circle -> radius="rounded", text ->
  // height="1em", rect is the default.
  const variant = getAttr(el, "variant");
  if (variant) {
    const value = attrValue(variant);
    if (value.kind === "string" && ["rect", "circle", "text"].includes(value.value)) {
      removeAttr(el, variant);
      if (value.value === "circle") setAttr(j, el, "radius", "rounded");
      if (value.value === "text" && !getAttr(el, "height"))
        setAttr(j, el, "height", "1em");
    } else {
      todoAbout(h, "variant", 'Skeleton "variant" is dynamic.');
    }
  }
  unsupported(h, "loadingLabel");
  unsupported(h, "decorative", [true]);
  plainRenames(h);
}

/** @param {Helpers} h */
export function Select(h) {
  const { j, el } = h;
  mapValue(h, "size");
  plainRenames(h);
  // Selector sizes the whole field with `width`.
  booleanToValue(h, "fullWidth", "width", () => j.stringLiteral("100%"));
  booleanToValue(h, "invalid", "status", () =>
    j.objectExpression([
      j.objectProperty(j.identifier("type"), j.stringLiteral("error")),
    ]),
  );
  if (!getAttr(el, "label")) {
    const aria = getAttr(el, "aria-label");
    if (aria) {
      renameAttr(aria, "label");
      setAttr(j, el, "isLabelHidden", true);
    } else {
      todoAbout(h, "label", "Selector needs a `label`.");
    }
  }
  for (const name of ["onBlur", "aria-describedby"]) unsupported(h, name);
}

/** @param {Helpers} h */
export function Tabs(h) {
  const { j, el } = h;
  plainRenames(h);
  rename(el, "ariaLabel", "aria-label");
  booleanToValue(h, "fillContainer", "layout", () => j.stringLiteral("fill"));
  const variant = getAttr(el, "variant");
  if (variant) {
    const value = attrValue(variant);
    if (value.kind === "string" && value.value === "underlined")
      removeAttr(el, variant);
    else if (value.kind === "string" && value.value === "compact") {
      replaceAttr(el, variant, makeAttr(j, "size", "sm"));
    } else todoAbout(h, "variant", 'Tabs "variant" has no TabList counterpart.');
  }
  todoAbout(
    h,
    "tabs",
    "TabList renders the strip only: `tabs` becomes <Tab> children and the caller renders the panel.",
  );
  for (const name of [
    "defaultTab",
    "groups",
    "overflowMode",
    "showOverflowControls",
    "showGroupLabels",
  ]) {
    if (getAttr(el, name))
      todoAbout(h, name, `Tabs "${name}" has no TabList counterpart.`);
  }
}

/** @param {Helpers} h */
export function DataTable(h) {
  const { el } = h;
  plainRenames(h);
  rename(el, "ariaLabel", "aria-label");
  rename(el, "testId", "data-testid");
  const idKey = h.removed.spec.propRenames.find((r) => r.from === "getRowKey");
  if (idKey && rename(el, idKey.from, idKey.to) && idKey.note)
    h.todo(`Table ${idKey.to}: ${idKey.note}.`);
  const columns = h.removed.spec.columnRenames ?? [];
  if (columns.length > 0) {
    h.todo(
      `Table columns: rename ${columns.map((c) => `${c.from}→${c.to}`).join(", ")}; renderCell takes the row item, and width is pixel()/proportional() from @lablup/ui-common/Table.`,
    );
  }
  for (const name of [
    "emptyState",
    "loadingState",
    "loading",
    "columnState",
    "onColumnStateChange",
    "onRowClick",
    "isRowClickable",
    "rowClassName",
    "sortColumnId",
    "sortDirection",
    "onSortChange",
  ]) {
    if (getAttr(el, name)) todoAbout(h, name, `Table has no "${name}".`);
  }
}

/** @param {Helpers} h */
export function BaseCard(h) {
  const { el } = h;
  const clickable = getAttr(el, "clickable");
  const onClick = getAttr(el, "onClick");
  const clickableValue = clickable ? attrValue(clickable) : null;
  const isClickable =
    onClick != null ||
    (clickableValue?.kind === "boolean" && clickableValue.value === true);
  if (clickable && clickableValue?.kind === "expression") {
    todoAbout(
      h,
      "clickable",
      "BaseCard `clickable` is dynamic: ClickableCard when clickable, Card when not.",
    );
  } else if (clickable) {
    removeAttr(el, clickable);
  }
  const alternate = Object.keys(h.removed.alternates)[0];
  if (isClickable && alternate) {
    h.setTag(h.ensureImport(alternate, h.removed.alternates[alternate]));
    // ClickableCard requires a label; the map's alternative says to take it
    // from ariaLabel.
    if (!rename(el, "ariaLabel", "label"))
      h.todo("ClickableCard needs a `label` (its accessible name).");
    for (const name of ["onKeyDown", "role", "tabIndex", "hoverable"])
      unsupported(h, name);
  } else {
    unsupported(h, "hoverable", [false]);
  }
  plainRenames(h);
  unsupported(h, "variant");
  unsupported(h, "state", ["idle"]);
  unsupported(h, "direction", ["column"]);
}

/** @param {Helpers} h */
export function Drawer(h) {
  const { j, el } = h;
  const onClose = getAttr(el, "onClose");
  if (onClose) {
    // The map: onClose -> onOpenChange, wrapped as (open) => { if (!open) onClose(); }.
    // 0.1 called onClose with no arguments. The parameter takes a name no
    // identifier in the file uses, so the handler's own reads (an `isOpen`
    // prop, say) keep their meaning.
    const handler = attrExpression(j, onClose);
    const param = j.identifier(h.freeName(["open", "isOpen", "nextOpen"]));
    const notOpen = j.unaryExpression("!", param);
    let body;
    // Only an arrow's body is inlined: `this` and `arguments` mean the same
    // inside another arrow, which a `function` body's would not.
    if (
      handler.type === "ArrowFunctionExpression" &&
      handler.params.length === 0 &&
      !handler.async
    ) {
      body =
        handler.body.type === "BlockStatement"
          ? j.ifStatement(notOpen, handler.body)
          : j.ifStatement(
              notOpen,
              j.blockStatement([j.expressionStatement(handler.body)]),
            );
    } else {
      body = j.ifStatement(
        notOpen,
        j.blockStatement([j.expressionStatement(j.callExpression(handler, []))]),
      );
    }
    replaceAttr(
      el,
      onClose,
      makeAttr(
        j,
        "onOpenChange",
        j.arrowFunctionExpression([param], j.blockStatement([body])),
      ),
    );
  }

  const title = getAttr(el, "title");
  if (title) {
    const value = attrValue(title);
    replaceAttr(el, title, makeAttr(j, "label", attrExpression(j, title)));
    if (value.kind === "expression" && !isStringish(value.expression)) {
      h.todo("lab Drawer `label` must be a string; it was the title.");
    }
  }
  if (title || getAttr(el, "subtitle") || getAttr(el, "footer")) {
    todoAbout(
      h,
      "header",
      "lab Drawer renders no header: render the title, subtitle and footer inside children.",
    );
  }

  // 0.1's default width was "medium"; the lab Drawer's default is narrower.
  const widths = /** @type {Record<string, number>} */ (
    h.removed.spec.valueMaps.width ?? {}
  );
  const width = getAttr(el, "width");
  if (!width) {
    if (widths.medium) setAttr(j, el, "width", widths.medium);
  } else {
    // A preset maps to pixels; any other CSS length is valid as it is.
    const value = attrValue(width);
    if (value.kind === "string" && value.value in widths) mapValue(h, "width");
    else if (value.kind === "expression") {
      h.todo(
        `Drawer width is dynamic: ${Object.entries(widths)
          .map(([k, v]) => `${k}→${v}`)
          .join(", ")} (pixels).`,
      );
    }
  }
  for (const name of ["ariaLabelledBy", "ariaDescribedBy", "closeLabel"])
    unsupported(h, name);
  unsupported(h, "preventDismiss", [false]);
  unsupported(h, "onDismissAttempt");
  plainRenames(h);
}

export const ELEMENT_TRANSFORMS = {
  Badge,
  BaseCard,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  ProgressBar,
  Select,
  Skeleton,
  StatusTag,
  Tabs,
  Tooltip,
};
