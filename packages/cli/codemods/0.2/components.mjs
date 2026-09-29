/**
 * 0.1 -> 0.2: the twelve 0.1 components Astryx now covers move to their
 * Astryx counterparts, and their props are reshaped.
 *
 * - Imports from the root barrel and from `@lablup/ui-common/components/<Name>`
 *   move to `@lablup/ui-common/<Astryx subpath>` (Drawer to `/lab`). Kept
 *   components (PageHeader, StatCard, the Skeleton composites, …) keep the
 *   import they had. `usePrefersReducedMotion` moves from `/hooks` to the root.
 * - Re-exports (`export { Select } from …`) keep their public name.
 * - Every JSX element of a moved component goes through ./elements.mjs.
 */
import {
  freeName,
  hasSpread,
  identifierNames,
  renameElement,
  tagName,
  TODO_TAG,
} from "../lib/jsx.mjs";
import { addTodo } from "../lib/todo.mjs";
import { ELEMENT_TRANSFORMS } from "./elements.mjs";
import { importsLocalLegacy, localExports, registerWrapper } from "./local-modules.mjs";
import { MOVED, REMOVED, REMOVED_TYPES, UIC } from "./map.mjs";

export const meta = {
  id: "components",
  title:
    "Move removed 0.1 components to their Astryx counterparts and reshape their props",
  extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".mts", ".cts"],
};

/**
 * @param {string} source
 * @returns {{kind: 'root'} | {kind: 'component', dir: string} | {kind: 'hooks'} | null}
 */
function classify(source) {
  if (source === UIC) return { kind: "root" };
  if (source === `${UIC}/hooks`) return { kind: "hooks" };
  const match = /^@lablup\/ui-common\/components\/([A-Za-z]+)$/.exec(source);
  if (match) return { kind: "component", dir: match[1] };
  return null;
}

/**
 * @param {string} name exported name
 * @param {NonNullable<ReturnType<typeof classify>>} from
 */
function resolveName(name, from) {
  if (from.kind === "hooks") {
    const moved = MOVED.get(name);
    return moved && moved.from === `${UIC}/hooks`
      ? { action: "move", source: moved.to }
      : { action: "keep" };
  }
  if (REMOVED.has(name)) return { action: "component", entry: REMOVED.get(name) };
  if (REMOVED_TYPES.has(name))
    return { action: "type", .../** @type {any} */ (REMOVED_TYPES.get(name)) };
  return { action: "keep" };
}

/** @param {string} source */
function detectQuote(source) {
  const double = (source.match(/from "/g) ?? []).length;
  const single = (source.match(/from '/g) ?? []).length;
  return single > double ? "single" : "double";
}

/**
 * Names a new import binding must not take: every import binding, and every
 * name bound or read in any scope of the file (a function-local `const Card`,
 * a parameter, a global). A rename onto one of them would capture the
 * other's references, or be captured by it.
 *
 * @param {any} j
 * @param {any} root
 */
function takenNames(j, root) {
  const names = new Set();
  root.find(j.ImportDeclaration).forEach((/** @type {any} */ p) => {
    for (const s of p.node.specifiers ?? []) if (s.local) names.add(s.local.name);
  });
  root.find(j.Identifier).forEach((/** @type {any} */ p) => {
    if (p.node.type === "JSXIdentifier") {
      const parent = p.parent?.node;
      const isTag =
        parent?.type === "JSXOpeningElement" ||
        parent?.type === "JSXClosingElement" ||
        (parent?.type === "JSXMemberExpression" && parent.object === p.node);
      if (isTag) names.add(p.node.name);
      return;
    }
    if (isReference(p)) names.add(p.node.name);
  });
  return names;
}

/**
 * Whether `name`, read at `path`, is the module-level binding (an import)
 * rather than a local that shadows it.
 *
 * @param {any} path
 * @param {string} name
 * @param {any} programScope
 */
function isModuleBinding(path, name, programScope) {
  const scope = path.scope?.lookup(name);
  return scope == null || scope === programScope;
}

/**
 * Whether an Identifier path is a reference to a binding, not a property
 * name, an import/export name slot, or a declaration key.
 *
 * @param {any} path
 */
function isReference(path) {
  const parent = path.parent?.node;
  const node = path.node;
  if (!parent) return true;
  switch (parent.type) {
    case "ImportSpecifier":
    case "ImportDefaultSpecifier":
    case "ImportNamespaceSpecifier":
    case "ExportSpecifier":
      return false;
    case "MemberExpression":
    case "OptionalMemberExpression":
      return parent.object === node || parent.computed;
    case "ObjectProperty":
    case "Property":
      return parent.value === node || parent.computed;
    case "TSPropertySignature":
    case "ClassProperty":
    case "PropertyDefinition":
    case "ClassMethod":
    case "MethodDefinition":
    case "ObjectMethod":
      return parent.computed === true && parent.key === node;
    case "TSQualifiedName":
      return parent.left === node;
    default:
      return true;
  }
}

/**
 * Rename every reference to a module-level binding, JSX tags included. A
 * local that shadows it keeps its name.
 *
 * @param {any} j
 * @param {any} root
 * @param {string} from
 * @param {string} to
 * @param {any} programScope
 */
function renameReferences(j, root, from, to, programScope) {
  root.find(j.Identifier, { name: from }).forEach((/** @type {any} */ p) => {
    if (p.node.type === "JSXIdentifier") return;
    if (!isModuleBinding(p, from, programScope)) return;
    const parent = p.parent?.node;
    if (
      (parent?.type === "ObjectProperty" || parent?.type === "Property") &&
      parent.shorthand &&
      parent.value === p.node
    ) {
      parent.shorthand = false;
      parent.value = j.identifier(to);
      return;
    }
    if (parent?.type === "ExportSpecifier" && parent.local === p.node) {
      // A fresh node: recast prints a parsed specifier from its original
      // fields, so editing local/exported in place loses the public name.
      const spec = j.exportSpecifier.from({
        local: j.identifier(to),
        exported: j.identifier(parent.exported?.name ?? from),
      });
      if (parent.exportKind) spec.exportKind = parent.exportKind;
      p.parent.replace(spec);
      return;
    }
    if (!isReference(p)) return;
    p.node.name = to;
  });
  root.find(j.JSXIdentifier, { name: from }).forEach((/** @type {any} */ p) => {
    if (!isModuleBinding(p, from, programScope)) return;
    const parent = p.parent?.node;
    if (
      parent?.type === "JSXOpeningElement" ||
      parent?.type === "JSXClosingElement" ||
      (parent?.type === "JSXMemberExpression" && parent.object === p.node)
    ) {
      p.node.name = to;
    }
  });
}

/**
 * @param {any} j
 * @param {string} imported
 * @param {string} local
 */
function importSpecifier(j, imported, local) {
  return imported === local
    ? j.importSpecifier(j.identifier(imported))
    : j.importSpecifier(j.identifier(imported), j.identifier(local));
}

/**
 * @param {{source: string, kind: 'value'|'type', imported: string, local: string}[]} adds
 * @param {any} j
 */
function buildImports(j, adds) {
  /** @type {Map<string, any[]>} */
  const groups = new Map();
  for (const add of adds) {
    const key = `${add.kind}\u0000${add.source}`;
    const list = groups.get(key) ?? [];
    if (!list.some((s) => s.imported === add.imported && s.local === add.local))
      list.push(add);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, list]) => {
    const [kind, source] = key.split("\u0000");
    const decl = j.importDeclaration(
      list.map((a) => importSpecifier(j, a.imported, a.local)),
      j.stringLiteral(source),
    );
    if (kind === "type") decl.importKind = "type";
    return decl;
  });
}

/**
 * Put `decls` before `path`'s statement. Leading comments of the statement
 * (a file header, say) move to the first inserted declaration, so they stay
 * on top. Inserting before an existing statement, not after it, keeps recast
 * from moving the blank line that follows the import block.
 *
 * @param {any} path
 * @param {any[]} decls
 */
function insertBeforeKeepingComments(path, decls) {
  const node = path.node;
  const leading = (node.comments ?? []).filter(
    (/** @type {any} */ c) => c.leading !== false,
  );
  if (leading.length > 0) {
    decls[0].comments = [...leading, ...(decls[0].comments ?? [])];
    node.comments = (node.comments ?? []).filter(
      (/** @type {any} */ c) => !leading.includes(c),
    );
  }
  path.insertBefore(...decls);
}

/**
 * Replace a declaration with `decls` by reusing its node for the last one, so
 * recast keeps it in place without inventing blank lines around it.
 *
 * @param {any} path
 * @param {any[]} decls
 * @param {"importKind" | "exportKind"} kindKey
 */
function reuseNode(path, decls, kindKey) {
  const node = path.node;
  const last = decls[decls.length - 1];
  const before = decls.slice(0, -1);
  const own = node.comments ?? [];
  node.specifiers = last.specifiers;
  node.source = last.source;
  node[kindKey] = last[kindKey] ?? "value";
  if (before.length > 0) {
    node.comments = last.comments ?? [];
    before[0].comments = [...own, ...(before[0].comments ?? [])];
    path.insertBefore(...before);
  } else {
    node.comments = [...own, ...(last.comments ?? [])];
  }
}

/** @param {any} entry a local-module export */
const isRemovedType = (entry) => entry?.kind === "type" && entry.removed === true;

/**
 * Remove a top-level statement, handing its comments (TODOs included) to the
 * statement after it, or before it when it was the last.
 *
 * @param {any} j
 * @param {any} root
 * @param {any} path
 */
function pruneKeepingComments(j, root, path) {
  const node = path.node;
  const comments = node.comments ?? [];
  const body = root.find(j.Program).get().node.body;
  const index = body.indexOf(node);
  path.prune();
  if (comments.length === 0 || index === -1) return;
  const next = body[index];
  if (next) {
    next.comments = [...comments, ...(next.comments ?? [])];
    return;
  }
  const previous = body[index - 1];
  if (previous) {
    previous.comments = [
      ...(previous.comments ?? []),
      ...comments.map((/** @type {any} */ c) => ({
        ...c,
        leading: false,
        trailing: true,
      })),
    ];
    return;
  }
  keepCommentsInEmptyModule(j, root.find(j.Program).get().node, comments);
}

/**
 * A module the codemod emptied keeps its TODOs on an `export {};`, which also
 * keeps it a module.
 *
 * @param {any} j
 * @param {any} program
 * @param {any[]} comments
 */
function keepCommentsInEmptyModule(j, program, comments) {
  const decl = j.exportNamedDeclaration(null, []);
  decl.comments = comments.map((/** @type {any} */ c) => ({
    ...c,
    leading: true,
    trailing: false,
  }));
  program.body.push(decl);
}

/**
 * A removed 0.1 type with no Astryx counterpart loses its import. A local
 * re-export of it (`import type { X } from …; export type { X };`) goes too,
 * the same way a re-export straight from ui-common does: left behind it names
 * nothing, and the file no longer parses. No placeholder type is declared in
 * its place: an `unknown` alias would keep every importer compiling against a
 * type that no longer exists. The TODO goes on the export, or where it stood.
 *
 * @param {any} j
 * @param {any} root
 * @param {Map<string, {imported: string, component: string}>} dropped
 * @param {any} programScope
 */
function dropLocalReexports(j, root, dropped, programScope) {
  root.find(j.ExportNamedDeclaration).forEach((/** @type {any} */ path) => {
    const node = path.node;
    if (node.source || node.declaration) return;
    const specifiers = node.specifiers ?? [];
    const gone = specifiers.filter(
      (/** @type {any} */ s) =>
        s.local?.name &&
        dropped.has(s.local.name) &&
        isModuleBinding(path, s.local.name, programScope),
    );
    if (gone.length === 0) return;
    const names = gone.map((/** @type {any} */ s) => s.exported?.name ?? s.local.name);
    const components = [
      ...new Set(
        gone.map((/** @type {any} */ s) => dropped.get(s.local.name)?.component),
      ),
    ];
    const message = `${names.join(", ")} (removed with ${components.join(", ")} in 0.2, no Astryx counterpart) ${names.length === 1 ? "is" : "are"} no longer re-exported from here; modules importing ${names.length === 1 ? "it" : "them"} from here need a type of their own.`;
    const rest = specifiers.filter((/** @type {any} */ s) => !gone.includes(s));
    if (rest.length > 0) {
      node.specifiers = rest;
      addTodo(j, path, message);
      return;
    }
    node.comments = [
      ...(node.comments ?? []),
      j.commentLine(` ${TODO_TAG}: ${message}`, true, false),
    ];
    pruneKeepingComments(j, root, path);
  });
}

/**
 * @param {{source: string, path: string}} file
 * @param {{jscodeshift: any}} api
 * @param {{flags: {packages: Map<string, string>, touched: Set<string>}}} ctx
 */
export default function transform(file, api, ctx) {
  const direct = file.source.includes(UIC);
  const viaLocal = importsLocalLegacy(api.jscodeshift, ctx, file.path, file.source);
  if (!direct && !viaLocal) return undefined;
  const j = api.jscodeshift;
  // Registers the wrappers this module defines, for the report.
  if (direct && ctx.source) localExports(j, ctx, file.path);
  const root = j(file.source);
  const isTS = /\.[cm]?tsx?$/.test(file.path);
  const taken = takenNames(j, root);
  const programScope = root.find(j.Program).get().scope;
  let touched = false;

  /**
   * The local name for an import of `target` that replaces `local`: the
   * target itself when nothing in any scope of the file uses it, else a
   * `Uic`-prefixed alias that is free.
   *
   * @param {string} target
   */
  const localFor = (target) =>
    freeName(taken, taken.has(target) ? [`Uic${target}`] : [target]);

  /** @type {Map<string, string>} */
  const renames = new Map();
  /** @type {Map<string, {component: string, entry: any, local: string, jsxCount: number, valueRefs: number, add: any}>} */
  const bindings = new Map();
  /** @type {Array<{path: any, keep: any[], adds: any[], pruned?: boolean}>} */
  const plans = [];
  /** @type {any[]} */
  const extra = [];
  /**
   * Local bindings of removed 0.1 types whose import was dropped: a local
   * `export type { X }` of one goes with it (see dropLocalReexports).
   *
   * @type {Map<string, {imported: string, component: string}>}
   */
  const droppedTypes = new Map();

  /**
   * The local name to use for `name` from `@lablup/ui-common/<subpath>`,
   * importing it if nothing does yet.
   *
   * @param {string} name
   * @param {string} subpath
   */
  const ensureImport = (name, subpath) => {
    const source = `${UIC}/${subpath}`;
    for (const plan of plans) {
      const hit = plan.adds.find(
        (a) => a.source === source && a.imported === name && a.kind === "value",
      );
      if (hit) {
        hit.used = true;
        return hit.local;
      }
    }
    const existing = extra.find((a) => a.source === source && a.imported === name);
    if (existing) return existing.local;
    const local = localFor(name);
    extra.push({ source, kind: "value", imported: name, local });
    return local;
  };

  /**
   * An import from a project module that hands 0.1 components on (a barrel
   * the codemod rewrites under the 0.1 names): its components get the same
   * element rewrite as a direct import, and the import itself stays. Its
   * removed types go, as from ui-common. A wrapper's import is only counted.
   *
   * @param {any} path
   * @param {string} source
   */
  const localImport = (path, source) => {
    const target = ctx.resolveImport?.(file.path, source);
    const entries = target ? localExports(j, ctx, target) : null;
    if (!entries || entries.size === 0) return;
    const declIsType = path.node.importKind === "type";
    const kept = [];
    for (const spec of path.node.specifiers ?? []) {
      const name =
        spec.type === "ImportSpecifier"
          ? spec.imported.name
          : spec.type === "ImportDefaultSpecifier"
            ? "default"
            : null;
      const entry = name == null ? undefined : entries.get(name);
      if (entry?.kind === "type" && entry.removed) {
        touched = true;
        addTodo(
          j,
          path,
          `type ${entry.type} was removed with ${entry.component} in 0.2 and has no Astryx counterpart; ${source} no longer exports it.`,
        );
        droppedTypes.set(spec.local.name, {
          imported: entry.type,
          component: entry.component,
        });
        continue;
      }
      kept.push(spec);
      if (entry?.kind === "wrapper") registerWrapper(ctx, entry, file.path);
      if (entry?.kind !== "component") continue;
      if (declIsType || spec.importKind === "type") continue;
      touched = true;
      ctx.flags.touched.add(entry.component);
      bindings.set(spec.local.name, {
        component: entry.component,
        entry: REMOVED.get(entry.component),
        local: spec.local.name,
        jsxCount: 0,
        valueRefs: 0,
        add: null,
        via: path,
      });
    }
    if (kept.length > 0) path.node.specifiers = kept;
    else pruneKeepingComments(j, root, path);
  };

  root.find(j.ImportDeclaration).forEach((/** @type {any} */ path) => {
    const source = path.node.source.value;
    const from = typeof source === "string" ? classify(source) : null;
    if (!from) {
      if (viaLocal && typeof source === "string") localImport(path, source);
      return;
    }
    const specifiers = path.node.specifiers ?? [];
    if (specifiers.length === 0) return;
    const declIsType = path.node.importKind === "type";
    const keep = [];
    const adds = [];
    for (const spec of specifiers) {
      if (spec.type === "ImportNamespaceSpecifier") {
        keep.push(spec);
        addTodo(
          j,
          path,
          `namespace import of ${source}: in 0.2 Badge, Button, Select, Tabs and the other removed 0.1 components are Astryx's (or gone). Rewrite the ${spec.local.name}.X uses by hand.`,
        );
        touched = true;
        continue;
      }
      const imported =
        spec.type === "ImportDefaultSpecifier"
          ? from.kind === "component"
            ? from.dir
            : null
          : spec.imported.name;
      if (imported == null) {
        keep.push(spec);
        continue;
      }
      const local = spec.local?.name ?? imported;
      const kind = declIsType || spec.importKind === "type" ? "type" : "value";
      const resolved = resolveName(imported, from);

      if (resolved.action === "keep") {
        if (spec.type === "ImportDefaultSpecifier") {
          adds.push({ source, kind, imported, local });
          touched = true;
        } else {
          keep.push(spec);
        }
        continue;
      }
      touched = true;
      if (resolved.action === "move") {
        adds.push({ source: resolved.source, kind, imported, local });
        continue;
      }
      if (resolved.action === "component") {
        const entry = resolved.entry;
        let finalLocal = local;
        if (local === imported && entry.to !== local) {
          finalLocal = localFor(entry.to);
          renames.set(local, finalLocal);
        }
        const add = {
          source: `${UIC}/${entry.subpath}`,
          kind,
          imported: entry.to,
          local: finalLocal,
        };
        adds.push(add);
        ctx.flags.touched.add(imported);
        if (kind === "value") {
          bindings.set(local, {
            component: imported,
            entry,
            local: finalLocal,
            jsxCount: 0,
            valueRefs: 0,
            add,
          });
        }
        for (const [name, range] of Object.entries(entry.requiresPackages)) {
          ctx.flags.packages.set(name, range);
        }
        continue;
      }
      // A 0.1 type.
      if (resolved.to == null) {
        addTodo(
          j,
          path,
          `type ${imported} was removed with ${resolved.component} in 0.2 and has no Astryx counterpart.`,
        );
        droppedTypes.set(local, { imported, component: resolved.component });
        continue;
      }
      let finalLocal = local;
      if (local === imported && resolved.to !== local) {
        finalLocal = localFor(resolved.to);
        renames.set(local, finalLocal);
      }
      adds.push({
        source: `${UIC}/${REMOVED.get(resolved.component).subpath}`,
        kind: "type",
        imported: resolved.to,
        local: finalLocal,
      });
    }
    plans.push({ path, keep, adds });
  });

  /**
   * A type re-export from a project module (`export type { X }` from `./DataTable`)
   * of a type that module no longer exports (its own import of X from ui-common
   * was dropped): drop it too.
   *
   * @param {any} path
   * @param {string} source
   */
  const localReexport = (path, source) => {
    const target = ctx.resolveImport?.(file.path, source);
    const entries = target ? localExports(j, ctx, target) : null;
    if (!entries || entries.size === 0) return;
    const specifiers = path.node.specifiers ?? [];
    const gone = specifiers.filter(
      (/** @type {any} */ s) =>
        s.type === "ExportSpecifier" && isRemovedType(entries.get(s.local?.name)),
    );
    if (gone.length === 0) return;
    touched = true;
    const names = gone.map((/** @type {any} */ s) => s.exported.name);
    const message = `${names.join(", ")} ${names.length === 1 ? "is" : "are"} no longer re-exported: ${source} does not export ${names.length === 1 ? "it" : "them"} any more (removed in 0.2, no Astryx counterpart).`;
    const rest = specifiers.filter((/** @type {any} */ s) => !gone.includes(s));
    if (rest.length > 0) {
      path.node.specifiers = rest;
      addTodo(j, path, message);
    } else {
      path.node.comments = [
        ...(path.node.comments ?? []),
        j.commentLine(` ${TODO_TAG}: ${message}`, true, false),
      ];
      pruneKeepingComments(j, root, path);
    }
  };

  // Re-exports: `export { Select } from "@lablup/ui-common"` keeps its name.
  root.find(j.ExportNamedDeclaration).forEach((/** @type {any} */ path) => {
    const source = path.node.source?.value;
    const from = typeof source === "string" ? classify(source) : null;
    if (!from) {
      if (viaLocal && typeof source === "string") localReexport(path, source);
      return;
    }
    const declIsType = path.node.exportKind === "type";
    const keep = [];
    /** @type {Map<string, any[]>} */
    const moved = new Map();
    let reexportedComponent = false;
    let droppedSpecs = 0;
    for (const spec of path.node.specifiers ?? []) {
      const localName = spec.local?.name ?? spec.exported.name;
      const imported =
        localName === "default" && from.kind === "component" ? from.dir : localName;
      const exported = spec.exported.name;
      const kind = declIsType || spec.exportKind === "type" ? "type" : "value";
      const resolved = resolveName(imported, from);
      let target = null;
      let targetSource = null;
      if (resolved.action === "move") {
        target = imported;
        targetSource = resolved.source;
      } else if (resolved.action === "component") {
        target = resolved.entry.to;
        targetSource = `${UIC}/${resolved.entry.subpath}`;
        reexportedComponent = true;
        for (const [name, range] of Object.entries(resolved.entry.requiresPackages)) {
          ctx.flags.packages.set(name, range);
        }
      } else if (resolved.action === "type") {
        if (resolved.to == null) {
          addTodo(
            j,
            path,
            `type ${imported} was removed with ${resolved.component} in 0.2 and has no Astryx counterpart.`,
          );
          touched = true;
          droppedSpecs++;
          continue;
        }
        target = resolved.to;
        targetSource = `${UIC}/${REMOVED.get(resolved.component).subpath}`;
      } else if (localName === "default" && from.kind === "component") {
        target = imported;
        targetSource = source;
      }
      if (target == null || targetSource == null) {
        keep.push(spec);
        continue;
      }
      touched = true;
      const key = `${kind}\u0000${targetSource}`;
      const list = moved.get(key) ?? [];
      list.push(
        j.exportSpecifier.from({
          local: j.identifier(target),
          exported: j.identifier(exported),
        }),
      );
      moved.set(key, list);
    }
    if (moved.size === 0) {
      // Only removed types: they go, and the TODO stays where they stood.
      if (droppedSpecs === 0) return;
      if (keep.length > 0) path.node.specifiers = keep;
      else pruneKeepingComments(j, root, path);
      return;
    }
    const decls = [...moved.entries()].map(([key, specs]) => {
      const [kind, targetSource] = key.split("\u0000");
      const decl = j.exportNamedDeclaration(null, specs, j.stringLiteral(targetSource));
      if (kind === "type") decl.exportKind = "type";
      return decl;
    });
    if (reexportedComponent) {
      decls[0].comments = [
        j.commentLine(
          " TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.",
          true,
          false,
        ),
      ];
    }
    if (keep.length > 0) {
      path.node.specifiers = keep;
      insertBeforeKeepingComments(path, decls);
    } else {
      reuseNode(path, decls, "exportKind");
    }
  });

  if (droppedTypes.size > 0) dropLocalReexports(j, root, droppedTypes, programScope);

  root.find(j.ExportAllDeclaration).forEach((/** @type {any} */ path) => {
    const source = path.node.source?.value;
    if (typeof source !== "string" || !classify(source)) return;
    touched = true;
    addTodo(
      j,
      path,
      `\`export *\` from ${source} now re-exports Astryx's Badge, Button, Tooltip, … under the 0.1 names. The upgrade migrated the elements of them in the modules it scanned that import them from here; any other importer still passes 0.1 props.`,
    );
  });

  // Dynamic imports of a removed component's subpath.
  root.find(j.CallExpression).forEach((/** @type {any} */ path) => {
    const node = path.node;
    const isDynamic = node.callee.type === "Import";
    const isRequire =
      node.callee.type === "Identifier" && node.callee.name === "require";
    if (!isDynamic && !isRequire) return;
    const arg = node.arguments[0];
    const source = arg?.value;
    if (typeof source !== "string") return;
    const from = classify(source);
    if (from?.kind === "component" && REMOVED.has(from.dir)) {
      touched = true;
      addTodo(
        j,
        path,
        `${source} is gone in 0.2; ${from.dir} is Astryx's ${REMOVED.get(from.dir).to} at ${UIC}/${REMOVED.get(from.dir).subpath}.`,
      );
    }
  });

  if (!touched) return undefined;

  // Elements.
  const spelled = new Set([...identifierNames(j, root), ...taken]);
  for (const [local, binding] of bindings) {
    const transformElement = /** @type {Record<string, any>} */ (ELEMENT_TRANSFORMS)[
      binding.component
    ];
    root.findJSXElements(local).forEach((/** @type {any} */ path) => {
      // A local component that shadows the import is not ui-common's.
      if (!isModuleBinding(path, local, programScope)) return;
      const el = path.node;
      let tag = null;
      /** @type {import('./elements.mjs').Helpers} */
      const helpers = {
        j,
        path,
        el,
        isTS,
        removed: binding.entry,
        todo: (message) => addTodo(j, path, message),
        ensureImport,
        setTag: (name) => {
          tag = name;
        },
        freeName: (candidates) => freeName(spelled, candidates),
      };
      if (hasSpread(el)) {
        addTodo(
          j,
          path,
          `props spread into <${tagName(el)}> are not migrated; check them against Astryx ${binding.entry.to}'s props.`,
        );
      }
      transformElement?.(helpers);
      if (tag) renameElement(el, tag);
      else binding.jsxCount++;
    });
    root.find(j.Identifier, { name: local }).forEach((/** @type {any} */ path) => {
      if (path.node.type === "JSXIdentifier" || !isReference(path)) return;
      if (!isModuleBinding(path, local, programScope)) return;
      const parent = path.parent?.node;
      if (parent?.type === "TSTypeQuery" || parent?.type === "TSTypeReference") return;
      binding.valueRefs++;
      addTodo(
        j,
        path,
        `${local} is used as a value here; props passed to it this way are not migrated to Astryx ${binding.entry.to}.`,
      );
    });
  }

  // A local-barrel import whose every element became another component
  // (Button → IconButton) is unused now.
  for (const [local, binding] of bindings) {
    if (!binding.via || binding.via.pruned) continue;
    let used = false;
    root.findJSXElements(local).forEach((/** @type {any} */ p) => {
      if (isModuleBinding(p, local, programScope)) used = true;
    });
    root.find(j.Identifier, { name: local }).forEach((/** @type {any} */ p) => {
      if (p.node.type === "JSXIdentifier" || !isReference(p)) return;
      if (isModuleBinding(p, local, programScope)) used = true;
    });
    if (used) continue;
    const node = binding.via.node;
    node.specifiers = (node.specifiers ?? []).filter(
      (/** @type {any} */ s) => s.local?.name !== local,
    );
    if (node.specifiers.length === 0) {
      pruneKeepingComments(j, root, binding.via);
      binding.via.pruned = true;
    }
  }

  for (const [from, to] of renames) renameReferences(j, root, from, to, programScope);

  // Imports: the planned moves, minus a Card import every BaseCard outgrew.
  const unused = new Set(
    [...bindings.values()]
      .filter(
        (b) =>
          b.add != null &&
          b.component === "BaseCard" &&
          b.jsxCount === 0 &&
          b.valueRefs === 0 &&
          !b.add.used,
      )
      .map((b) => b.add),
  );
  for (const plan of plans) {
    const adds = plan.adds.filter((a) => !unused.has(a));
    const decls = buildImports(j, adds);
    const node = plan.path.node;
    if (plan.keep.length > 0) {
      node.specifiers = plan.keep;
      if (decls.length > 0) insertBeforeKeepingComments(plan.path, decls);
    } else if (decls.length > 0) {
      reuseNode(plan.path, decls, "importKind");
    } else {
      const comments = node.comments;
      plan.path.prune();
      plan.pruned = true;
      if (comments?.length) {
        const program = root.find(j.Program).get().node;
        const first = program.body[0];
        if (first) first.comments = [...comments, ...(first.comments ?? [])];
        else keepCommentsInEmptyModule(j, program, comments);
      }
    }
  }
  if (extra.length > 0) {
    // Imports a rewrite needed that no 0.1 import mapped to (EmptyState's
    // actions render a Button): after the last rewritten import.
    const anchor = plans.find((plan) => !plan.pruned);
    const decls = buildImports(j, extra);
    if (anchor) anchor.path.insertAfter(...decls);
    else
      root
        .find(j.Program)
        .get()
        .node.body.unshift(...decls);
  }

  const out = root.toSource({ quote: detectQuote(file.source) });
  return file.source.endsWith("\n") && !out.endsWith("\n") ? `${out}\n` : out;
}
