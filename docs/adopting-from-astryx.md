# Adopting ui-common in an app that uses Astryx directly

This page is for an app that imports Astryx itself (`@astryxdesign/core`,
`@astryxdesign/lab`, `@astryxdesign/theme-neutral`) and moves onto
`@lablup/ui-common`. An app on ui-common 0.1 reads
[migrating-to-0.2.md](migrating-to-0.2.md) instead; the problems below are the
subset of that page a direct-Astryx app meets, plus the tooling that handles
them.

Two commands do the work:

- **`ui-common adopt --from astryx`** rewrites the imports, renames `Dialog`
  and `AlertDialog`, fixes the layer order, edits `package.json`, and writes
  `ui-common-adopt-report.md` with what needs a person.
- **`ui-common doctor`** checks the result (and any later state of the
  project) and names a fix and a section of this page for each failure.

## The sequence

```
pnpm dlx @lablup/ui-common-cli@next adopt --from astryx --dry-run   # read the report it prints
pnpm dlx @lablup/ui-common-cli@next adopt --from astryx             # apply
pnpm install
pnpm exec ui-common doctor                                          # fix, rerun, until it passes
```

(`npx @lablup/ui-common-cli@next …` with npm; drop `@next` once 0.2.0 is
published.) Then work through every row of `ui-common-adopt-report.md`, run the
build, the tests and a cold dev-server start, and compare screenshots of the
main screens in light and dark with the version before.

In a workspace, run both from the root: every member package is covered. Keep
two checks in CI so the project stays adopted, since every merge can bring an
`@astryxdesign/*` import back:

```
pnpm exec ui-common adopt --from astryx --check   # exit 1 when anything is left to rewrite
pnpm exec ui-common doctor
```

`ui-common upgrade --from astryx` is the same command as `adopt --from astryx`.

### With a coding agent

`ui-common agents --skill` installs the `ui-common-adopt` skill (Claude Code
format) into `.claude/skills/`; `--dir ~/.claude/skills` installs it for every
project of the user. Or paste this:

> Move this app off `@astryxdesign/*` onto `@lablup/ui-common`. Work on a new
> branch with a clean tree. Run
> `pnpm dlx @lablup/ui-common-cli@next adopt --from astryx --dry-run` and read
> the report; if it says Astryx moves to a newer version, run Astryx's
> codemods first as it says. Apply with `adopt --from astryx`, run
> `pnpm install`, and commit that alone. Run `pnpm exec ui-common doctor` and
> fix what it reports until it passes. Resolve every row of
> `ui-common-adopt-report.md`, following the decision each section states;
> ask me about anything that changes behaviour. Then run the type check, the
> build and the tests, start the dev server with `node_modules/.vite` deleted
> and confirm the app renders with no page errors, and compare screenshots of
> the main screens in light and dark against `main`. Finish with
> `adopt --from astryx --check` and `doctor` both passing, and list in the PR
> what you changed by hand and why.

## What adopt changes

- Module specifiers, in scripts (`import`, `export … from`, `import()`,
  `typeof import()`, `require()`, `vi.mock()`) and stylesheets (`@import`,
  `@use`): `@astryxdesign/core[/X]` → `@lablup/ui-common[/X]`,
  `@astryxdesign/lab` → `@lablup/ui-common/lab`,
  `@astryxdesign/theme-neutral[/built|/theme.css]` →
  `@lablup/ui-common/theme/neutral[…]`, including `theme/tokens.stylex`,
  the CSS entry points and `locales/*.json`. Package names in other strings,
  `declare module` augmentations, `@astryxdesign/cli` and files with an
  `@generated` header are left alone.
- `Dialog` / `AlertDialog` → `Modal` / `AlertModal`, imports and references.
  A module's own re-export keeps its public name (`export { Modal as Dialog }`).
- Every Astryx `@layer` order statement gains `ui-common` after
  `astryx-theme`; an entry stylesheet and an `index.html` without one get the
  full statement first.
- `package.json`: `@lablup/ui-common` and `@lablup/ui-common-cli` at the CLI's
  version; `@astryxdesign/core` stays only where declared, at the version
  ui-common pins; `@astryxdesign/theme-neutral` and an unused
  `@astryxdesign/lab` go; a used lab is pinned to ui-common's canary, with the
  override when nothing else gives its core peer a target. pnpm projects get
  `allowBuilds` entries for the Astryx postinstalls.

A second run changes nothing.

## Problems, and their fixes

**Two copies of Astryx core.** The lab canary peers on an exact core canary.
Without a core of the package's own or an override, pnpm installs a second
core and lab components lose the theme. `doctor` reads the lockfile.

**Imports come back.** Ban them in ESLint (`no-restricted-imports` does not see
`import()`, `require()` or `typeof import()`), and run `adopt --check` in CI:

```js
// eslint.config.js
rules: {
  "no-restricted-imports": ["error", { patterns: [{
    group: ["@astryxdesign/*", "!@astryxdesign/cli", "!@astryxdesign/cli/*"],
    message: "Import Astryx through @lablup/ui-common." }] }],
  "no-restricted-syntax": ["error",
    "ImportExpression[source.value=/^@astryxdesign\\u002F/]",
    "CallExpression[callee.name='require'][arguments.0.value=/^@astryxdesign\\u002F/]",
    "TSImportType[argument.literal.value=/^@astryxdesign\\u002F/]"],
}
```

**Local patches on Astryx.** A pnpm patch reaches only the project that
declares it, and ui-common ships its own `ComplexSelector`, lab `Drawer` and
lab `Tour`, which no patch on Astryx reaches. The report says which patch a
fork covers.

**A `Modal` is not a `<dialog>`.** Its `ref` is the element with
`role="dialog"`. It renders into a `document.body` portal and makes the rest of
the page `inert`: overlays that must stay usable need `MODAL_LIVE_ATTRIBUTE`,
and global shortcuts should skip while `MODAL_OPEN_ATTRIBUTE` is on an element
that is not `inert`. Escape closes one layer per press; your own Escape
handlers call `preventDefault()`.

**Tools that knew Astryx.** `<!-- ASTRYX:START -->` blocks give way to the
`UI-COMMON` block (`ui-common agents --write`), and a script that anchored on
`<!-- ASTRYX:END -->` breaks. `astryx <command>` becomes `ui-common <command>`.

**`astryx theme build` fails with "Unknown file extension .css"** when the
recipe imports anything that reaches ui-common components. Run it with an
import hook that loads `.css` as an empty module:

```js
// astryx-css-stub.mjs — NODE_OPTIONS="--import=./astryx-css-stub.mjs" astryx theme build …
import { register } from "node:module";
register(
  "data:text/javascript," +
    encodeURIComponent(
      `export async function load(url, context, next) {
    if (url.endsWith(".css")) return { format: "module", source: "", shortCircuit: true };
    return next(url, context);
  }`,
    ),
);
```

**Fresh releases and quarantine.** A pnpm `minimumReleaseAge` holds back a
just-published ui-common; list the exact versions under
`minimumReleaseAgeExclude` (the lab canary never ages out). pnpm's `catalog:`
rejects `file:` specs: try a tarball through `overrides`.

## Doctor checks

Each section is what one check verifies and how to fix a failure.

### node

The CLI (and the Astryx CLI it wraps) needs Node 22.13 or later. The app may
build on any Node it supports.

### versions

`@lablup/ui-common` and `@lablup/ui-common-cli` are released in lockstep:
declare both at the same exact version (catalog entries count), install, and
bump them together. A WARN means the CLI is not a dependency; add it as a
devDependency so `doctor` and `agents` run at the project's version.

### single-core

Exactly one `@astryxdesign/core` is installed, at the version ui-common pins:
one `packages` entry and one `snapshots` entry in `pnpm-lock.yaml` (the same
version resolved against two peer sets is two copies), one copy in
`package-lock.json`, and one directory resolved from ui-common, lab and each
package. Fix the pins until `pnpm why -r @astryxdesign/core` (or
`npm ls @astryxdesign/core`) lists one version.

### lab-core

`@astryxdesign/lab`'s core peer resolves to that same core, in the lockfile and
on disk. Usually fixed by the override below.

### lab-override

Where a module imports `@lablup/ui-common/lab`, lab's core peer needs a
target: pnpm `overrides: { "@astryxdesign/lab>@astryxdesign/core": "<pin>" }`
in `pnpm-workspace.yaml`, or npm `"overrides": { "@astryxdesign/lab":
{ "@astryxdesign/core": "<pin>" } }` in the root `package.json`. Under pnpm, a
package that declares `@astryxdesign/core` itself at the pin passes too.

### imports

No module specifier names `@astryxdesign/core`, `/lab` or `/theme-neutral`.
Run `adopt --from astryx`; what it cannot move is listed in its report.

### layer-order

`@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;`
is the first rule of the entry stylesheet and the first `<style>` of
`index.html` (before any `<link rel="stylesheet">`), identical in every copy
(Storybook's included), with `ui-common` after `astryx-theme` and before
`components`. A layer's place is fixed by the first statement that names it,
so a missing or different copy changes the cascade silently, and differently in
dev and in a build.

### vite-prebundle

`@stylexjs/unplugin` takes every package that peers on `@stylexjs/stylex` out
of Vite's dependency optimizer, ui-common included; a cold dev start can then
hang or crawl. Put it back, after the StyleX plugin:

```ts
{
  name: "prebundle-ui-common",
  enforce: "post",
  config(config) {
    const exclude = config.optimizeDeps?.exclude;
    if (exclude) config.optimizeDeps!.exclude = exclude.filter((n) => n !== "@lablup/ui-common");
  },
},
```

Test with `node_modules/.vite` deleted.

### vitest-inline

ui-common's modules import their stylesheets; Node cannot load them, so every
Vitest config whose tests render ui-common inlines it:
`test: { server: { deps: { inline: [/@lablup\/ui-common/] } } }`.

### i18n

An `InternationalizationProvider` gets ui-common's catalog merged in:
`messages={mergeMessages({ "ko-KR": astryxKo }, uiCommonMessages)}` from
`@lablup/ui-common/i18n-catalog`. Without it, ui-common's built-in strings stay
English.

### agents

The `UI-COMMON` block in `AGENTS.md` / `CLAUDE.md` matches what
`ui-common agents` generates for the installed version, and no
`<!-- ASTRYX:START -->` block is left. Rewrite it with
`ui-common agents --write <file>` from the package it was written for.
