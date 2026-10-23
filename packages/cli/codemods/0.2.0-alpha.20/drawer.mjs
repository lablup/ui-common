/**
 * 0.2.0-alpha.20: Astryx 0.7.2 moved `Drawer` and `DrawerHeader` from lab to
 * core, so ui-common's `Drawer` fork moved from `@lablup/ui-common/lab` to
 * `@lablup/ui-common/Drawer`, and the lab mirror no longer has either name.
 *
 * Imports and re-exports of those names from `@lablup/ui-common/lab` move to
 * `@lablup/ui-common/Drawer` (joining an import from there when the file has
 * one); the rest of a lab import stays. A namespace import of the lab mirror,
 * or a module mock of it, is left as written and reported.
 *
 * Core's Drawer also took `isFullWidthOnMobile` into `experimental`, so the
 * prop on a Drawer element becomes `experimental={{ isFullWidthOnMobile }}`;
 * an element that already has `experimental` is left as written and reported.
 */

export const LAB = "@lablup/ui-common/lab";
export const DRAWER = "@lablup/ui-common/Drawer";
export const MOVED = new Set([
  "Drawer",
  "DrawerProps",
  "DrawerHeader",
  "DrawerHeaderProps",
]);

/** @param {any} specifier */
const importedName = (specifier) =>
  specifier.imported?.name ?? specifier.imported?.value ?? specifier.local?.name;

/** @param {any} specifier */
const exportedFrom = (specifier) => specifier.local?.name ?? specifier.local?.value;

/**
 * @param {{path: string, source: string}} file
 * @param {{jscodeshift: any}} api
 */
export function moveDrawerImports(file, api) {
  if (!file.source.includes(LAB) && !file.source.includes(FULL_WIDTH)) return undefined;
  const j = api.jscodeshift;
  const root = j(file.source);
  let changed = false;

  root
    .find(j.ImportDeclaration, { source: { value: LAB } })
    .forEach((/** @type {any} */ path) => {
      const node = path.node;
      const specifiers = node.specifiers ?? [];
      const moved = specifiers.filter(
        (/** @type {any} */ s) =>
          s.type === "ImportSpecifier" && MOVED.has(importedName(s)),
      );
      if (moved.length === 0) return;
      const kept = specifiers.filter((/** @type {any} */ s) => !moved.includes(s));
      const target = root
        .find(j.ImportDeclaration, {
          source: { value: DRAWER },
          importKind: node.importKind ?? "value",
        })
        .filter(
          (/** @type {any} */ p) =>
            !(p.node.specifiers ?? []).some(
              (/** @type {any} */ s) => s.type !== "ImportSpecifier",
            ),
        );
      if (target.size() > 0) {
        target.get().node.specifiers.push(...moved);
      } else {
        const declaration = j.importDeclaration(moved, j.stringLiteral(DRAWER));
        if (node.importKind === "type") declaration.importKind = "type";
        j(path).insertAfter(declaration);
      }
      if (kept.length > 0) node.specifiers = kept;
      else j(path).remove();
      changed = true;
    });

  root
    .find(j.ExportNamedDeclaration, { source: { value: LAB } })
    .forEach((/** @type {any} */ path) => {
      const node = path.node;
      const moved = node.specifiers.filter((/** @type {any} */ s) =>
        MOVED.has(exportedFrom(s)),
      );
      if (moved.length === 0) return;
      const kept = node.specifiers.filter((/** @type {any} */ s) => !moved.includes(s));
      const declaration = j.exportNamedDeclaration(
        null,
        moved,
        j.stringLiteral(DRAWER),
      );
      if (node.exportKind === "type") declaration.exportKind = "type";
      j(path).insertAfter(declaration);
      if (kept.length > 0) node.specifiers = kept;
      else j(path).remove();
      changed = true;
    });

  if (moveFullWidthOnMobile(j, root)) changed = true;

  if (!changed) return undefined;
  return root.toSource({ quote: /from\s+'/.test(file.source) ? "single" : "double" });
}

const DRAWER_SOURCES = new Set([LAB, DRAWER, "@lablup/ui-common"]);
const FULL_WIDTH = "isFullWidthOnMobile";

/**
 * Rewrite `isFullWidthOnMobile` on elements of a Drawer imported from
 * ui-common into core's `experimental={{ isFullWidthOnMobile }}`.
 *
 * @param {any} j
 * @param {any} root
 */
function moveFullWidthOnMobile(j, root) {
  /** @type {Set<string>} */
  const locals = new Set();
  root.find(j.ImportDeclaration).forEach((/** @type {any} */ path) => {
    if (!DRAWER_SOURCES.has(path.node.source.value)) return;
    for (const s of path.node.specifiers ?? []) {
      if (s.type === "ImportSpecifier" && importedName(s) === "Drawer") {
        locals.add(s.local.name);
      }
    }
  });
  if (locals.size === 0) return false;
  let changed = false;
  root.find(j.JSXOpeningElement).forEach((/** @type {any} */ path) => {
    const name = path.node.name;
    if (name.type !== "JSXIdentifier" || !locals.has(name.name)) return;
    const attrs = path.node.attributes ?? [];
    const index = attrs.findIndex(
      (/** @type {any} */ a) => a.type === "JSXAttribute" && a.name.name === FULL_WIDTH,
    );
    if (index < 0) return;
    const hasExperimental = attrs.some(
      (/** @type {any} */ a) =>
        a.type === "JSXAttribute" && a.name.name === "experimental",
    );
    if (hasExperimental) return;
    const value = attrs[index].value;
    let expression;
    if (value == null) expression = j.booleanLiteral(true);
    else if (value.type === "JSXExpressionContainer") expression = value.expression;
    else return;
    const property = j.objectProperty(j.identifier(FULL_WIDTH), expression);
    if (expression.type === "Identifier" && expression.name === FULL_WIDTH) {
      property.shorthand = true;
    }
    attrs[index] = j.jsxAttribute(
      j.jsxIdentifier("experimental"),
      j.jsxExpressionContainer(j.objectExpression([property])),
    );
    changed = true;
  });
  return changed;
}

export const CATEGORIES = {
  "drawer-lab": {
    title: "Drawer moved from @lablup/ui-common/lab to @lablup/ui-common/Drawer",
    help: "Astryx 0.7.2 moved Drawer and DrawerHeader into core, so @lablup/ui-common/lab no longer exports them. The upgrade moved every named import; these uses go through the whole lab module (a namespace import or a module mock), so move their Drawer and DrawerHeader to @lablup/ui-common/Drawer by hand.",
  },
  "drawer-full-width": {
    title: "Drawer's isFullWidthOnMobile is now experimental.isFullWidthOnMobile",
    help: "Core's Drawer reads the option only from `experimental={{ isFullWidthOnMobile }}`; a top-level isFullWidthOnMobile is ignored and the drawer keeps the 56px page reveal on mobile. The upgrade rewrote the prop on Drawer elements it could see; move these by hand (a props object or spread, or an element that already has experimental).",
  },
};

const LAB_RE = /@lablup\/ui-common\/lab["']/;

/**
 * Namespace imports and module mocks of the lab mirror, which the transform
 * cannot prove free of Drawer, and any `isFullWidthOnMobile` it left outside
 * `experimental`.
 *
 * @param {string} file
 * @param {string} source
 */
export function scanDrawer(file, source) {
  /** @type {Array<{category: string, file: string, line: number, text: string}>} */
  const out = [];
  if (/@lablup\/ui-common/.test(source)) {
    source.split("\n").forEach((line, i) => {
      if (/\bisFullWidthOnMobile\b/.test(line) && !/\bexperimental\b/.test(line)) {
        out.push({
          category: "drawer-full-width",
          file,
          line: i + 1,
          text: line.trim(),
        });
      }
    });
  }
  if (!LAB_RE.test(source)) return out;
  source.split("\n").forEach((line, i) => {
    if (!LAB_RE.test(line)) return;
    const namespace = /import\s+(?:type\s+)?\*\s+as\s+\w+\s+from/.test(line);
    const mock = /\b(?:vi|jest)\.(?:mock|doMock)\(/.test(line);
    if (namespace || mock) {
      out.push({ category: "drawer-lab", file, line: i + 1, text: line.trim() });
    }
  });
  return out;
}
