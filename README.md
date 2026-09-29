# @lablup/ui-common

Lablup's UI layer on top of [Astryx](https://github.com/facebook/astryx).

It gives Lablup products three things through one dependency:

- **Astryx itself**, re-exported 1:1. Every Astryx subpath exists here under the
  same name.
- **The Lablup brand theme**, as an Astryx theme.
- **A few components of its own**, built on Astryx, for patterns Astryx does not
  cover.

Consumers are Lablup product frontends, including
[all-smi](https://github.com/lablup/all-smi). The package holds presentation
only. It has no API client, no application state, no router, and no
desktop-shell integration.

## Install

```
pnpm add @lablup/ui-common @stylexjs/stylex
```

That is npmjs, which needs no authentication.

Peer dependencies:

- `react` and `react-dom` 19.
- `@stylexjs/stylex` ^0.19. It is the one runtime copy that Astryx, ui-common
  and your own StyleX code share.
- `@astryxdesign/lab`, optional. Install it only if you use
  `@lablup/ui-common/lab`. It is pinned to the exact canary ui-common is built
  against, and it needs the override below.

Astryx itself (`@astryxdesign/core`, `@astryxdesign/theme-neutral`) comes in
as ui-common's own dependencies, pinned exactly. The `ui-common` bin and the
Astryx CLI it wraps are a separate dev-time package, `@lablup/ui-common-cli`
([The ui-common CLI](#the-ui-common-cli)).
`lucide-react` (the icon set Astryx's neutral theme already depends on) and
`intl-messageformat` come in the same way.
Do not add them to your project. ui-common owns the Astryx version. Two copies
of Astryx means two copies of its React contexts, and components stop seeing
the theme.

### With `@lablup/ui-common/lab`

The lab canary declares an exact peer on the core canary it was cut from, not
on the core ui-common pins. Without an override, pnpm installs that canary
core beside ui-common's, npm nests it under lab, and `@lablup/ui-common/lab`
runs on the second copy. Add the override for your package manager, next to
`@astryxdesign/lab` itself (`ui-common upgrade` adds both when it moves a
Drawer to lab):

pnpm, in `pnpm-workspace.yaml` (pnpm 10 and later read settings only from
there):

```yaml
overrides:
  "@astryxdesign/lab>@astryxdesign/core": "0.6.2"
```

npm, in the root `package.json`:

```json
"overrides": {
  "@astryxdesign/lab": { "@astryxdesign/core": "0.6.2" }
}
```

The version is the `@astryxdesign/core` that ui-common pins; it moves with
each ui-common release that moves Astryx. Then `pnpm why @astryxdesign/core`
(or `npm ls @astryxdesign/core`) lists one version. pnpm may still warn that
lab's peer is unmet; with the override that is expected. A project that already
lists `@astryxdesign/core` itself, at the same version, gets the same effect
from pnpm resolving the peer to its own copy.

### The GitHub Packages mirror

The same versions are also published to GitHub Packages for projects that
already authenticate to GitHub. It is a mirror, not a different package.

GitHub Packages requires authentication **even for public packages**. To use
it, point the scope at that registry:

```
# .npmrc
@lablup:registry=https://npm.pkg.github.com
```

In GitHub Actions, authenticate with the built-in token and grant
`permissions: packages: read`:

```yaml
- uses: actions/setup-node@v5
  with:
    registry-url: https://npm.pkg.github.com
    scope: "@lablup"
env:
  NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Locally, use a personal access token with `read:packages`, in your user
`~/.npmrc` and never in a project file.

## Set up

Declare the layer order once, first, in your app's entry stylesheet. Then load
the stylesheets:

```css
@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;

@import "@lablup/ui-common/reset.css";
@import "@lablup/ui-common/astryx.css";
@import "@lablup/ui-common/theme/lablup/theme.css";
@import "@lablup/ui-common/ui-common.css";
/* Only if you use @lablup/ui-common/lab: */
@import "@lablup/ui-common/lab/lab.css";
```

Wrap the app in the theme:

```tsx
import { Theme } from "@lablup/ui-common";
import { lablupTheme } from "@lablup/ui-common/theme/lablup/built";

<Theme theme={lablupTheme}>
  <App />
</Theme>;
```

`/theme/lablup/built` pairs with `theme.css` and injects nothing at runtime.
`@lablup/ui-common/theme/lablup` is the same theme as source, for runtime
injection or for extending it with `defineTheme`. Use one or the other.
Astryx's neutral theme is mirrored the same way at `/theme/neutral`.

The theme names its font family (Ubuntu Sans, then Pretendard Variable) but
does not load it. Loading fonts is the app's job.

### Layers

| Layer                     | Owner                               |
| ------------------------- | ----------------------------------- |
| `reset`, `theme`, `base`  | Astryx reset, your own base rules   |
| `astryx-base`             | Astryx component styles             |
| `astryx-theme`            | theme overrides, including Lablup's |
| `ui-common`               | ui-common's own styles              |
| `components`, `utilities` | yours                               |

ui-common's styles beat Astryx's base and theme styles for the primitives they
wrap. Your `components` layer beats ui-common. Unlayered rules beat all of it.

## Use

Astryx components come from the root or from their own subpath, exactly as in
Astryx:

```tsx
import { Button, Text } from "@lablup/ui-common";
import { Table } from "@lablup/ui-common/Table";
import { useClipboard } from "@lablup/ui-common/hooks";
```

StyleX users import tokens from the `.stylex` subpath. The StyleX compiler
recognises a theme import by that suffix, so the root barrel will not do:

```ts
import { colorVars, spacingVars } from "@lablup/ui-common/theme/tokens.stylex";
```

Lab components live at `@lablup/ui-common/lab`.

ui-common's own components come from the root, and from the subpaths below:

```tsx
import { PageHeader, PageLayout, StatCard } from "@lablup/ui-common";
import { Modal } from "@lablup/ui-common/Modal";
```

| Component                                                      | What it is                                                  | Subpath                          |
| -------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| `Modal`                                                        | The dialog, in place of Astryx `Dialog`. See below.         | `/Modal`                         |
| `PageLayout`                                                   | A page's width clamp (`standard`, `wide`, `full`)           | `/components/PageLayout`         |
| `PageHeader`                                                   | A page's title, description, actions and error banner       | `/components/PageHeader`         |
| `StatCard`                                                     | A dashboard metric, on Astryx `Card`                        | `/components/StatCard`           |
| `ErrorState`                                                   | A full-area error with recovery actions                     | `/components/ErrorState`         |
| `SkeletonCard`, `SkeletonText`, `SkeletonChart`, `SkeletonRow` | Loading placeholders drawn with Astryx `Skeleton`           | `/components/Skeleton`           |
| `SmoothHeight`                                                 | Animates a container toward its content's height            | `/components/SmoothHeight`       |
| `DigitPopIn`                                                   | A number whose characters pop in, one after another         | `/components/DigitPopIn`         |
| `CountBadge`                                                   | A count or dot overlaid on its child's corner               | `/components/CountBadge`         |
| `DoubleBadge`                                                  | A run of Badges welded into one chip                        | `/components/DoubleBadge`        |
| `BooleanToken`                                                 | An on/off value as a Token                                  | `/components/BooleanToken`       |
| `IconWithTooltip`                                              | A focusable glyph that explains itself in a Tooltip         | `/components/IconWithTooltip`    |
| `ImageWithFallback`                                            | An image that renders a fallback node when it fails to load | `/components/ImageWithFallback`  |
| `NotificationStack`                                            | Floating notices with task progress and actions             | `/components/NotificationStack`  |
| `OverlayScrollbar`                                             | A persistent scroll thumb drawn over a scroll container     | `/components/OverlayScrollbar`   |
| `ConfirmPopover`                                               | A one-click confirmation anchored to its trigger            | `/components/ConfirmPopover`     |
| `PagedSelector`                                                | A searchable selector over options loaded a page at a time  | `/components/PagedSelector`      |
| `SelectionLabel`                                               | "3 selected", with a button that clears the selection       | `/components/SelectionLabel`     |
| `UncontrolledInput`                                            | A field that reports its value on Enter or blur             | `/components/UncontrolledInput`  |
| `AlertModal`                                                   | An alert dialog, in place of Astryx `AlertDialog`           | `/AlertModal`                    |
| `DeleteConfirmModal`                                           | Confirms a deletion, with typed confirmation when needed    | `/components/DeleteConfirmModal` |
| `StepNumberInput`, `NumberStepper`                             | A number field that steps along a list of values            | `/components/StepNumberInput`    |
| `BoardItemTitle`                                               | A dashboard panel's sticky title row                        | `/components/BoardItemTitle`     |
| `Statistic`                                                    | A metric with a caption, a large value and a notched bar    | `/components/Statistic`          |
| `DividedRow`                                                   | A wrapping row with dividers between neighbours on a line   | `/components/DividedRow`         |
| `TokenList`                                                    | Values inline, the rest behind `+N` on hover                | `/components/TokenList`          |
| `TokenRow`                                                     | Tokens cut off with "and N more"                            | `/components/TokenRow`           |
| `NotificationItem`                                             | The title, description, actions and footer of one notice    | `/components/NotificationItem`   |
| `UnitGrid`, `UnitGridSkeleton`                                 | Groups of unit squares on one lattice, with a hover card    | `/components/UnitGrid`           |
| `ColorPicker`                                                  | A hex colour field on the platform colour input             | `/components/ColorPicker`        |
| `Form` and its hooks                                           | A form engine with antd's form API. See below.              | `/Form`                          |
| `BulkEditFormItem`                                             | A form item that edits one field across many records        | `/components/BulkEditFormItem`   |
| `DataGrid`, `DataGridSettingsModal`, `DataGridExportModal`     | A table with paging, sorting, selection and column settings | `/components/DataGrid`           |
| `BulkErrorModal`                                               | The failed items of a bulk operation, in a grid             | `/components/BulkErrorModal`     |
| `ProgressWithLabel`                                            | A bar that carries its label and value label                | `/components/ProgressWithLabel`  |
| `TextHighlighter`                                              | Marks a search keyword in a string                          | `/components/TextHighlighter`    |
| `CountdownBorder`                                              | A border that fills as a countdown to a refresh             | `/components/CountdownBorder`    |
| `DoubleToken`                                                  | A run of Tokens welded into one chip                        | `/components/DoubleToken`        |
| `ListBanner`                                                   | A Banner that lists items, scrolling past a height          | `/components/ListBanner`         |
| `usePrefersReducedMotion`                                      | The `prefers-reduced-motion` media query, as a hook         | root only                        |

Their styles live in `@layer ui-common`, under `uic-` class names.

### Modal

`Modal` takes every prop Astryx `Dialog` takes, so a `Dialog` call site moves
over by renaming the import: `@astryxdesign/core/Dialog` becomes
`@lablup/ui-common/Modal`, `Dialog` becomes `Modal`, `DialogProps` becomes
`ModalProps`. `DialogHeader`, `DialogPosition`, `DialogPurpose` and
`DialogVariant` are re-exported unchanged, and as `ModalHeader`,
`ModalPosition`, `ModalPurpose` and `ModalVariant`. One difference is visible
to a caller: `ref` reaches the `div` that carries `role="dialog"`, not a
`<dialog>` element.

What it adds:

- It renders into a `document.body` portal instead of the browser's top layer,
  so whatever the app layers above the modal band, such as a notification
  stack, stays visible. The band is `z-index` 1100 to 10999 by default;
  `configureModalZIndex({ base, step, max })` moves it.
- While a modal is open, the topmost one is `aria-modal="true"` and the rest
  of the page is `inert`, as `showModal()` would make it. Two things stay
  reachable: modal roots, and elements marked `data-uic-modal-live`
  (`MODAL_LIVE_ATTRIBUTE`). `NotificationStack` marks itself, so notices over a
  modal can still be read and dismissed; mark your own live region the same
  way, and call `refreshModalBackground()` if it mounts while a modal is open.
  An `inert` the page set itself is left as it was.
- A modal opened from inside another paints above it. Only the topmost one
  traps focus and takes Escape; covered ones are `inert`. Other portalled
  surfaces (a drawer) join the same stack with `useModalLevel`, which also
  keeps them out of the inert background.
- Content mounts on first open and stays mounted while closed.
  `unmountOnClose` drops it. `afterOpenChange` reports each open and close.
- With `title`, `onAction` or `footer`, it lays out a header, the body and a
  footer with a primary action and Cancel. `onAction` may return a promise; the
  button stays pending until it settles. It does not close the modal.

```tsx
<Modal
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="Rename folder"
  actionLabel="Rename"
  onAction={async () => {
    await rename(name);
    setIsOpen(false);
  }}
>
  <TextInput label="Name" value={name} onChange={setName} />
</Modal>
```

### Form

`@lablup/ui-common/Form` is a form engine with antd's form API: `Form`,
`Form.Item`, `Form.List`, `Form.ErrorList`, `Form.Provider`,
`Form.useForm`, `Form.useWatch`, `Form.useFormInstance` and
`Form.Item.useStatus`, with antd's rules (`required`, `message`,
`validator`, `type`, `min`, `max`, `pattern`, `whitespace`,
`warningOnly`). It keeps antd's names on purpose: it is a form-state API,
not a component, so code written against antd's form moves over by changing
the import. The item shell renders on Astryx tokens.

```tsx
import { Form } from "@lablup/ui-common/Form";

const [form] = Form.useForm();

<Form form={form} layout="vertical" onFinish={save}>
  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
    <TextInput label="Name" isLabelHidden />
  </Form.Item>
</Form>;
```

- Validation messages come from ui-common's catalog in the locale of the
  nearest `InternationalizationProvider` (see Strings). `FormConfigProvider`
  sets `validateMessages`, `requiredMark` and `optionalLabel` app-wide; a
  form's own `validateMessages` wins over both.
- A control shows its item's validation state by reading
  `Form.Item.useStatus()` or `FormItemInputContext`.
- `form.scrollToField` and `scrollToFirstError` find the control by
  `data-uic-field-id`, which `Form.Item` puts on its child; Astryx inputs
  keep `data-*` attributes.
- The DOM is `.uic-form` (with `data-layout`) and `.uic-form-item` with
  `__label`, `__label--required`, `__control`, `__control-input`,
  `__explain`, `__explain-error`, `__explain-warning` and `__extra`.
  The item carries `data-layout`, `data-size` and `data-status`. These
  class names are the public hooks for tests and product CSS.
- Three custom properties adjust it: `--form-item-margin-bottom`
  (default `--spacing-6`), `--form-item-gap` (label to control in a
  vertical item, default `--spacing-2`) and `--form-item-line-height`
  (default `--text-body-leading`). Help, extra, the tooltip glyph and the
  optional suffix take the theme's `--color-text-description` where the
  theme declares one, else `--color-text-secondary`.

### What is hidden

A few Astryx subpaths are deliberately not re-exported. They are listed, with
the reason and the replacement, in [`exports.exclude.json`](exports.exclude.json).
Today that is `Dialog` (use `Modal`), `AlertDialog` (use `AlertModal`) and two
Astryx CLI data files.

### Name rule

A ui-common component never shares a name with an Astryx core or lab export.
If a name is `Button`, it is Astryx's `Button`. The same holds the other way:
`DialogHeader` from `@lablup/ui-common/Modal` is Astryx's own `DialogHeader`.

## Strings

ui-common's components show a few built-in strings. Every one of them is also a
prop, and an explicit prop always wins.

The defaults resolve through Astryx's own `InternationalizationProvider`.
Supply translations once, at the provider:

```tsx
import { InternationalizationProvider } from "@lablup/ui-common/i18n";
import { mergeMessages, uiCommonMessages } from "@lablup/ui-common/i18n-catalog";
import astryxKo from "@lablup/ui-common/locales/ko-KR.json";

<InternationalizationProvider
  locale="ko-KR"
  messages={mergeMessages({ "ko-KR": astryxKo }, uiCommonMessages)}
>
  <App />
</InternationalizationProvider>;
```

- `@lablup/ui-common/locales/<locale>.json` is Astryx's own catalog.
- `@lablup/ui-common/ui-common-locales/<locale>.json` is ui-common's.
- Without a provider, everything renders in English.

ui-common never uses a product i18n runtime.

## Upgrading from 0.1

Removed in 0.2, each replaced by Astryx:

| 0.1           | 0.2                                   |
| ------------- | ------------------------------------- |
| `Badge`       | `Badge`, or `Token` for a chip        |
| `BaseCard`    | `Card`, or `ClickableCard`            |
| `Button`      | `Button`, or `IconButton`             |
| `DataTable`   | `Table`                               |
| `Drawer`      | `Drawer` from `@lablup/ui-common/lab` |
| `EmptyState`  | `EmptyState`                          |
| `ProgressBar` | `ProgressBar`                         |
| `Select`      | `Selector`                            |
| `Skeleton`    | `Skeleton` (the composites stay)      |
| `StatusTag`   | `StatusDot`                           |
| `Tabs`        | `TabList`                             |
| `Tooltip`     | `Tooltip`                             |

The kept components keep their 0.1 props. Their class names moved to `uic-`
(`page-header` is `uic-page-header`), so CSS or tests that select the old
names need updating. [`migration/0.1-to-0.2.json`](packages/cli/migration/0.1-to-0.2.json)
lists every import, prop, class and stylesheet change in a form the upgrade
tool reads.

Let the upgrade tool do the mechanical part. It ships in
`@lablup/ui-common-cli`, so run it one-off from the project still on 0.1:

```
pnpm dlx @lablup/ui-common-cli upgrade --from 0.1 --dry-run   # writes nothing; prints the changes and the report
pnpm dlx @lablup/ui-common-cli upgrade --from 0.1             # applies it
```

(`npx @lablup/ui-common-cli upgrade --from 0.1` with npm.) It bumps
`@lablup/ui-common` in `package.json` and adds `@lablup/ui-common-cli` as a
devDependency at the same version; then run your install, and later upgrades
are `pnpm exec ui-common upgrade --from <old version>`.

It moves the imports, reshapes the props it can prove safe, rewrites the
`styles/base.css` import into the 0.2 stylesheet set (or, in an app that
never imported it, imports that set first in the app's entry script), wraps
the app's root render (`createRoot(…).render(<App />)`) in
`<Theme theme={lablupTheme}>` when no module uses `<Theme>` yet, and updates
`package.json`. Code that imports a moved component through a module of your
own that re-exports it (a barrel such as `@/components/common`, found through
relative paths and your tsconfig `paths`) gets the same rewrite. A component of
yours that wraps one and takes its props is listed in the report instead: its
props are yours to change. Everything else is a `TODO(ui-common-upgrade)` comment in the
code and a line in `ui-common-upgrade-report.md`, together with the CSS, DOM
queries, tests and module mocks that still name 0.1 classes, custom
properties of yours that Astryx declares too, and code that switches 0.1
themes through `data-theme`. Steps the app cannot work without (the
stylesheets or `<Theme>`, where the upgrade could not add them) open the
report under "Action required".

Deprecated in 0.2, removed in 0.3:

- **`--token-*` custom properties.** Astryx's token set is the contract now.
  `@lablup/ui-common/legacy-tokens.css` declares every old name as the matching
  Astryx token, inside `@layer ui-common`, so code that reads them keeps
  working while it moves.
- **`styles/base.css` and `styles/themes/*.css`.** Use the Lablup theme. No
  ui-common component reads them any more; they stay one release so existing
  imports keep resolving while the upgrade tool rewrites them.

## What is deliberately absent

- API clients, endpoints, and authentication.
- Application state, stores, and routing.
- Tauri APIs and plugins, and any desktop-shell assumption.
- Product i18n runtimes and product locale keys.
- Anything from the private AI companion package. The dependency runs the
  other way, and CI fails if it ever reverses.

## The ui-common CLI

The `ui-common` bin is its own package, `@lablup/ui-common-cli`, released at
the same version as `@lablup/ui-common` and taking it as a peer. It wraps the
Astryx CLI it pins, so a project needs no `@astryxdesign/*` dependency of its
own to use it. Being separate keeps the Astryx CLI and the codemod toolchain
(jscodeshift, postcss) out of a production install, the way Astryx splits
`@astryxdesign/cli` from `@astryxdesign/core`. Keep it a devDependency pinned
to the same version as `@lablup/ui-common`, and bump the two together:

```
pnpm add -D @lablup/ui-common-cli@<the @lablup/ui-common version>
```

Under pnpm 11, allow or decline the Astryx packages' postinstall (it only
prints an `astryx init` nudge) in `pnpm-workspace.yaml`, or the install stops
with `ERR_PNPM_IGNORED_BUILDS` (`ui-common upgrade` adds the entries a pnpm
project does not decide yet):

```yaml
allowBuilds:
  "@astryxdesign/core": false
  "@astryxdesign/cli": false
```

Then:

```
pnpm exec ui-common component Button     # any Astryx command: component, search,
pnpm exec ui-common search "date picker" # docs, build, template, theme, hook, ...
pnpm exec ui-common agents --write AGENTS.md
pnpm exec ui-common upgrade --from 0.1 --dry-run
```

| Command                                                                                                      | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui-common <astryx command> …`                                                                               | Runs the pinned Astryx CLI and rewrites its output to ui-common: `@astryxdesign/core/<X>` is `@lablup/ui-common/<X>`, `@astryxdesign/lab` is `@lablup/ui-common/lab`, `@astryxdesign/theme-neutral` is `@lablup/ui-common/theme/neutral`, and commands read `ui-common …`. A name ui-common hides gets a note ("Use Modal, not Dialog"). `--json` output stays valid JSON; the note goes to stderr. The exit code is Astryx's.                                                           |
| `ui-common astryx …`                                                                                         | The same, without rewriting.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `ui-common agents [--write <file>] [--check]`                                                                | Prints the agent block: Astryx's `init --features agents` block, rewritten, plus ui-common's rules. It sits between `<!-- UI-COMMON:START -->` and `<!-- UI-COMMON:END -->`, which `astryx init` never touches. `--write` replaces the block in place and keeps the rest of the file; `--check` exits 1 when it is stale.                                                                                                                                                                |
| `ui-common upgrade [--from <v>] [--to <v>] [--dry-run] [--diff] [--report <path>] [--scan <path>]… [paths…]` | Runs the codemods between two ui-common versions over `src/` (or `paths`), updates `package.json`, and writes `ui-common-upgrade-report.md` (a `--dry-run` writes nothing and prints the report, unless `--report` names a file). The report's manual-review findings come from the whole project (tests, e2e specs, scripts), or only from the `--scan` paths. `--from` defaults to the version `package.json` declares, `--to` to the CLI's own (the ui-common version it ships with). |
| `ui-common sync-astryx <version> [--lab <v>] [--as <v>] [--dry-run]`                                         | Maintainers only; see [CONTRIBUTING.md](CONTRIBUTING.md#bumping-astryx).                                                                                                                                                                                                                                                                                                                                                                                                                 |

Exit codes: a passed-through command exits with Astryx's code. ui-common's own
commands exit 0 on success, 1 on a failed check or run, and 2 on bad arguments.

`component`, `search` and the other lookups find `@astryxdesign/core` through
the project's `@lablup/ui-common`, so they work in a project that depends on
ui-common (and the CLI) alone. Without the CLI installed, any command runs
one-off as `pnpm dlx @lablup/ui-common-cli <command>` (or `npx`).

ui-common is also an Astryx CLI integration: `ui-common docs ui-common` (or
`astryx docs ui-common`) explains the layer, and `ui-common component Modal`
documents ui-common's own components.

## Development

```
pnpm install
pnpm run verify      # typecheck, lint, format, boundary, theme, test, build, pack, integration
pnpm run test:watch
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/astryx.md](docs/astryx.md).

## Provenance

The initial component and token slice was extracted from an existing Lablup
product frontend. The import is clean: no upstream git history was published
here.

## License

[Apache-2.0](LICENSE). See [NOTICE](NOTICE). Astryx is MIT-licensed by Meta
Platforms, Inc. It is a dependency, not vendored.
