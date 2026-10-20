/**
 * Astryx `Dialog` / `AlertDialog` → ui-common `Modal` / `AlertModal`.
 *
 * ui-common hides both subpaths (exports.exclude.json). `Modal` takes every
 * `Dialog` prop and `AlertModal` every `AlertDialog` prop, so a named import
 * moves by renaming: the import, then each reference in the module (JSX,
 * values, types). Where the module already binds the new name, the import
 * keeps the old one as an alias (`Modal as Dialog`) and nothing else moves.
 * A module's own re-export keeps its public name (`export { Modal as Dialog }`).
 *
 * Names with no ui-common counterpart (`useImperativeDialog`, …) stay on the
 * Astryx subpath, split into their own import, and land in the report. One
 * visible difference is reported too: a `ref` on `Modal` reaches the element
 * with `role="dialog"`, not an `HTMLDialogElement`.
 */
import { lineAt, lineTextAt } from "../../cli/project.mjs";
import { UIC } from "./specifiers.mjs";

const CORE = "@astryxdesign/core";

/** Old name → new name, per source. */
const RENAMES = {
  Dialog: "Modal",
  DialogProps: "ModalProps",
  AlertDialog: "AlertModal",
  AlertDialogProps: "AlertModalProps",
};
/** Exported by ui-common under the same name (from `/Modal` and the root). */
const KEPT = new Set([
  "DialogHeader",
  "DialogHeaderProps",
  "DialogPosition",
  "DialogPurpose",
  "DialogVariant",
]);
/** No ui-common counterpart: these stay on Astryx, and the report says so. */
export const UNREPLACED = {
  DialogVariantMap: `${CORE}/Dialog`,
  useImperativeDialog: `${CORE}/Dialog`,
  ImperativeDialogReturn: `${CORE}/Dialog`,
  useImperativeAlertDialog: `${CORE}/AlertDialog`,
  ImperativeAlertDialogReturn: `${CORE}/AlertDialog`,
};

const SOURCES = {
  [`${CORE}/Dialog`]: `${UIC}/Modal`,
  [`${CORE}/AlertDialog`]: `${UIC}/AlertModal`,
  [CORE]: null, // the root: the specifier pass rewrites it
};

/** Names that make a module worth parsing. */
export const DIALOG_NAMES = new RegExp(
  `\\b(${[...Object.keys(RENAMES), ...Object.keys(UNREPLACED)].join("|")})\\b`,
);

/** @param {any} node */
const nameOf = (node) => node?.name ?? node?.value;

const KEY_PARENTS = new Set([
  "ClassProperty",
  "ClassPrivateProperty",
  "PropertyDefinition",
  "ClassMethod",
  "MethodDefinition",
  "ObjectMethod",
  "TSPropertySignature",
  "TSMethodSignature",
  "TSEnumMember",
]);

/**
 * Rename module-level references of `from` to `to`. Property keys, member
 * properties and bindings that shadow it in an inner scope are left alone.
 *
 * @param {any} j
 * @param {any} root
 * @param {string} from
 * @param {string} to
 */
function renameReferences(j, root, from, to) {
  const program = root.find(j.Program).paths()[0];
  const programScope = program?.scope;
  root.find(j.Identifier, { name: from }).forEach((/** @type {any} */ path) => {
    const parent = path.parent?.node;
    const node = path.node;
    if (!parent) return;
    if (
      parent.type === "ImportSpecifier" ||
      parent.type === "ImportDefaultSpecifier" ||
      parent.type === "ImportNamespaceSpecifier" ||
      parent.type === "ExportSpecifier"
    )
      return;
    if (
      (parent.type === "MemberExpression" ||
        parent.type === "OptionalMemberExpression") &&
      parent.property === node &&
      !parent.computed
    )
      return;
    if (
      (parent.type === "Property" || parent.type === "ObjectProperty") &&
      parent.key === node &&
      !parent.computed
    ) {
      if (!parent.shorthand || path.parent.parent?.node.type === "ObjectPattern")
        return;
      // `{ Dialog }` as a value: keep the key, point the value at the new name.
      parent.shorthand = false;
      parent.value = j.identifier(to);
      return;
    }
    if (KEY_PARENTS.has(parent.type) && parent.key === node && !parent.computed) return;
    if (parent.type === "TSQualifiedName" && parent.right === node) return;
    if (
      parent.type === "LabeledStatement" ||
      parent.type === "BreakStatement" ||
      parent.type === "ContinueStatement"
    )
      return;
    const declaring = path.scope?.lookup(from);
    if (declaring && programScope && declaring !== programScope) return;
    node.name = to;
  });
  root.find(j.JSXIdentifier, { name: from }).forEach((/** @type {any} */ path) => {
    const parent = path.parent?.node;
    if (
      (parent?.type === "JSXOpeningElement" || parent?.type === "JSXClosingElement") &&
      parent.name === path.node
    )
      path.node.name = to;
    else if (parent?.type === "JSXMemberExpression" && parent.object === path.node)
      path.node.name = to;
  });
  // `export { Dialog }`: keep the module's public name.
  root.find(j.ExportSpecifier).forEach((/** @type {any} */ path) => {
    const spec = path.node;
    if (path.parent.node.source) return;
    if (nameOf(spec.local) !== from) return;
    path.replace(
      exportSpecifier(j, to, nameOf(spec.exported) ?? from, spec.exportKind),
    );
  });
}

/**
 * Fresh specifier nodes: the parser's carry `id` / `name` aliases that recast
 * prints in preference to edited `imported` / `local` fields.
 *
 * @param {any} j
 * @param {string} imported
 * @param {string} local
 * @param {string} [importKind]
 */
function importSpecifier(j, imported, local, importKind) {
  const node = j.importSpecifier(j.identifier(imported), j.identifier(local));
  if (importKind && importKind !== "value") node.importKind = importKind;
  return node;
}

/**
 * @param {any} j
 * @param {string} local
 * @param {string} exported
 * @param {string} [exportKind]
 */
function exportSpecifier(j, local, exported, exportKind) {
  const node = j.exportSpecifier.from({
    local: j.identifier(local),
    exported: j.identifier(exported),
  });
  if (exportKind && exportKind !== "value") node.exportKind = exportKind;
  return node;
}

/**
 * @param {{source: string, path: string}} file
 * @param {any} j jscodeshift bound to the file's parser
 * @returns {{text: string | null, findings: Array<{category: string, line: number, text: string, detail: string}>, renamed: string[]}}
 */
export function transformDialogs(file, j) {
  const source = file.source;
  /** @type {Array<{category: string, line: number, text: string, detail: string}>} */
  const findings = [];
  if (!/@astryxdesign\/core/.test(source) || !DIALOG_NAMES.test(source))
    return { text: null, findings, renamed: [] };
  const root = j(source);
  let changed = false;
  /** @type {string[]} */
  const renamed = [];
  /** Local name → new component name, for the `ref` scan. */
  /** @type {Map<string, string>} */
  const components = new Map();

  const handle = (/** @type {any} */ path, /** @type {"import" | "export"} */ kind) => {
    const decl = path.node;
    const from = decl.source?.value;
    if (typeof from !== "string" || !(from in SOURCES)) return;
    const specifiers = decl.specifiers ?? [];
    const named = specifiers.filter(
      (/** @type {any} */ s) =>
        s.type === (kind === "import" ? "ImportSpecifier" : "ExportSpecifier"),
    );
    const others = specifiers.filter((/** @type {any} */ s) => !named.includes(s));
    const relevant = named.some((/** @type {any} */ s) => {
      const n = nameOf(kind === "import" ? s.imported : s.local);
      return n in RENAMES || n in UNREPLACED;
    });
    if (from === CORE && !relevant) return;
    if (others.length > 0 && from !== CORE) {
      // `import Dialog, * as D from …`: no named clause to move.
      return;
    }
    /** @type {any[]} */
    const keep = [];
    /** @type {any[]} */
    const stay = [];
    for (const s of named) {
      const imported = nameOf(kind === "import" ? s.imported : s.local);
      if (imported in UNREPLACED) {
        stay.push({
          spec: s,
          origin: UNREPLACED[/** @type {keyof typeof UNREPLACED} */ (imported)],
        });
        continue;
      }
      const to = RENAMES[/** @type {keyof typeof RENAMES} */ (imported)];
      if (!to) {
        if (from !== CORE && !KEPT.has(imported)) stay.push({ spec: s, origin: from });
        else keep.push(s);
        continue;
      }
      renamed.push(`${imported} → ${to}`);
      if (kind === "export") {
        keep.push(exportSpecifier(j, to, nameOf(s.exported) ?? imported, s.exportKind));
        continue;
      }
      const local = nameOf(s.local) ?? imported;
      if (local === imported && !new RegExp(`\\b${to}\\b`).test(source)) {
        renameReferences(j, root, imported, to);
        if (!to.endsWith("Props")) components.set(to, to);
        keep.push(importSpecifier(j, to, to, s.importKind));
      } else {
        if (!to.endsWith("Props")) components.set(local, to);
        keep.push(importSpecifier(j, to, local, s.importKind));
      }
    }
    // Only names that must stay on this very subpath: nothing to move.
    if (keep.length === 0 && stay.every((s) => s.origin === from)) return;
    const target = SOURCES[from] ?? from;
    /** @type {any[]} */
    const replacement = [];
    if (keep.length > 0 || others.length > 0) {
      decl.specifiers = [...others, ...keep];
      decl.source = j.stringLiteral(target);
      replacement.push(decl);
    }
    /** @type {Map<string, any[]>} */
    const byOrigin = new Map();
    for (const { spec, origin } of stay) {
      byOrigin.set(origin, [...(byOrigin.get(origin) ?? []), spec]);
    }
    for (const [origin, specs] of byOrigin) {
      const node =
        kind === "import"
          ? j.importDeclaration(specs, j.stringLiteral(origin))
          : j.exportNamedDeclaration(null, specs, j.stringLiteral(origin));
      if (decl.importKind) node.importKind = decl.importKind;
      if (decl.exportKind) node.exportKind = decl.exportKind;
      replacement.push(node);
    }
    if (replacement.length === 0) path.prune();
    else if (replacement.length > 1 || replacement[0] !== decl) {
      if (replacement[0] === decl) {
        for (const extra of replacement.slice(1).reverse()) path.insertAfter(extra);
      } else path.replace(...replacement);
    }
    changed = true;
  };

  root.find(j.ImportDeclaration).forEach((/** @type {any} */ p) => handle(p, "import"));
  root.find(j.ExportNamedDeclaration).forEach((/** @type {any} */ p) => {
    if (p.node.source) handle(p, "export");
  });
  if (!changed) return { text: null, findings, renamed };

  const quote = /from\s+'/.test(source) ? "single" : "double";
  let text = root.toSource({ quote });
  if (source.endsWith("\n") && !text.endsWith("\n")) text += "\n";

  // What a person has to look at: a ref on the new component, and code that
  // expected an HTMLDialogElement.
  for (const [local, to] of components) {
    const tag = new RegExp(`<${local}\\b[^>]*?\\bref\\s*=`, "g");
    for (const m of text.matchAll(tag)) {
      const at = m.index ?? 0;
      findings.push({
        category: "dialog-ref",
        line: lineAt(text, at),
        text: lineTextAt(text, at),
        detail: `\`ref\` on ${to} reaches the element with role="dialog", not an HTMLDialogElement: \`showModal()\`, \`close()\` and \`open\` are not there. Open and close it with \`isOpen\` / \`onOpenChange\`.`,
      });
    }
  }
  for (const m of text.matchAll(/\bHTMLDialogElement\b/g)) {
    const at = m.index ?? 0;
    findings.push({
      category: "dialog-ref",
      line: lineAt(text, at),
      text: lineTextAt(text, at),
      detail:
        'This module moved from Dialog to Modal, whose ref is an HTMLDivElement (role="dialog"). Retype the ref and drop dialog-element calls.',
    });
  }
  return { text, findings, renamed };
}
