/**
 * Per-component JSX rewrites for the 0.1 -> 0.2 upgrade: each function takes
 * one element of a removed 0.1 component and reshapes its props into the
 * Astryx counterpart's. What it cannot prove safe, it leaves in place with a
 * TODO marker (see ../lib/todo.mjs).
 */
import {
  attrExpression,
  cloneNode,
  attrValue,
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

/**
 * @typedef {object} Helpers
 * @property {any} j jscodeshift
 * @property {any} path NodePath of the element
 * @property {any} el the JSXElement
 * @property {(message: string) => void} todo
 * @property {(name: string, subpath: string) => string} ensureImport
 * @property {(name: string) => void} setTag rename the element (alternate component)
 * @property {boolean} isTS
 * @property {any} props mapping.props
 */

/**
 * Rename an attribute if present.
 *
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
 * Map a literal attribute through `table`; values are either a replacement
 * string, `null` (drop the attribute), or `[replacement, note]` (replace and
 * leave a TODO with the note).
 *
 * @param {Helpers} h
 * @param {string} name attribute to read
 * @param {Record<string, any>} table
 * @param {{to?: string, component: string}} options
 */
function mapLiteral(h, name, table, { to = name, component }) {
  const attr = getAttr(h.el, name);
  if (!attr) return;
  const value = attrValue(attr);
  if (value.kind === "string") {
    if (!(value.value in table)) {
      h.todo(`${component} ${name}="${value.value}" has no known Astryx counterpart.`);
      return;
    }
    const mapped = table[value.value];
    if (mapped === null) {
      removeAttr(h.el, attr);
      return;
    }
    const [replacement, note] = Array.isArray(mapped) ? mapped : [mapped, null];
    replaceAttr(h.el, attr, makeAttr(h.j, to, replacement));
    if (note) h.todo(note);
    return;
  }
  if (to !== name) renameAttr(attr, to);
  h.todo(
    `${component} ${name} is dynamic; map its values onto Astryx's: ${Object.entries(
      table,
    )
      .map(([k, v]) => `${k}→${v === null ? "(none)" : Array.isArray(v) ? v[0] : v}`)
      .join(", ")}.`,
  );
}

/**
 * A boolean 0.1 prop that becomes a different prop value in Astryx:
 * `fullWidth` -> `width="100%"`, `invalid` -> `status={{type: "error"}}`.
 *
 * @param {Helpers} h
 * @param {string} name
 * @param {string} to
 * @param {() => any} whenTrue expression for the new value
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
 * Drop a 0.1 prop Astryx has no place for. A literal default is dropped
 * silently; anything else leaves a TODO.
 *
 * @param {Helpers} h
 * @param {string} component
 * @param {string} name
 * @param {string} message
 * @param {Array<string|boolean>} [silentValues]
 */
function unsupported(h, component, name, message, silentValues = []) {
  const attr = getAttr(h.el, name);
  if (!attr) return;
  const value = attrValue(attr);
  if (
    (value.kind === "string" || value.kind === "boolean") &&
    silentValues.includes(value.value)
  ) {
    removeAttr(h.el, attr);
    return;
  }
  h.todo(`${component} "${name}": ${message}`);
}

/**
 * Move children into a prop. `mode`:
 * - "string": only provably-string children move silently; others move with a TODO
 * - "node": any children move (the target prop is a ReactNode)
 *
 * @param {Helpers} h
 * @param {string} prop
 * @param {"string" | "node"} mode
 * @param {string} component
 * @returns {boolean} whether children were moved
 */
function childrenToProp(h, prop, mode, component) {
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
      h.todo(`${component} "${prop}" must be a string; it was the element's children.`);
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
  const { j, el, props } = h;
  const table = props.Button;
  mapLiteral(h, "variant", table.variant, { component: "Button" });
  mapLiteral(h, "size", table.size, { component: "Button" });
  for (const [from, to] of Object.entries(table.rename)) rename(el, from, to);
  booleanToValue(h, "fullWidth", "width", () => j.stringLiteral("100%"));
  unsupported(h, "Button", "shape", table.todo.shape, ["default"]);
  unsupported(h, "Button", "inline", table.todo.inline, [false]);
  unsupported(h, "Button", "active", table.todo.active, [false]);
  unsupported(h, "Button", "iconPosition", table.todo.iconPosition, ["left"]);

  if (getAttr(el, "label")) return;
  const ariaLabel = getAttr(el, "ariaLabel");
  if (childrenToProp(h, "label", "string", "Button")) {
    if (ariaLabel) renameAttr(ariaLabel, "aria-label");
    return;
  }
  if (meaningfulChildren(el).length > 0) {
    // Rich children stay (Astryx renders them in place of the label), but the
    // accessible name still needs a string.
    if (ariaLabel) renameAttr(ariaLabel, "label");
    else
      h.todo(
        "Button needs a string `label` (its accessible name); its children are rich content.",
      );
    return;
  }
  if (ariaLabel) {
    renameAttr(ariaLabel, "label");
    return;
  }
  const tooltip = getAttr(el, "tooltip");
  if (tooltip && getAttr(el, "isIconOnly")) {
    setAttr(j, el, "label", cloneNode(attrExpression(j, tooltip)));
    return;
  }
  h.todo(
    "Button needs a string `label`; this call had no text, ariaLabel or title to take it from.",
  );
}

/** @param {Helpers} h */
export function Badge(h) {
  const table = h.props.Badge;
  mapLiteral(h, "variant", table.variant, { component: "Badge" });
  unsupported(h, "Badge", "size", "Astryx Badge has one size.", ["small"]);
  childrenToProp(h, "label", "node", "Badge");
}

/** @param {Helpers} h */
export function StatusTag(h) {
  const { j, el, props } = h;
  const table = props.StatusTag.state;
  const pulsing = props.StatusTag.pulsingStates;
  const state = getAttr(el, "state");
  const pulse = getAttr(el, "pulse");
  if (pulse) renameAttr(pulse, "isPulsing");
  if (state) {
    const value = attrValue(state);
    if (value.kind === "string" && value.value in table) {
      replaceAttr(el, state, makeAttr(j, "variant", table[value.value]));
      if (!pulse && pulsing.includes(value.value)) setAttr(j, el, "isPulsing", true);
    } else if (value.kind === "expression" && isSimpleReference(value.expression)) {
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
      if (!pulse) {
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
        `StatusDot "variant" replaces StatusTag "state": map ${Object.entries(table)
          .map(([k, v]) => `${k}→${v}`)
          .join(", ")}.`,
      );
    }
  }
  unsupported(h, "StatusTag", "size", "StatusDot has one size.", ["small"]);
  h.todo(
    "StatusDot shows no text: `label` is its accessible name only. Put a <Text> beside it if the label must stay visible.",
  );
}

/** @param {Helpers} h */
export function Tooltip(h) {
  const { j, el } = h;
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
  for (const name of ["className", "contentClassName", "tooltipId", "tabIndex"]) {
    unsupported(
      h,
      "Tooltip",
      name,
      "Astryx Tooltip has no such prop; it wires the trigger and the ARIA ids itself. Style the trigger, not the tooltip.",
    );
  }
}

/** @param {Helpers} h */
export function ProgressBar(h) {
  const { j, el, props } = h;
  mapLiteral(h, "variant", props.ProgressBar.variant, { component: "ProgressBar" });
  unsupported(h, "ProgressBar", "size", "Astryx ProgressBar has one size.", ["md"]);
  unsupported(
    h,
    "ProgressBar",
    "animated",
    "Astryx ProgressBar always animates its fill.",
    [true],
  );
  const value = getAttr(el, "value");
  if (value && attrValue(value).kind === "null") {
    replaceAttr(el, value, makeAttr(j, "isIndeterminate", true));
  }
  rename(el, "showLabel", "hasValueLabel");

  // 0.1 `label` was visible text replacing the percentage; Astryx's `label`
  // is the accessible name. The visible text moves to `formatValueLabel`.
  const visible = getAttr(el, "label");
  const ariaLabel = getAttr(el, "ariaLabel");
  if (visible) {
    const expression = attrExpression(j, visible);
    removeAttr(el, visible);
    setAttr(j, el, "hasValueLabel", true);
    setAttr(j, el, "formatValueLabel", j.arrowFunctionExpression([], expression));
    if (!ariaLabel) setAttr(j, el, "label", cloneNode(expression));
  }
  if (ariaLabel) renameAttr(ariaLabel, "label");
  if (!getAttr(el, "label")) {
    h.todo(
      "ProgressBar needs a `label` (its accessible name); add one, with isLabelHidden if it should not show.",
    );
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
  const illustration = rename(el, "illustration", "icon");
  const show = getAttr(el, "showIllustration");
  if (show) {
    const value = attrValue(show);
    removeAttr(el, show);
    if (value.kind === "boolean") {
      if (!value.value && illustration) removeAttr(el, illustration);
    } else if (illustration) {
      replaceAttr(
        el,
        illustration,
        makeAttr(
          j,
          "icon",
          j.conditionalExpression(
            value.expression,
            attrExpression(j, illustration),
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
      h.todo(
        `EmptyState "${name}" becomes a <Button> in "actions"; it is not an object literal, so move it by hand.`,
      );
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
    h.todo(
      "Astryx EmptyState takes no children; move them into `actions`, or beside it.",
    );
  }
  for (const name of ["title", "description"]) {
    const attr = getAttr(el, name);
    if (
      attr &&
      attrValue(attr).kind === "expression" &&
      !isStringish(attrExpression(j, attr))
    ) {
      const expression = attrExpression(j, attr);
      if (expression.type === "JSXElement" || expression.type === "JSXFragment") {
        h.todo(`Astryx EmptyState "${name}" is a string, not markup.`);
      }
    }
  }
}

/** @param {Helpers} h */
export function Skeleton(h) {
  const { j, el, props } = h;
  const variant = getAttr(el, "variant");
  if (variant) {
    const value = attrValue(variant);
    if (value.kind === "string" && value.value in props.Skeleton.variant) {
      const mapped = props.Skeleton.variant[value.value];
      if (mapped === null) removeAttr(el, variant);
      else replaceAttr(el, variant, makeAttr(j, "radius", mapped));
      if (value.value === "text" && !getAttr(el, "height"))
        setAttr(j, el, "height", "1em");
    } else {
      h.todo(
        'Skeleton "variant" is dynamic: rect → (default), text → radius={1}, circle → radius="rounded".',
      );
    }
  }
  rename(el, "testId", "data-testid");
  unsupported(
    h,
    "Skeleton",
    "loadingLabel",
    "Astryx Skeleton is decorative; announce loading on the region instead (aria-busy).",
  );
  unsupported(h, "Skeleton", "decorative", "Astryx Skeleton is always decorative.", [
    true,
  ]);
}

/** @param {Helpers} h */
export function Select(h) {
  const { j, el, props } = h;
  const table = props.Select;
  mapLiteral(h, "size", table.size, { component: "Select" });
  for (const [from, to] of Object.entries(table.rename)) rename(el, from, to);
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
      h.todo(
        "Selector needs a `label` (add isLabelHidden to keep it visually hidden).",
      );
    }
  }
}

/** @param {Helpers} h */
export function Tabs(h) {
  const { el } = h;
  rename(el, "activeTab", "value");
  rename(el, "onTabChange", "onChange");
  rename(el, "ariaLabel", "aria-label");
  h.todo(
    "TabList renders the tab strip only: turn `tabs` into <Tab value label /> children, render the active panel yourself (was `content` / `renderPanel`), and drop `groups`, `variant`, `overflowMode`, `fillContainer` (see `ui-common component TabList`; `segmented` is SegmentedControl).",
  );
}

/** @param {Helpers} h */
export function DataTable(h) {
  const { el } = h;
  rename(el, "rows", "data");
  rename(el, "getRowKey", "idKey");
  rename(el, "ariaLabel", "aria-label");
  rename(el, "testId", "data-testid");
  h.todo(
    "Table columns are {key, header, width, align, renderCell}: rename id→key and render→renderCell, and widths use pixel()/proportional() from @lablup/ui-common/Table.",
  );
  const rebuilt = [
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
  ].filter((name) => getAttr(el, name));
  if (rebuilt.length > 0) {
    h.todo(
      `Table has no ${rebuilt.join(", ")}: rebuild them with Table plugins (useTableSortable, useTableColumnResize, useTableColumnSettings) or around the table.`,
    );
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
    h.todo(
      "BaseCard `clickable` is dynamic: use ClickableCard when it is clickable and Card when not.",
    );
  } else if (clickable) {
    removeAttr(el, clickable);
  }
  rename(el, "testId", "data-testid");
  if (isClickable) {
    h.setTag(h.ensureImport("ClickableCard", "ClickableCard"));
    const aria = rename(el, "ariaLabel", "label");
    if (!aria) h.todo("ClickableCard needs a `label` (its accessible name).");
    for (const name of ["onKeyDown", "role", "tabIndex"]) {
      unsupported(
        h,
        "BaseCard",
        name,
        "ClickableCard handles keyboard activation and its role itself.",
      );
    }
  } else {
    rename(el, "ariaLabel", "aria-label");
  }
  unsupported(
    h,
    "BaseCard",
    "variant",
    "Card `variant` is a background colour; 0.1's installed/available states have no counterpart.",
    ["default"],
  );
  unsupported(
    h,
    "BaseCard",
    "state",
    "Card has no state; show loading/disabled/warning in its content (Skeleton, Banner).",
    ["idle"],
  );
  unsupported(
    h,
    "BaseCard",
    "direction",
    "Card does not lay out its children; wrap them in HStack or VStack.",
    ["column"],
  );
  unsupported(
    h,
    "BaseCard",
    "hoverable",
    "Card has no hover style; ClickableCard has one.",
    [false],
  );
  unsupported(
    h,
    "BaseCard",
    "ariaChecked",
    "A checkable card is SelectableCard (@lablup/ui-common/SelectableCard).",
  );
}

/** @param {Helpers} h */
export function Drawer(h) {
  const { j, el, props } = h;
  const onClose = getAttr(el, "onClose");
  if (onClose) {
    const handler = attrExpression(j, onClose);
    const isOpen = j.identifier("isOpen");
    const notOpen = j.unaryExpression("!", isOpen);
    let body;
    if (
      (handler.type === "ArrowFunctionExpression" ||
        handler.type === "FunctionExpression") &&
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
        j.arrowFunctionExpression([isOpen], j.blockStatement([body])),
      ),
    );
  }

  const title = getAttr(el, "title");
  if (title) {
    const value = attrValue(title);
    replaceAttr(el, title, makeAttr(j, "label", attrExpression(j, title)));
    if (value.kind === "expression" && !isStringish(value.expression)) {
      h.todo("lab Drawer `label` must be a string (it was the title).");
    }
  }
  if (title || getAttr(el, "subtitle") || getAttr(el, "footer")) {
    h.todo(
      "lab Drawer renders no title, subtitle or footer: put a Heading (and the footer) inside its children, then remove `subtitle` / `footer`.",
    );
  }

  const width = getAttr(el, "width");
  if (!width) {
    setAttr(j, el, "width", props.Drawer.defaultWidth);
  } else {
    const value = attrValue(width);
    if (value.kind === "string" && value.value in props.Drawer.width) {
      replaceAttr(el, width, makeAttr(j, "width", props.Drawer.width[value.value]));
    } else if (value.kind === "expression") {
      h.todo(
        "Drawer `width` is dynamic: narrow → 400, medium → 520, wide → 900 (pixels).",
      );
    }
  }
  rename(el, "ariaLabelledBy", "aria-labelledby");
  rename(el, "ariaDescribedBy", "aria-describedby");
  unsupported(
    h,
    "Drawer",
    "preventDismiss",
    "lab Drawer always dismisses on Escape and scrim click; guard in onOpenChange instead.",
    [false],
  );
  unsupported(
    h,
    "Drawer",
    "onDismissAttempt",
    "lab Drawer has no dismiss-attempt hook; handle it in onOpenChange.",
  );
  unsupported(
    h,
    "Drawer",
    "closeLabel",
    "lab Drawer's close button label comes from Astryx's i18n catalog.",
  );
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
