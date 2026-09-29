/**
 * The project's own modules that hand ui-common 0.1 components on: barrels
 * (`export { Button } from "@lablup/ui-common/components/Button"`,
 * `export * from …`, an import then `export { … }`, `export const X = Y`) and
 * wrappers (an exported component that renders one).
 *
 * The components codemod rewrites such a barrel in place and keeps the 0.1
 * public name, so an import of `Select` from the barrel (`@/components/common`) now gets
 * Astryx's Selector. Its call sites still pass 0.1 props: this module tells
 * the codemod which local imports stand for which 0.1 component, so the same
 * element rewrite runs on them. A wrapper is not a re-export: its props are
 * its own, so its call sites are left alone and the wrapper is reported.
 *
 * Every module is read as it was before this run (the barrel itself is being
 * rewritten), through the runner's `ctx.source` and `ctx.resolveImport`.
 */
import { REMOVED, REMOVED_TYPES, UIC } from "./map.mjs";

/**
 * @typedef {{kind: 'component', component: string}
 *   | {kind: 'type', component: string, type: string, removed: boolean}
 *   | {kind: 'wrapper', components: string[], file: string, line: number, name: string}} LocalExport
 *
 * @typedef {object} LocalModuleContext
 * @property {(path: string) => string | null} [source] a file's content before this run
 * @property {(from: string, specifier: string) => string | null} [resolveImport]
 */

/** @type {WeakMap<object, {modules: Map<string, Map<string, LocalExport>>, wrappers: Map<string, {def: LocalExport & {kind: 'wrapper'}, importers: Set<string>}>}>} */
const caches = new WeakMap();

/** @param {object} ctx */
function cacheFor(ctx) {
  let cache = caches.get(ctx);
  if (!cache) {
    cache = { modules: new Map(), wrappers: new Map() };
    caches.set(ctx, cache);
  }
  return cache;
}

/**
 * What a ui-common specifier's name stands for in 0.1.
 *
 * @param {string} source
 * @param {string} name imported name (`default` for a default import)
 * @returns {LocalExport | null}
 */
function uicName(source, name) {
  let imported = name;
  if (source !== UIC) {
    const match = /^@lablup\/ui-common\/components\/([A-Za-z]+)$/.exec(source);
    if (!match) return null;
    if (name === "default") imported = match[1];
  }
  if (REMOVED.has(imported)) return { kind: "component", component: imported };
  const type = REMOVED_TYPES.get(imported);
  if (type)
    return {
      kind: "type",
      component: type.component,
      type: imported,
      removed: type.to == null,
    };
  return null;
}

/**
 * Every removed name a ui-common specifier offers, for `export *`.
 *
 * @param {string} source
 * @returns {Map<string, LocalExport>}
 */
function uicStar(source) {
  /** @type {Map<string, LocalExport>} */
  const out = new Map();
  const match = /^@lablup\/ui-common\/components\/([A-Za-z]+)$/.exec(source);
  if (source !== UIC && !match) return out;
  for (const [name, removed] of REMOVED) {
    if (match && name !== match[1]) continue;
    out.set(name, { kind: "component", component: name });
    for (const [type, to] of Object.entries(removed.types)) {
      out.set(type, { kind: "type", component: name, type, removed: to == null });
    }
  }
  return out;
}

/** @param {string} source */
const isUic = (source) => source === UIC || source.startsWith(`${UIC}/components/`);

/**
 * Import sources a file names, without parsing it.
 *
 * @param {string} source
 */
function importSources(source) {
  const out = new Set();
  for (const m of source.matchAll(/\b(?:from|import)\s*["']([^"']+)["']/g))
    out.add(m[1]);
  return out;
}

/** Strip parentheses and TS casts. @param {any} node */
function unwrap(node) {
  let n = node;
  while (
    n &&
    (n.type === "TSAsExpression" ||
      n.type === "TSSatisfiesExpression" ||
      n.type === "TSNonNullExpression" ||
      n.type === "ParenthesizedExpression")
  )
    n = n.expression;
  return n;
}

/**
 * The function a component declaration defines: a function declaration, or
 * the function a `const` holds, through `forwardRef(…)` / `memo(…)`, or the
 * declaration `memo(Name)` names.
 *
 * @param {any} decl
 * @param {Map<string, any>} [declarations] the module's top-level declarations
 * @param {number} [depth]
 */
function componentFunction(decl, declarations = new Map(), depth = 0) {
  if (decl.type === "FunctionDeclaration") return decl;
  let init = decl.type === "VariableDeclarator" ? unwrap(decl.init) : null;
  while (init?.type === "CallExpression") {
    init = unwrap(
      init.arguments.find(
        (/** @type {any} */ a) =>
          a.type === "ArrowFunctionExpression" ||
          a.type === "FunctionExpression" ||
          a.type === "CallExpression" ||
          a.type === "Identifier",
      ),
    );
  }
  // `memo(EmptyStateComponent)`: the component is declared on its own.
  if (init?.type === "Identifier" && depth < 3) {
    const target = declarations.get(init.name);
    return target ? componentFunction(target, declarations, depth + 1) : null;
  }
  return init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression"
    ? init
    : null;
}

/**
 * The names a component's props parameter binds: the props object, or each
 * destructured prop and the rest.
 *
 * @param {any} param
 * @returns {Set<string>}
 */
function paramNames(param) {
  const out = new Set();
  const p = param?.type === "AssignmentPattern" ? param.left : param;
  if (p?.type === "Identifier") out.add(p.name);
  else if (p?.type === "ObjectPattern") {
    for (const prop of p.properties) {
      if (prop.type === "RestElement" && prop.argument.type === "Identifier")
        out.add(prop.argument.name);
      else if (prop.value?.type === "Identifier") out.add(prop.value.name);
      else if (
        prop.value?.type === "AssignmentPattern" &&
        prop.value.left.type === "Identifier"
      )
        out.add(prop.value.left.name);
    }
  }
  return out;
}

/**
 * The 0.1 components (and removed types) a project module exports, by
 * exported name. Empty for a module that hands on none.
 *
 * @param {any} j jscodeshift
 * @param {LocalModuleContext} ctx
 * @param {string} file absolute
 * @param {Set<string>} [stack] modules being read, against cycles
 * @returns {Map<string, LocalExport>}
 */
export function localExports(j, ctx, file, stack = new Set()) {
  const cache = cacheFor(ctx);
  const hit = cache.modules.get(file);
  if (hit) return hit;
  /** @type {Map<string, LocalExport>} */
  const out = new Map();
  const source = ctx.source?.(file);
  if (source == null || stack.has(file) || !/\bexport\b/.test(source)) {
    if (!stack.has(file)) cache.modules.set(file, out);
    return out;
  }
  // Cheap bail-out: nothing from ui-common, directly or through another module.
  const sources = [...importSources(source)];
  if (!sources.some((s) => isUic(s) || !/^[\w@]/.test(s) || s.startsWith("@/"))) {
    cache.modules.set(file, out);
    return out;
  }
  stack.add(file);
  let root;
  try {
    // Parse by the module's own extension, not the importer's.
    const parser = /\.[cm]?tsx?$/.test(file) ? "tsx" : "babel";
    root = (typeof j.withParser === "function" ? j.withParser(parser) : j)(source);
  } catch {
    stack.delete(file);
    cache.modules.set(file, out);
    return out;
  }

  /** @param {string} specifier */
  const moduleExports = (specifier) => {
    const target = ctx.resolveImport?.(file, specifier);
    return target ? localExports(j, ctx, target, stack) : new Map();
  };

  // Local bindings that stand for a 0.1 component or type.
  /** @type {Map<string, LocalExport>} */
  const bindings = new Map();
  root.find(j.ImportDeclaration).forEach((/** @type {any} */ path) => {
    const from = path.node.source.value;
    if (typeof from !== "string") return;
    for (const spec of path.node.specifiers ?? []) {
      if (spec.type === "ImportNamespaceSpecifier") continue;
      const name =
        spec.type === "ImportDefaultSpecifier" ? "default" : spec.imported.name;
      const entry = isUic(from) ? uicName(from, name) : moduleExports(from).get(name);
      if (entry) bindings.set(spec.local.name, entry);
    }
  });

  // Top-level declarations, for `export { X }` of a local and for wrappers.
  /** @type {Map<string, any>} */
  const declarations = new Map();
  /** @type {Map<string, any>} */
  const typeDeclarations = new Map();
  for (const statement of root.find(j.Program).get().node.body) {
    const node =
      statement.type === "ExportNamedDeclaration" ||
      statement.type === "ExportDefaultDeclaration"
        ? statement.declaration
        : statement;
    if (!node) continue;
    if (
      (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") &&
      node.id
    ) {
      declarations.set(node.id.name, node);
    } else if (node.type === "VariableDeclaration") {
      for (const d of node.declarations) {
        if (d.id?.type === "Identifier") declarations.set(d.id.name, d);
      }
    } else if (
      (node.type === "TSInterfaceDeclaration" ||
        node.type === "TSTypeAliasDeclaration") &&
      node.id
    ) {
      typeDeclarations.set(node.id.name, node);
    }
  }

  /**
   * The 0.1 components whose props type a props parameter's type is built
   * on: `SelectProps`, `Omit<DataTableProps<T>, …>`, an intersection with
   * one, or a local interface or type alias that extends or aliases one.
   *
   * @param {any} param
   * @returns {Set<string>}
   */
  const propsTypeComponents = (param) => {
    const out = new Set();
    const seen = new Set();
    const WRAPPING = new Set(["Omit", "Partial", "Pick", "Readonly", "Required"]);
    /**
     * @param {string} name
     * @param {any} args type arguments
     */
    const reference = (name, args) => {
      const bound = bindings.get(name);
      if (bound?.kind === "type" && /Props$/.test(bound.type)) out.add(bound.component);
      if (WRAPPING.has(name)) visit(args?.params?.[0]);
      const local = typeDeclarations.get(name);
      if (local && !seen.has(name)) {
        seen.add(name);
        if (local.type === "TSTypeAliasDeclaration") visit(local.typeAnnotation);
        for (const heritage of local.extends ?? []) {
          const id = heritage.expression;
          if (id?.type === "Identifier")
            reference(id.name, heritage.typeParameters ?? heritage.typeArguments);
        }
      }
    };
    /** Only what the props type is made of, not the types of its members. @param {any} t */
    const visit = (t) => {
      if (!t) return;
      switch (t.type) {
        case "TSTypeAnnotation":
        case "TSParenthesizedType":
          visit(t.typeAnnotation);
          break;
        case "TSIntersectionType":
        case "TSUnionType":
          t.types.forEach(visit);
          break;
        case "TSTypeReference":
          if (t.typeName?.type === "Identifier")
            reference(t.typeName.name, t.typeParameters ?? t.typeArguments);
          break;
        default:
      }
    };
    const p = param?.type === "AssignmentPattern" ? param.left : param;
    visit(p?.typeAnnotation);
    return out;
  };

  /**
   * What exporting local `name` hands on: an aliased 0.1 binding, or a
   * wrapper that renders one.
   *
   * @param {string} name
   * @param {string} exported
   * @returns {LocalExport | null}
   */
  const describeLocal = (name, exported) => {
    const bound = bindings.get(name);
    if (bound) return bound;
    const decl = declarations.get(name);
    if (!decl) return null;
    if (decl.type === "VariableDeclarator" && decl.init?.type === "Identifier") {
      return bindings.get(decl.init.name) ?? describeLocal(decl.init.name, exported);
    }
    const fn = componentFunction(decl, declarations);
    if (!fn) return null;
    const params = paramNames(fn.params[0]);
    // Its callers pass 0.1 props when its props type is built on a 0.1 one…
    const typed = propsTypeComponents(fn.params[0]);
    /** @param {any} expression */
    const fromParams = (expression) => {
      const e = unwrap(expression);
      return e?.type === "Identifier" && params.has(e.name);
    };
    const rendered = new Set();
    j(fn)
      .find(j.JSXElement)
      .forEach((/** @type {any} */ p) => {
        const tag = p.node.openingElement.name;
        if (tag.type !== "JSXIdentifier") return;
        const entry = bindings.get(tag.name);
        const components =
          entry?.kind === "component"
            ? [entry.component]
            : entry?.kind === "wrapper"
              ? entry.components
              : [];
        if (components.length === 0) return;
        // …or when it spreads its own props (or their rest) into one.
        const spreads = (p.node.openingElement.attributes ?? []).some(
          (/** @type {any} */ a) =>
            a.type === "JSXSpreadAttribute" && fromParams(a.argument),
        );
        if (spreads || components.some((c) => typed.has(c)))
          for (const c of components) rendered.add(c);
      });
    if (rendered.size === 0) return null;
    return {
      kind: "wrapper",
      components: [...rendered].sort(),
      file,
      line:
        decl.loc?.start.line ??
        (typeof decl.start === "number"
          ? source.slice(0, decl.start).split("\n").length
          : 0),
      name: exported === "default" ? name : exported,
    };
  };

  root.find(j.ExportNamedDeclaration).forEach((/** @type {any} */ path) => {
    const node = path.node;
    const from = node.source?.value;
    if (typeof from === "string") {
      const theirs = isUic(from) ? null : moduleExports(from);
      for (const spec of node.specifiers ?? []) {
        if (spec.type !== "ExportSpecifier") continue;
        const name = spec.local?.name ?? spec.exported.name;
        const entry = theirs ? theirs.get(name) : uicName(from, name);
        if (entry) out.set(spec.exported.name, entry);
      }
      return;
    }
    if (node.declaration) {
      const decl = node.declaration;
      const names =
        decl.type === "VariableDeclaration"
          ? decl.declarations
              .filter((/** @type {any} */ d) => d.id?.type === "Identifier")
              .map((/** @type {any} */ d) => d.id.name)
          : decl.id
            ? [decl.id.name]
            : [];
      for (const name of names) {
        const entry = describeLocal(name, name);
        if (entry) out.set(name, entry);
      }
      return;
    }
    for (const spec of node.specifiers ?? []) {
      if (spec.type !== "ExportSpecifier") continue;
      const entry = describeLocal(spec.local.name, spec.exported.name);
      if (entry) out.set(spec.exported.name, entry);
    }
  });

  root.find(j.ExportDefaultDeclaration).forEach((/** @type {any} */ path) => {
    const decl = path.node.declaration;
    let entry = null;
    if (decl.type === "Identifier") entry = describeLocal(decl.name, "default");
    else if (decl.id?.name) entry = describeLocal(decl.id.name, "default");
    if (entry) out.set("default", entry);
  });

  root.find(j.ExportAllDeclaration).forEach((/** @type {any} */ path) => {
    const from = path.node.source?.value;
    if (typeof from !== "string" || path.node.exported) return;
    const theirs = isUic(from) ? uicStar(from) : moduleExports(from);
    for (const [name, entry] of theirs) {
      if (name !== "default" && !out.has(name)) out.set(name, entry);
    }
  });

  stack.delete(file);
  cache.modules.set(file, out);
  for (const entry of out.values()) {
    if (entry.kind === "wrapper") registerWrapper(ctx, entry);
  }
  return out;
}

/**
 * @param {object} ctx
 * @param {LocalExport & {kind: 'wrapper'}} def
 * @param {string} [importer]
 */
export function registerWrapper(ctx, def, importer) {
  const { wrappers } = cacheFor(ctx);
  const key = `${def.file}\u0000${def.name}`;
  const known = wrappers.get(key) ?? { def, importers: new Set() };
  if (importer) known.importers.add(importer);
  wrappers.set(key, known);
}

/**
 * Whether a file imports anything from a project module that hands on a 0.1
 * component or type, without parsing the file itself.
 *
 * @param {any} j
 * @param {LocalModuleContext} ctx
 * @param {string} file
 * @param {string} source
 */
export function importsLocalLegacy(j, ctx, file, source) {
  if (!ctx.resolveImport) return false;
  for (const specifier of importSources(source)) {
    if (specifier.startsWith(UIC)) continue;
    const target = ctx.resolveImport(file, specifier);
    if (target && localExports(j, ctx, target).size > 0) return true;
  }
  return false;
}

/**
 * The wrappers the run met, for the report: one finding per wrapper.
 *
 * @param {object} ctx
 * @param {(file: string) => string} rel
 */
export function wrapperFindings(ctx, rel) {
  const cache = caches.get(ctx);
  if (!cache) return [];
  return [...cache.wrappers.values()]
    .sort((a, b) => a.def.file.localeCompare(b.def.file) || a.def.line - b.def.line)
    .map(({ def, importers }) => {
      const targets = def.components.map((c) => {
        const to = REMOVED.get(c)?.to;
        return to && to !== c ? `${c} (Astryx ${to})` : c;
      });
      return {
        category: "local-wrapper",
        file: rel(def.file),
        line: def.line,
        text: def.name,
        detail: `local wrapper around ${targets.join(", ")}: review its props.${importers.size > 0 ? ` Imported by ${importers.size} scanned module${importers.size === 1 ? "" : "s"}, whose props were not migrated.` : ""}`,
      };
    });
}
