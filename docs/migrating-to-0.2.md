# Moving an app onto ui-common 0.2: what went wrong the first time

The README's [Upgrading from 0.1](../README.md#upgrading-from-01) section says
what changed. This page says what broke when the first app (the Backend.AI
WebUI) moved onto 0.2, and how to avoid each problem. Every item below
happened at least once. Read it before you start, and use the checklist at the
end before you merge.

## 1. Dependencies and install

**Two copies of Astryx core, silently.** The lab canary peers on an exact
core canary, not on the core ui-common pins. Without the override in the
README (`@astryxdesign/lab>@astryxdesign/core`), pnpm installs a second core
and `--frozen-lockfile` and `pnpm peers check` both stay green. Components
from `@lablup/ui-common/lab` then run on a different core than everything
else, with their own theme and layer contexts.

- Put the pnpm override in `pnpm-workspace.yaml`. pnpm 10 and later ignore
  `pnpm.overrides` in `package.json`.
- Check with `pnpm why -r @astryxdesign/core`: it must say one version. Make
  that a CI check that reads the lockfile, not a one-off. A lockfile with the
  same core version under two peer sets is also a second copy.
- Keep `@astryxdesign/core` out of your own `dependencies` unless you pin the
  exact version ui-common pins. If you keep it (for example so the Astryx CLI
  resolves in your package), pin it to that version.

**Local patches on Astryx do not travel.** pnpm `patchedDependencies` apply
only in the project that declares them. A patch shipped inside a library
reaches nobody. If you carry a patch on Astryx, either drop it (ui-common
0.2 ships fixed copies of `ComplexSelector`, lab `Drawer` and lab `Tour`) or
keep it in your own workspace and know that ui-common's copies do not see it.

**Trying an unpublished ui-common.** A `workspace:` or `link:` dependency
hides the duplicate-core problem above, because your app resolves Astryx from
its own tree. Test with a packed tarball (`pnpm pack`) instead.

- pnpm's `catalog:` rejects `file:` specs. Pin the tarball with an `overrides`
  entry and keep the catalog on the version number.
- pnpm does not re-read a changed tarball under the same file name. Bump the
  version (and the file name) every time you repack.

## 2. Imports

**Import Astryx only through ui-common.** `@lablup/ui-common/<X>` mirrors
`@astryxdesign/core/<X>` one to one, and `@lablup/ui-common/lab` mirrors lab.
Rewrite the specifiers with a script, then ban `@astryxdesign/*` so nothing
comes back:

- `no-restricted-imports` does not see `import('…')`, `require('…')` or
  `typeof import('…')`. Add a `no-restricted-syntax` rule for those.
- Cover every file type your source uses (`.js`, `.jsx`, `.mjs`), Storybook
  config directories and test files, not only `src/**/*.tsx`.
- CSS `@import`s of `@astryxdesign/core/reset.css`, `astryx.css`,
  `lab/lab.css` and `theme-neutral/theme.css` need rewriting too; ESLint does
  not look there.
- Keep the rewrite script and run it in `--check` mode in CI. Every merge from
  your main branch can bring new `@astryxdesign/*` imports back.

**Hidden names.** `Dialog` and `AlertDialog` are not mirrored; use `Modal` and
`AlertModal`. A plain rename works for almost every call site. The one
difference: a `Modal` `ref` points at the element with `role="dialog"`, not at
an `HTMLDialogElement`.

## 3. Build and test tooling

**Vite dev server hangs on a cold start.** `@stylexjs/unplugin` removes from
`optimizeDeps` every dependency that peers on `@stylexjs/stylex`, and
ui-common does. ui-common and the Astryx modules behind it are then served
as source through the StyleX transform, which deadlocks against the
optimizer on the first start: `index.html` loads, every
`/node_modules/.vite/deps/*` request stays pending, and the app never renders.
A warm cache hides it. Put ui-common back into pre-bundling:

```ts
// vite.config.ts, after the StyleX plugin
{
  name: 'prebundle-ui-common',
  enforce: 'post',
  config(config) {
    const exclude = config.optimizeDeps?.exclude;
    if (exclude) {
      config.optimizeDeps!.exclude = exclude.filter(
        (name) => name !== '@lablup/ui-common',
      );
    }
  },
},
```

Test it with the optimizer cache cleared (`rm -rf node_modules/.vite`).

**Vitest fails with "Unknown file extension .css".** ui-common components
import their own stylesheets. Inline the package in every Vitest config that
renders them:

```ts
test: {
  server: {
    deps: {
      inline: [/@lablup\/ui-common/];
    }
  }
}
```

**`astryx theme build` fails with "Unknown file extension .css".** A theme
recipe that imports anything reaching ui-common components hits the same
problem in plain Node. Run the build with an import hook that loads `.css` as
an empty module:

```js
// astryx-css-stub.mjs — run with NODE_OPTIONS="--import=./astryx-css-stub.mjs"
import { register } from "node:module";
register(
  "data:text/javascript," +
    encodeURIComponent(`export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true };
  return next(url, context);
}`),
);
```

## 4. CSS

**Declare the layer order before any stylesheet, everywhere.** Layer
precedence is fixed by first appearance. If your bundle evaluates one layered
sheet before your entry stylesheet's `@layer` statement, the order changes,
and it can differ between the dev server and the production build. Put the
statement in an inline `<style>` in `index.html` before any `<link>`, and keep
every other copy (entry CSS, Storybook, a library's own sheet) identical. A
test that compares the copies is cheap.

**`ui-common.css` is optional.** It holds only global scrollbar rules. Each
ui-common component imports its own CSS. Leave it out if your app styles its
own scrollbars; importing it changes their look.

**Old class names are gone.** Kept components moved from `page-header` to
`uic-page-header` and so on; removed components' classes no longer exist. CSS
overrides, `querySelector` calls, e2e selectors and test queries that name
them break silently. `ui-common upgrade` lists them in its report; fix every
line of that list.

**Custom properties.** ui-common's own knobs are named `--<component>-<name>`
(`--modal-z`, `--data-grid-max-height`), the way Astryx names its own. Check
that none of your custom properties uses one of those names or an Astryx
token name (`--color-border`, `--color-error`, …). A collision is resolved by
the cascade, not by an error, so it shows up as a wrong colour.

**`--token-*` is retired.** `legacy-tokens.css` keeps old reads working for one
release. Move them to Astryx tokens rather than relying on it.

## 5. Theme

- The app needs exactly one theme provider at the root. A nested `<Theme>`
  without `mode` falls back to the system preference, not the parent's mode,
  so pass `mode` to every nested one.
- Theme tokens a product adds (such as `--color-info`) are declared in the
  product's theme. ui-common components read them with an Astryx fallback, so
  a component can look different under your theme than under `lablupTheme`.
  That is intended; compare against your own theme, not the demo.
- Brand colours belong in `defineTheme`, never in `:root` overrides of
  `--color-*`.

## 6. Behaviour that changed under you

**An open `Modal` makes the rest of the page inert.** Every other child of
`<body>` becomes `inert` and hidden from assistive technology until the modal
closes. Anything that must stay usable while a modal is open needs
`MODAL_LIVE_ATTRIBUTE` (exported from `@lablup/ui-common/Modal`) on its root:
toast viewports, notification stacks, review or debug overlays. If it mounts
while a modal is already open, call `refreshModalBackground()` after mounting.
ui-common's `NotificationStack` does this itself; Astryx's toast viewport does
not. Check this in a real browser: jsdom ignores `inert`.

**Escape goes through one stack.** `Modal`, the lab `Drawer` and Astryx's
popovers close through Astryx's layer-dismissal stack: one Escape closes the
top-most layer only. Two consequences:

- A drawer without a scrim is a layer too, so Escape closes it even when focus
  is elsewhere on the page.
- Your own Escape handlers (inline rename, a title editor) now race the stack.
  Call `event.preventDefault()` when your handler consumed the key, so the
  stack leaves it alone.

**Global hotkeys over a modal.** A command palette or other global shortcut
still fires while a modal is open unless you check for it. Skip the shortcut
while an element with `MODAL_OPEN_ATTRIBUTE` that is not `inert` exists.

## 7. Strings

- Pass `uiCommonMessages` (from `@lablup/ui-common/i18n-catalog`) into
  Astryx's `InternationalizationProvider` for every locale you support, merged
  with Astryx's own catalog. Without it, ui-common's built-in strings stay
  English.
- Map your language codes to Astryx's locale file names (`ko` → `ko-KR`).
  Locales Astryx has no file for fall back to English; list them explicitly
  so the fallback is a decision, not an accident.
- Catalog messages are ICU (`{count}`), not i18next (`{{count}}`). Convert any
  string you move into the catalog, and use an ICU plural for counts.
- Short labels are buttons, not sentences. "Cancel" is "Abbrechen", not
  "Stornieren". Check the shared `uic.common.*` labels in your languages.

## 8. Wrapping ui-common in your own components

- Keep your existing component names as thin adapters over the ui-common
  component, so call sites do not change. Do not keep a second
  implementation next to ui-common's.
- Forward what the old component forwarded. Two regressions from the first
  migration: a row index passed as a constant `0` to a per-cell callback, and
  a prop that leaked onto a DOM element (`titleStyle` on a `<div>`), which
  React only reports in the console.
- Diff each adapter's behaviour at real call sites, not only its types: event
  arguments, disabled states, when `afterClose`-style callbacks fire, and what
  a cleared value is (`null` or `[]`).

## 9. Merging and rebasing a long migration branch

- Never hand-merge the lockfile, generated GraphQL output, search indexes or
  built theme artifacts. Take one side and regenerate.
- After every merge from main, run the import rewrite again, then its
  `--check`.
- If a large change lands on main while your branch holds an older copy of
  it, resolve against the final version on main, not your copy.

## Checklist before you merge

- [ ] `pnpm why -r @astryxdesign/core` shows one version, and CI checks it.
- [ ] No `@astryxdesign/*` import anywhere (lint + rewrite script `--check`).
- [ ] The layer order is declared first, and every copy is identical.
- [ ] A cold dev-server start (optimizer cache cleared) renders the app.
- [ ] Vitest and the theme build run with ui-common inlined / CSS stubbed.
- [ ] `ui-common upgrade` report: every line resolved.
- [ ] Toasts and overlays are usable while a modal is open (real browser).
- [ ] Escape closes one layer at a time; your own Escape handlers call
      `preventDefault()`.
- [ ] Built-in strings appear translated in each supported language.
- [ ] Screenshots of the main screens, light and dark, compared with the
      version before the migration.
