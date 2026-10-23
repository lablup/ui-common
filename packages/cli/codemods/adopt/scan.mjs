/**
 * `ui-common adopt` report-only scans. Nothing here edits a file: each
 * finding is a place where moving onto ui-common changes behaviour or
 * tooling in a way a person has to decide about.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

import { customExports } from "../../cli/paths.mjs";
import { ASTRYX_COMMANDS } from "../../cli/rewrite.mjs";
import {
  lineAt,
  lineTextAt,
  readText,
  relPath,
  SCRIPT_EXTENSIONS,
} from "../../cli/project.mjs";

/** @type {Record<string, {title: string, help: string}>} */
export const CATEGORIES = {
  unmirrored: {
    title: "`@astryxdesign/*` imports left in place",
    help: "ui-common has no mirror for these, or adopt could not move them. Replace each with a ui-common export (the detail says which), or keep Astryx for it on purpose. `adopt --check` and `ui-common doctor` fail while any is left.",
  },
  "dialog-ref": {
    title: "Dialog → Modal: refs",
    help: 'A `Modal` / `AlertModal` ref reaches the element with `role="dialog"`, not an `HTMLDialogElement`. Check each use: retype it, and drive the modal with `isOpen` / `onOpenChange` instead of `showModal()` / `close()`.',
  },
  patches: {
    title: "Local patches on Astryx",
    help: "A pnpm or patch-package patch on `@astryxdesign/*` applies only in this project, and ui-common's own copies of some components do not see it. Drop each patch ui-common's fork covers; for the rest decide whether the fix still matters on the Astryx version ui-common pins, and keep the patch at that version or drop it.",
  },
  portals: {
    title: "Overlays rendered into document.body",
    help: "While a `Modal` is open, every other child of `<body>` is `inert`. A toast viewport, notification area or debug overlay that must stay usable over a modal needs `MODAL_LIVE_ATTRIBUTE` (from `@lablup/ui-common/Modal`) on its root, and `refreshModalBackground()` if it mounts while a modal is open. Check in a real browser: jsdom ignores `inert`.",
  },
  hotkeys: {
    title: "Global keyboard shortcuts",
    help: "A document- or window-level shortcut still fires while a modal is open. Skip it while an element with `MODAL_OPEN_ATTRIBUTE` (from `@lablup/ui-common/Modal`) that is not `inert` exists.",
  },
  escape: {
    title: "Escape handlers of your own",
    help: "`Modal`, the `Drawer` and popovers close through one layer stack: one Escape closes the top layer only. A handler of yours that consumes Escape (inline edit, a search box) must call `event.preventDefault()`, or the stack closes the surrounding layer too.",
  },
  "agent-blocks": {
    title: "Astryx agent blocks, and tools anchored on them",
    help: "Replace each `<!-- ASTRYX:START -->` block with ui-common's: `ui-common agents --write <file>` adds the `UI-COMMON` block (keep your own lines outside its markers), then delete the ASTRYX block. A script or workflow that finds its place by the ASTRYX markers breaks when they go: point it at `<!-- UI-COMMON:END -->` or at your own marker.",
  },
  "astryx-cli": {
    title: "`astryx` CLI invocations",
    help: "`ui-common <command>` runs the Astryx CLI ui-common pins and rewrites its output to ui-common paths; `ui-common astryx <command>` runs it unrewritten. Switch each invocation, or keep `@astryxdesign/cli` as a devDependency at the version `@lablup/ui-common-cli` pins. `astryx theme build` keeps working either way (a recipe that imports ui-common components needs the `.css` stub in docs/adopting-from-astryx.md).",
  },
  "form-controls": {
    title: "Form controls: the field chrome moves to Form.Item",
    help: "ui-common's form controls (`TextInput`, `Selector`, `Switch`, …) are Astryx's wrapped for `Form.Item`, at the same names and paths. They take no `label`, `isLabelHidden`, `description`, `labelTooltip`, `labelIcon`, `isRequired`, `isOptional`, `isDisabled` or `statusVariant`, and `status` is a border only (`'error' | 'warning' | ''`). Inside a form, move each to the enclosing `Form.Item` (`label`, `extra`, `tooltip`, `rules`, `help`); on its own, name the control with `aria-label`. `isDisabled` becomes `disabled`. Check the new defaults too: `width=\"100%\"`, Selector `placement=\"below\"`, NumberInput clears to `null`.",
  },
  i18n: {
    title: "InternationalizationProvider without ui-common's strings",
    help: "ui-common's built-in strings resolve through Astryx's `InternationalizationProvider`. Merge `uiCommonMessages` (from `@lablup/ui-common/i18n-catalog`) into its `messages` with `mergeMessages`, or ui-common's components stay in English. Map your language codes to Astryx locale names (`ko` → `ko-KR`).",
  },
};

/**
 * @typedef {{category: string, file: string, line: number, text: string, detail?: string}} Finding
 */

/**
 * @param {string} category
 * @param {string} file
 * @param {string} text
 * @param {number} index
 * @param {string} [detail]
 * @returns {Finding}
 */
function at(category, file, text, index, detail) {
  return {
    category,
    file,
    line: lineAt(text, index),
    text: lineTextAt(text, index),
    detail,
  };
}

const ASTRYX_INVOCATION = new RegExp(
  String.raw`(^|[^\w@/.-])astryx\s+(${ASTRYX_COMMANDS.join("|")})\b`,
  "g",
);

/**
 * Findings in one file. `file` is project-relative, `text` its content after
 * the run.
 *
 * @param {string} file
 * @param {string} text
 * @param {{wrappers?: Set<string>}} [options] `wrappers`: ui-common's Form.Item-wrapped control names
 * @returns {Finding[]}
 */
export function scanFile(file, text, options = {}) {
  /** @type {Finding[]} */
  const out = [];
  const ext = extname(file);
  const name = basename(file);
  const script = SCRIPT_EXTENSIONS.has(ext);

  if (script) {
    const live = /MODAL_LIVE_ATTRIBUTE|data-uic-modal-live/.test(text);
    if (!live) {
      for (const m of text.matchAll(/\bcreatePortal\s*\(/g)) {
        const call = text.slice(m.index, (m.index ?? 0) + 600);
        if (/document\.body\b/.test(call))
          out.push(
            at("portals", file, text, m.index ?? 0, "a portal into document.body"),
          );
      }
      for (const m of text.matchAll(/<ToastViewport\b/g))
        out.push(
          at(
            "portals",
            file,
            text,
            m.index ?? 0,
            "Astryx's toast viewport does not mark itself live",
          ),
        );
      for (const m of text.matchAll(
        /document\.body\.(?:appendChild|append|prepend)\s*\(/g,
      )) {
        // A download link or a form appended, used and removed is not an overlay.
        const after = text.slice(m.index, (m.index ?? 0) + 400);
        if (
          /\.(?:click|submit)\s*\(\s*\)|removeChild\s*\(|\.remove\s*\(\s*\)/.test(after)
        )
          continue;
        out.push(
          at(
            "portals",
            file,
            text,
            m.index ?? 0,
            "an element appended to document.body",
          ),
        );
      }
    }
    if (!/MODAL_OPEN_ATTRIBUTE|data-uic-modal-open/.test(text)) {
      for (const m of text.matchAll(
        /\b(?:window|document(?:\.body)?|globalThis)\.addEventListener\s*\(\s*['"]key(?:down|up|press)['"]/g,
      ))
        out.push(at("hotkeys", file, text, m.index ?? 0));
      for (const m of text.matchAll(
        /\b(?:useHotkeys|useHotKeys|useKeyboardShortcut|Mousetrap\.bind|hotkeys)\s*\(/g,
      ))
        out.push(at("hotkeys", file, text, m.index ?? 0));
    }
    if (!/preventDefault\s*\(/.test(text)) {
      for (const m of text.matchAll(
        /\b(?:key|code)\s*===?\s*['"]Escape['"]|\bcase\s+['"]Escape['"]/g,
      ))
        out.push(
          at("escape", file, text, m.index ?? 0, "no preventDefault() in this module"),
        );
    }
    if (options.wrappers?.size)
      out.push(...scanFormControls(file, text, options.wrappers));
    if (
      /<InternationalizationProvider\b/.test(text) &&
      !/uiCommonMessages/i.test(text)
    ) {
      const m = /<InternationalizationProvider\b/.exec(text);
      out.push(at("i18n", file, text, m?.index ?? 0));
    }
  }

  if (/<!--\s*ASTRYX:START\s*-->/.test(text)) {
    const m = /<!--\s*ASTRYX:START\s*-->/.exec(text);
    out.push(
      at(
        "agent-blocks",
        file,
        text,
        m?.index ?? 0,
        /<!--\s*UI-COMMON:START\s*-->/.test(text)
          ? "the UI-COMMON block is there too: delete this one"
          : "an Astryx agent block",
      ),
    );
  } else if (/ASTRYX:(?:START|END)/.test(text) && !/\.mdx?$/.test(name)) {
    const m = /ASTRYX:(?:START|END)/.exec(text);
    out.push(
      at("agent-blocks", file, text, m?.index ?? 0, "anchors on the ASTRYX markers"),
    );
  }

  const invocations = name === "package.json" ? scriptsOf(text) : [{ text, offset: 0 }];
  if (name === "package.json" || /\.(ya?ml|sh|md|mdx|json)$/.test(name) || script) {
    for (const part of invocations) {
      for (const m of part.text.matchAll(ASTRYX_INVOCATION)) {
        const index = part.offset + (m.index ?? 0) + m[1].length;
        // `ui-common astryx …` is the raw passthrough, already through ui-common.
        if (/ui-common\s+$/.test(text.slice(Math.max(0, index - 12), index))) continue;
        if (script && !/['"`]/.test(lineTextAt(text, index))) continue;
        out.push(at("astryx-cli", file, text, index));
      }
    }
  }
  return out;
}

/** The `scripts` values of a package.json, with their offsets. */
function scriptsOf(/** @type {string} */ text) {
  const block = /"scripts"\s*:\s*\{[^}]*\}/.exec(text);
  return block ? [{ text: block[0], offset: block.index ?? 0 }] : [];
}

/** Astryx props ui-common's form-control wrappers do not take. */
const CHROME_PROPS = [
  "label",
  "isLabelHidden",
  "description",
  "labelTooltip",
  "labelIcon",
  "isRequired",
  "isOptional",
  "isDisabled",
  "statusVariant",
  "status",
];

/**
 * The names ui-common exports as Form.Item wrappers (exports.customs.json,
 * `wraps` on a `formControls/` source), from the ui-common being adopted.
 *
 * @param {string} root
 */
export function formControlWrappers(root) {
  return new Set(
    customExports(root)
      .filter(
        (/** @type {any} */ c) =>
          c.wraps != null && c.source.startsWith("formControls/"),
      )
      .map((c) => c.name),
  );
}

/**
 * Local names a module binds to ui-common's form-control wrappers.
 *
 * @param {string} text
 * @param {Set<string>} wrappers
 */
function wrapperBindings(text, wrappers) {
  /** @type {Map<string, string>} */
  const local = new Map();
  for (const m of text.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@lablup\/ui-common(?:\/([A-Za-z]+))?['"]/g,
  )) {
    for (const part of m[1].split(",")) {
      const named =
        /^\s*(?:type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*$/.exec(
          part,
        );
      if (!named || !wrappers.has(named[1])) continue;
      if (m[2] && m[2] !== named[1]) continue;
      local.set(named[2] ?? named[1], named[1]);
    }
  }
  return local;
}

/**
 * The attribute text of the JSX opening tag that starts at `start` (after
 * `<Name`), up to its closing `>` outside braces and strings.
 *
 * @param {string} text
 * @param {number} start
 */
function openingTag(text, start) {
  let depth = 0;
  /** @type {string | null} */
  let quote = null;
  for (let i = start; i < text.length && i < start + 4000; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return text.slice(start, i);
  }
  return text.slice(start, start + 4000);
}

/**
 * JSX of ui-common's form-control wrappers that passes the field chrome
 * Astryx's controls take and the wrappers do not.
 *
 * @param {string} file
 * @param {string} text
 * @param {Set<string>} wrappers
 * @returns {Finding[]}
 */
function scanFormControls(file, text, wrappers) {
  /** @type {Finding[]} */
  const out = [];
  const bindings = wrapperBindings(text, wrappers);
  if (bindings.size === 0) return out;
  const tag = new RegExp(`<(${[...bindings.keys()].join("|")})(?=[\\s/>])`, "g");
  const prop = new RegExp(
    `(?:^|[\\s}])(${CHROME_PROPS.join("|")})(?=\\s*=|[\\s/]|$)`,
    "g",
  );
  for (const m of text.matchAll(tag)) {
    const attrs = openingTag(text, (m.index ?? 0) + m[0].length);
    // Attribute names only: values (strings, expressions) become a space.
    let flat = "";
    let depth = 0;
    /** @type {string | null} */
    let quote = null;
    for (const c of attrs) {
      if (quote) {
        if (c === quote) quote = null;
      } else if (depth === 0 && (c === '"' || c === "'")) quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (depth === 0) {
        flat += c;
        continue;
      }
      flat += " ";
    }
    const props = [...new Set([...flat.matchAll(prop)].map((p) => p[1]))];
    if (props.length === 0) continue;
    out.push(
      at(
        "form-controls",
        file,
        text,
        m.index ?? 0,
        `${bindings.get(m[1])}: ${props.map((p) => `\`${p}\``).join(", ")}`,
      ),
    );
  }
  return out;
}

/**
 * The Astryx components ui-common renders from its own copy (its `forks/`),
 * so a local patch on Astryx's build of them does not reach the page. Read
 * from the ui-common being adopted; `lab` marks the lab ones.
 *
 * @param {string} root
 * @returns {Array<{name: string, pattern: RegExp}>}
 */
export function forkedComponents(root) {
  const lab = new Set(
    customExports(root)
      .filter((/** @type {any} */ c) => c.fork === "@astryxdesign/lab")
      .map((c) => c.name),
  );
  // src/ in a ui-common checkout (built or not), dist/ in the published package.
  const dir = ["src", "dist"]
    .map((d) => join(root, d, "forks"))
    .find((d) => existsSync(d));
  const names = dir
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : customExports(root)
        .filter((/** @type {any} */ c) => c.fork != null)
        .map((c) => c.name);
  return names.sort().map((name) => ({
    name: lab.has(name) ? `${name} (lab)` : name,
    pattern: new RegExp(`(?:^|/)${name}(?=[/.])`),
  }));
}

/**
 * Local patches on Astryx: pnpm `patchedDependencies` (pnpm-workspace.yaml or
 * package.json `pnpm`), and patch-package files under `patches/`.
 *
 * A pnpm patch keyed to a version other than the one ui-common pins comes
 * back `stale`: pnpm refuses to install with a patch nothing uses.
 *
 * @param {string} installDir the install root
 * @param {string} projectDir
 * @param {{forks?: Array<{name: string, pattern: RegExp}>, pins?: Record<string, string>}} [options]
 * @returns {Array<Finding & {stale?: {name: string, from: string, to: string}}>}
 */
export function scanPatches(installDir, projectDir, options = {}) {
  const forks = options.forks ?? [];
  const pins = options.pins ?? {};
  /** @type {Array<Finding & {stale?: {name: string, from: string, to: string}}>} */
  const out = [];
  /** @type {Set<string>} */
  const seen = new Set();
  const describe = (/** @type {string | null} */ patchText) => {
    if (!patchText) return "patch file not found";
    const files = [...patchText.matchAll(/^diff --git a\/(\S+)/gm)].map((m) => m[1]);
    const covered = forks
      .filter((f) => files.some((p) => f.pattern.test(p)))
      .map((f) => f.name);
    const touched =
      files.length > 0
        ? `touches ${files.slice(0, 4).join(", ")}${files.length > 4 ? ", …" : ""}`
        : "";
    return covered.length > 0
      ? `${touched}; ui-common ships its own ${covered.join(" and ")}, so this patch does not reach it: drop it unless the rest still matters`
      : `${touched}; not covered by a ui-common fork`;
  };
  const record = (
    /** @type {string} */ file,
    /** @type {string} */ text,
    /** @type {number} */ index,
    /** @type {string} */ patchPath,
    /** @type {string} */ key,
  ) => {
    const abs = join(installDir, patchPath);
    if (seen.has(abs)) return;
    seen.add(abs);
    const finding = at(
      "patches",
      relPath(projectDir, file),
      text,
      index,
      describe(readText(abs)),
    );
    const keyed = /^(@astryxdesign\/[^@]+)@(.+)$/.exec(key);
    const pin = keyed ? pins[keyed[1]] : undefined;
    if (keyed && pin && keyed[2] !== pin) {
      finding.detail = `${finding.detail}; keyed to ${keyed[2]}, not the ${pin} ui-common pins`;
      out.push({ ...finding, stale: { name: keyed[1], from: keyed[2], to: pin } });
      return;
    }
    out.push(finding);
  };
  const yamlFile = join(installDir, "pnpm-workspace.yaml");
  const yaml = readText(yamlFile);
  const block = yaml
    ? /^patchedDependencies:[ \t]*(?:#.*)?\r?\n((?:[ \t]+.*(?:\r?\n|$)|[ \t]*\r?\n)*)/m.exec(
        yaml,
      )
    : null;
  if (yaml && block) {
    const offset = (block.index ?? 0) + block[0].length - block[1].length;
    for (const m of block[1].matchAll(
      /^[ \t]+["']?(@astryxdesign\/[^"':\s]+)["']?\s*:\s*["']?([^"'\s#]+)/gm,
    ))
      record(yamlFile, yaml, offset + (m.index ?? 0), m[2], m[1]);
  }
  const pkgFile = join(installDir, "package.json");
  const pkgText = readText(pkgFile);
  if (pkgText) {
    try {
      const patched = JSON.parse(pkgText)?.pnpm?.patchedDependencies ?? {};
      for (const [key, path] of Object.entries(patched)) {
        if (!key.startsWith("@astryxdesign/")) continue;
        record(pkgFile, pkgText, Math.max(0, pkgText.indexOf(key)), String(path), key);
      }
    } catch {
      // not JSON: nothing to read
    }
  }
  for (const dir of ["patches", ".patches"]) {
    const full = join(installDir, dir);
    if (!existsSync(full)) continue;
    let entries = [];
    try {
      entries = readdirSync(full);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!/^@astryxdesign(\+|__)/.test(entry) || !entry.endsWith(".patch")) continue;
      const abs = join(full, entry);
      if (seen.has(abs)) continue;
      seen.add(abs);
      const text = readFileSync(abs, "utf8");
      out.push({
        category: "patches",
        file: relPath(projectDir, abs),
        line: 1,
        text: entry,
        detail: describe(text),
      });
    }
  }
  return out;
}
