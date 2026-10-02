/**
 * `ui-common adopt` report-only scans. Nothing here edits a file: each
 * finding is a place where moving onto ui-common changes behaviour or
 * tooling in a way a person has to decide about.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

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
    help: "`Modal`, the lab `Drawer` and popovers close through one layer stack: one Escape closes the top layer only. A handler of yours that consumes Escape (inline edit, a search box) must call `event.preventDefault()`, or the stack closes the surrounding layer too.",
  },
  "agent-blocks": {
    title: "Astryx agent blocks, and tools anchored on them",
    help: "Replace each `<!-- ASTRYX:START -->` block with ui-common's: `ui-common agents --write <file>` adds the `UI-COMMON` block (keep your own lines outside its markers), then delete the ASTRYX block. A script or workflow that finds its place by the ASTRYX markers breaks when they go: point it at `<!-- UI-COMMON:END -->` or at your own marker.",
  },
  "astryx-cli": {
    title: "`astryx` CLI invocations",
    help: "`ui-common <command>` runs the Astryx CLI ui-common pins and rewrites its output to ui-common paths; `ui-common astryx <command>` runs it unrewritten. Switch each invocation, or keep `@astryxdesign/cli` as a devDependency at the version `@lablup/ui-common-cli` pins. `astryx theme build` keeps working either way (a recipe that imports ui-common components needs the `.css` stub in docs/adopting-from-astryx.md).",
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
 * @returns {Finding[]}
 */
export function scanFile(file, text) {
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

/**
 * Astryx components ui-common ships its own copy of (src/forks), by the path
 * fragment a patch on Astryx's dist would touch.
 */
export const FORKED = [
  { name: "ComplexSelector", pattern: /ComplexSelector/ },
  { name: "Drawer (lab)", pattern: /Drawer/ },
  { name: "Tour (lab)", pattern: /\bTour/ },
];

/**
 * Local patches on Astryx: pnpm `patchedDependencies` (pnpm-workspace.yaml or
 * package.json `pnpm`), and patch-package files under `patches/`.
 *
 * @param {string} installDir the install root
 * @param {string} projectDir
 * @returns {Finding[]}
 */
export function scanPatches(installDir, projectDir) {
  /** @type {Finding[]} */
  const out = [];
  /** @type {Set<string>} */
  const seen = new Set();
  const describe = (/** @type {string | null} */ patchText) => {
    if (!patchText) return "patch file not found";
    const files = [...patchText.matchAll(/^diff --git a\/(\S+)/gm)].map((m) => m[1]);
    const covered = FORKED.filter((f) => files.some((p) => f.pattern.test(p))).map(
      (f) => f.name,
    );
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
  ) => {
    const abs = join(installDir, patchPath);
    if (seen.has(abs)) return;
    seen.add(abs);
    out.push(
      at("patches", relPath(projectDir, file), text, index, describe(readText(abs))),
    );
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
      record(yamlFile, yaml, offset + (m.index ?? 0), m[2]);
  }
  const pkgFile = join(installDir, "package.json");
  const pkgText = readText(pkgFile);
  if (pkgText) {
    try {
      const patched = JSON.parse(pkgText)?.pnpm?.patchedDependencies ?? {};
      for (const [key, path] of Object.entries(patched)) {
        if (!key.startsWith("@astryxdesign/")) continue;
        record(pkgFile, pkgText, Math.max(0, pkgText.indexOf(key)), String(path));
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
