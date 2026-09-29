# Contributing to @lablup/ui-common

Read [docs/astryx.md](docs/astryx.md) first. It explains how the package is put
together. This file lists the rules.

## What ui-common is

Astryx, mirrored 1:1, plus the Lablup theme, plus a small set of components of
its own. Astryx is the component system. ui-common adds only what Astryx does
not have.

## The Astryx surface is generated

Never hand-edit these. `scripts/gen-exports.mjs` writes them:

- `src/astryx/**`, one re-export file per Astryx subpath
- `src/index.ts`, the root barrel
- `exports` in `package.json`

Run `pnpm run gen:exports` after any of these changes:

- an `@astryxdesign/*` version bump
- an edit to `exports.exclude.json`
- an edit to `exports.customs.json`

`src/exports.test.ts` regenerates in memory and fails on any difference. So a
bump fails CI until the generator has run and someone has read the diff.

### Hiding an Astryx subpath

Add an entry to `exports.exclude.json`:

```json
{ "name": "Dialog", "replacedBy": "Modal", "reason": "..." }
```

`name` is the ui-common subpath (`Dialog`, `lab/lab.css`). `replacedBy` is what
to use instead, or `null`. The subpath disappears from the exports map, and its
names disappear from the root barrel. An entry that no longer matches an Astryx
subpath fails the generator, so stale entries get removed. So does a
`replacedBy` that is neither a custom in `exports.customs.json` nor a mirrored
subpath.

`exports` hides single names of a subpath instead of the whole of it:

```json
{
  "name": "lab",
  "exports": ["Drawer", "DrawerProps"],
  "replacedBy": "Drawer",
  "reason": "..."
}
```

The mirror file then lists the subpath's names one by one, minus these. `lab`
is always written that way, since Astryx ships it as one namespace with no
per-component subpath. A listed name the subpath no longer exports fails the
generator.

There is no other way to hide something. Do not curate the export map by hand.

### Adding a custom export

1. Build the component under `src/components/<Name>/`, with an `index.ts`.
2. Add it to `exports.customs.json`:

   ```json
   { "name": "Modal", "source": "components/Modal/index.ts", "subpath": "Modal" }
   ```

   `subpath` is optional. With it, the component also gets its own top-level
   subpath, `@lablup/ui-common/Modal`.

3. Run `pnpm run gen:exports`.

The generator refuses a custom that exports a name Astryx core or lab also
exports. Two exceptions:

- The replacement of an excluded subpath may re-export that subpath's names
  unchanged, so moving an import onto it changes only the specifier. `Modal`
  re-exports `DialogHeader` this way. The generator checks that the name
  resolves to Astryx's own declaration, not to something else of that name.
- Entries marked `legacy` may collide, and Astryx's export wins in the root
  barrel. The mechanism is kept for a future deprecation; no entry uses it
  since the 0.1 look-alikes were removed.
- A fork (below) keeps Astryx's names, because its exclusion takes Astryx's
  out of the mirror first.

## Name rule

A ui-common component never shares a name with an Astryx core or lab export.
Pick a different name, or use the Astryx component.

The one exception is a fork.

## Forks of Astryx components

A fork is a copy of an Astryx component with an upstream fix applied, shipped
under Astryx's own name and import path until Astryx ships the fix. It exists
because a product's pnpm `patchedDependencies` never reach that product's
consumers, and ui-common's consumers import Astryx through ui-common.

| Fork              | Where                               | Fix                                                                                       | Upstream                                                             |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `ComplexSelector` | `@lablup/ui-common/ComplexSelector` | `hasClear` / `onClear`                                                                    | [facebook/astryx#6362](https://github.com/facebook/astryx/pull/6362) |
| `Drawer`          | `@lablup/ui-common/lab`             | Escape goes through core's layer-dismissal stack (see below); `aria-modal` passes through | not filed                                                            |
| `Tour`            | `@lablup/ui-common/lab`             | a step's highlight is promoted once (StrictMode)                                          | not filed                                                            |

`Drawer` is more than a fix: lab's drawer handles Escape itself, ahead of
core's layer-dismissal stack, so an Escape in a popover, selector or modal
inside it closed the drawer too. The fork registers with the stack through
`useLayerDismissal`, as core's `Dialog` does, so one press closes only the
top-most layer. A deliberate consequence: a non-modal drawer closes on Escape
wherever focus is, not only while focus is inside it. Keep this change on a
bump until lab's `Drawer` joins the stack itself (its "still differs from
lab's" test fails then); `provenance.json` records it as `notes`.

How one is put together:

- **Source** is in `src/forks/<Name>/`, lab's too: upstream's
  source (`astryx swizzle <Name>` rewrites its imports to public subpaths),
  the fix, and a header saying what changed. An internal Astryx does not
  export is inlined from the same version.
- **Styles** are not compiled here. `<Name>.styles.ts` holds the StyleX
  objects Astryx's own build compiled for the pinned version, copied from its
  `dist/` by `pnpm run sync:forks`, so the fork renders upstream's atomic class
  names and their rules arrive with `astryx.css` / `lab/lab.css`. Where
  upstream's compiler folded a `stylex.props` call into a class string, the
  fork carries that string. No new CSS, no second copy of a rule, the same
  cascade layer as upstream.
- **Exports**: an `exports.exclude.json` entry with `replacedBy` naming the
  fork, and an `exports.customs.json` entry with `fork` naming the Astryx
  module. A core fork takes the excluded subpath (`"subpath": "ComplexSelector"`)
  and must export exactly the names Astryx's does; a lab fork excludes names of
  `lab` and must export exactly those, and the generator writes them into the
  `lab` mirror. Anything else keeps the name rule.
- **Tests**: upstream's tests, run against the fork (`<Name>.test.tsx`), and
  ui-common's (`<Name>.fork.test.tsx`): the fix, markup parity with Astryx's
  component where the fix does not apply, and a test that Astryx's component
  still lacks the fix.
- **Provenance**: `src/forks/provenance.json` records the Astryx version and a
  SHA-256 of every upstream file the fork uses. The copied code is MIT; its
  licence is in `NOTICE`.

`src/forks/forks.test.ts` fails as soon as the installed Astryx differs from
the recorded version or file. On an Astryx bump:

1. If upstream now carries the fix (the "still lacks the fix" test fails, or
   the issue is closed), delete the fork: its directory, its entries in
   `exports.customs.json`, `exports.exclude.json` and `provenance.json`, and
   its row above and in NOTICE's scope. Run `pnpm run gen:exports`. Astryx's
   own component comes back under the same name.
2. Otherwise re-take upstream's new source, re-apply the fix, then run
   `node scripts/sync-forks.mjs --accept` to regenerate the styles and record
   the new version and hashes.

## Components

| Component                                                      | Source                               | Built on                                            |
| -------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------- |
| `Modal`                                                        | `src/components/Modal/`              | `Dialog` (inline), `DialogHeader`, `Layout`         |
| `PageLayout`                                                   | `src/components/PageLayout/`         | plain CSS                                           |
| `PageHeader`                                                   | `src/components/PageHeader/`         | `Heading`, `Text`, `Button`, `IconButton`           |
| `StatCard`                                                     | `src/components/StatCard/`           | `Card`, `ClickableCard`, `Text`, `Skeleton`         |
| `ErrorState`                                                   | `src/components/ErrorState/`         | `Icon`, `Heading`, `Text`, `Button`                 |
| `SkeletonCard`, `SkeletonText`, `SkeletonChart`, `SkeletonRow` | `src/components/Skeleton/`           | `Skeleton`                                          |
| `SmoothHeight`                                                 | `src/components/SmoothHeight/`       | plain CSS                                           |
| `DigitPopIn`                                                   | `src/components/DigitPopIn/`         | plain CSS                                           |
| `CountBadge`                                                   | `src/components/CountBadge/`         | `Badge`                                             |
| `DoubleBadge`                                                  | `src/components/DoubleBadge/`        | `Badge`, `HStack`                                   |
| `BooleanToken`                                                 | `src/components/BooleanToken/`       | `Token`                                             |
| `IconWithTooltip`                                              | `src/components/IconWithTooltip/`    | `Tooltip`, `Text`                                   |
| `ImageWithFallback`                                            | `src/components/ImageWithFallback/`  | plain `<img>`                                       |
| `NotificationStack`                                            | `src/components/NotificationStack/`  | `Banner`, `Button`, `ProgressBar`, `Stack`, `Text`  |
| `OverlayScrollbar`                                             | `src/components/OverlayScrollbar/`   | plain CSS                                           |
| `ConfirmPopover`                                               | `src/components/ConfirmPopover/`     | `Popover`, `Button`, `Stack`, `Text`                |
| `PagedSelector`                                                | `src/components/PagedSelector/`      | `ComplexSelector` (fork), `SelectorOption`, `Token` |
| `SelectionLabel`                                               | `src/components/SelectionLabel/`     | `Text`, `IconButton`, `HStack`                      |
| `UncontrolledInput`                                            | `src/components/UncontrolledInput/`  | `TextInput`, `NumberInput`                          |
| `AlertModal`                                                   | `src/components/AlertModal/`         | `Modal`, `Heading`, `Text`, `Button`, `Layout`      |
| `DeleteConfirmModal`                                           | `src/components/DeleteConfirmModal/` | `Modal`, `TextInput`, `Token`, `Banner`, `Text`     |
| `StepNumberInput`, `NumberStepper`                             | `src/components/StepNumberInput/`    | `InputGroup`, `NumberInput`, `Icon`                 |
| `BoardItemTitle`                                               | `src/components/BoardItemTitle/`     | `HStack`, `Heading`, `Icon`, `IconWithTooltip`      |
| `Statistic`                                                    | `src/components/Statistic/`          | `Stack`, `Text`, `Tooltip`                          |
| `DividedRow`                                                   | `src/components/DividedRow/`         | plain CSS                                           |
| `TokenList`                                                    | `src/components/TokenList/`          | `Token`, `Badge`, `Link`, `HoverCard`, `Popover`    |
| `TokenRow`                                                     | `src/components/TokenRow/`           | `Token`, `HStack`                                   |
| `NotificationItem`                                             | `src/components/NotificationItem/`   | `Stack`, `Text`                                     |
| `UnitGrid`, `UnitGridSkeleton`                                 | `src/components/UnitGrid/`           | `Stack`, `Text`, `VisuallyHidden`, `Skeleton`       |
| `ColorPicker`                                                  | `src/components/ColorPicker/`        | `Popover`, `TextInput`, `Button`                    |
| `Form` (engine, `Form.Item` shell, hooks)                      | `src/components/Form/`               | `Tooltip`, plain CSS                                |
| `BulkEditFormItem`                                             | `src/components/BulkEditFormItem/`   | `Form.Item`, `TextInput`, `Link`, `HStack`          |
| `DataGrid`, `DataGridSettingsModal`, `DataGridExportModal`     | `src/components/DataGrid/`           | `Table` + plugins, `Pagination`, `Modal`, dnd-kit   |
| `BulkErrorModal`                                               | `src/components/BulkErrorModal/`     | `Modal`, `Banner`, `DataGrid`                       |
| `ProgressWithLabel`                                            | `src/components/ProgressWithLabel/`  | `Text`, plain CSS                                   |
| `TextHighlighter`                                              | `src/components/TextHighlighter/`    | plain CSS                                           |
| `CountdownBorder`                                              | `src/components/CountdownBorder/`    | SVG, plain CSS                                      |
| `DoubleToken`                                                  | `src/components/DoubleToken/`        | `Token`, `HStack`, `TextHighlighter`                |
| `ListBanner`                                                   | `src/components/ListBanner/`         | `Banner`                                            |

Each has tests beside it. `src/components/componentStyles.test.ts` holds every
stylesheet to the styling rules below.

### Component docs for the CLI

`ui-common component <Name>` reads `astryx/components/<Name>.doc.mjs` (the
`components` root in `astryx.integration.mjs`). The Astryx CLI pairs every
doc with a same-stem `<Name>.tsx` and fails validation without one; ui-common
ships no source, so that file is one line re-exporting the component:

```tsx
export { PageHeader } from "@lablup/ui-common";
```

`src/astryxIntegration.test.ts` checks the pairing. Add a doc when you add or
change a component's props; `pnpm run check:integration` validates it.

## Component admission

Most reusable-looking components should not be here. Once a component is here,
changing it means a version bump and every consumer upgrading. That cost is
worth paying only when the component is genuinely shared.

A custom component is admitted when all of these hold:

1. **Astryx does not already do it.** Check with `astryx search` first.
2. **Product-neutral, Astryx-shaped props.** Generic view models and callbacks,
   and prop names in Astryx's vocabulary (`label`, `variant`, `isOpen`...). If
   a prop type would come from a product API, the component is not ready.
3. **Built on Astryx.** Astryx primitives and Astryx tokens. No second styling
   system.
4. **An origin consumer ships it today**, with no product dependency. Moves can
   happen in bulk, one dependency cluster at a time.
5. **Tests travel with it.** Accessibility and behavior tests come in the same
   change. A candidate without tests gets them written in the move.
6. **The name rule holds.**

Failing one of these is a normal outcome. Say so in the pull request and leave
the component with its product.

### The form engine

`Form` is the one custom that keeps a non-Astryx vocabulary. It is a
form-state API (`Form.useForm`, `rules`, `valuePropName`, `FormInstance`),
not a component prop surface, and it keeps antd's names and shapes so code
written against antd's form moves over with an import rewrite. Its
`Store` and values are `any` by design, which is why ESLint's
`no-explicit-any` is off under `src/components/Form/`.

- The state half (`FormStore`, `Field`, `List`, `validate`, `namePath`) is
  a behavioural port of rc-field-form and async-validator. Match upstream
  when fixing it: code depends on its quirks, and `Form.acceptance.test.tsx`
  pins them.
- The item shell (`FormItemVisual`) follows the Styling rules below. Its
  classes (`uic-form-item__*`) and the `data-uic-field-id` attribute are
  public: consumers' tests and CSS select on them.
- Validation messages are catalog keys (`uic.Form.*`). The engine
  interpolates rule values itself with `${label}`-style templates, so
  `buildValidateMessages` formats each ICU message with every placeholder
  standing for itself.
- The feedback glyphs are Ant Design Icons path data (MIT, see NOTICE); the
  tooltip glyph is `lucide-react`'s, a dependency.

### Dependencies of the customs

Besides Astryx, the customs depend on `lucide-react` (glyphs),
`intl-messageformat` (catalog fallback formatting) and `@dnd-kit/core`,
`@dnd-kit/sortable`, `@dnd-kit/modifiers` and `@dnd-kit/utilities`
(drag-to-reorder in `DataGridSettingsModal`; Astryx has no sortable list).
The dnd-kit packages are exact-pinned and move together. A new runtime
dependency is recorded here and in `CHANGELOG.md`.

### Things that are never admitted

API clients, endpoints, authentication, application state, stores, routing,
Tauri APIs, licensing, permissions, and product-specific feature panels.

## The boundary

`pnpm run check:boundary` fails the build on imports of the private AI package,
product path aliases, `react-i18next` and similar product i18n runtimes,
`@tauri-apps/*`, `zustand`, and relative imports that escape `src/`. ESLint
enforces the same set at the resolver level.

ui-common's own source may import `@astryxdesign/*`. Its consumers may not:
they import Astryx through ui-common. Consumers enforce that with an ESLint
`no-restricted-imports` rule on `@astryxdesign/*`.

## Strings

Every user-facing string is a prop. Its default comes from ui-common's catalog,
through Astryx's translator:

```tsx
// src/components/Modal/Modal.messages.ts
export const modalMessages = defineMessages({
  "uic.Modal.cancel": { defaultMessage: "Cancel", description: "Cancel button label" },
});

// src/components/Modal/Modal.tsx
const t = useUicTranslator();
const label = cancelLabel ?? t("uic.Modal.cancel");
```

- Keys are `uic.<Component>.<key>`.
- A generic action word whose translation does not depend on the component
  (OK, Cancel, Confirm, Retry) is a shared key, `uic.common.<key>`, in
  `src/i18n/common.messages.ts`. Use it instead of adding a component key with
  the same text. A string that names something specific to the component
  ("Deselect all", "Dismiss error") gets its own key, even when a shared key
  has the same English, because a translator needs its context.
- English lives in code, in the `.messages.ts` file. Spread it into
  `uiCommonCatalog` in `src/i18n/catalog.ts`.
- Messages are ICU MessageFormat, which Astryx's translator formats:
  `{count} selected`, `{count, plural, one {# item} other {# items}}`. Never
  i18next's `{{count}}` or `_one`/`_other` suffixes. Markup does not go in a
  message: a sentence with a styled part is a node-typed prop or a render
  slot.
- Keep `.messages.ts` files free of React and CSS imports. The build reads the
  catalog.
- Translations go in `src/i18n/locales/<locale>.json`, named like Astryx's own
  locale files (`ko-KR.json`, `ja-JP.json`). Four locales Astryx has no file
  for are named the way products hand them to Astryx's provider: `id-ID`,
  `mn-MN`, `ms-MY`, `th-TH`. Tests reject unknown keys and other locale names.
- Every key is translated in every locale file. A key a locale cannot
  translate yet goes on the allowlist in `src/i18n/useUicTranslator.test.tsx`,
  which fails once the translation lands. A component moved from a product
  brings that product's translations for every language it ships.
- Never import a product i18n runtime.

A string with no prop is a bug. So is a prop with no catalog default.

## Styling

- Plain CSS, co-located with the component and imported by it.
- Every rule inside `@layer ui-common`.
- Class names are BEM with a `uic-` prefix: `uic-page-header__title`.
- Values come from Astryx tokens, `var(--color-...)`, `var(--spacing-...)`.
  No new `--token-*` names.
- Custom properties use Astryx's naming as is, with no ui-common prefix:
  - A theme value Astryx has no token for is a theme token in Astryx's
    form, `--color-info`, and a component reads it with an Astryx fallback:
    `var(--color-info, var(--color-accent))`. The names are the ones the
    Backend.AI WebUI theme declares, so a product theme that has them needs
    no setter. The list is `THEME_EXTENSION_TOKENS` in
    `src/components/componentStyles.test.ts`.
  - A component knob (z-index, geometry, motion, a value a prop writes) is
    `--<component>-<property>`, the component name in kebab case, the form
    Astryx core uses for its own (`--dialog-dir-x`, `--spinner-color`,
    `--table-sticky-background`): `--modal-z`, `--data-grid-max-height`,
    `--unit-grid-group-1`.
  - A value that only picks a token for a variant is not a custom
    property: the variant rule reads the token.
  - A name must not be one Astryx core, lab or the neutral theme declares
    or reads, nor one the WebUI declares (`--bai-*`, `--token-*`, its theme
    tokens). `componentStyles.test.ts` fails on a collision.
- No colour literals. A length literal is allowed only where Astryx has no
  token (a media query breakpoint, a page width, a readable measure), with a
  comment saying so.
- No focus styling. Astryx primitives draw focus.
- Restyle an Astryx primitive through a `uic-` class you pass it, never through
  its `astryx-` class.
- No StyleX compile step for now. If one is added, it uses
  `classNamePrefix: "uic"`, and any exported `defineVars` uses keys that start
  with `--`. A hashed key never matches the name a consumer's compiler derives.

jsdom drops `@layer` blocks, so a test cannot read a component's cascade back
through `getComputedStyle`. Test the rendered classes and attributes, and read
the stylesheet source when a declaration itself is the contract (see the
StatCard truncation test).

## Tokens

Astryx's token set is the contract. It is versioned with the Astryx pin.

`src/legacy-tokens.css` maps the 122 old `--token-*` names onto Astryx tokens
for consumers that still read them. It is deprecated and is removed in 0.3. Do
not add names to it.

## The Lablup theme

The source is `src/theme/lablup/lablupTheme.ts`. After changing it, rebuild the
committed artifacts:

```
pnpm run theme:build
```

`pnpm run theme:check` fails when `src/theme/lablup/built/` is stale. It runs
in `verify`. Rebuild after every Astryx bump too: Astryx does not repair stale
pre-built CSS at runtime.

## Bumping Astryx

`@astryxdesign/core`, `@astryxdesign/theme-neutral` and `@astryxdesign/cli`
move together, exact-pinned. `@astryxdesign/lab` is an exact canary pin, as
both a devDependency and an optional peer.

`ui-common sync-astryx` does the bump:

```
node bin/ui-common.mjs sync-astryx 0.6.3 --dry-run   # plan, and Astryx's codemods on src/ as a dry run
node bin/ui-common.mjs sync-astryx 0.6.3 --lab 0.6.3-canary.abc1234
```

It moves the pins, runs `pnpm install`, `pnpm run gen:exports` and
`pnpm run theme:build`, runs Astryx's own codemods on `src/` (a dry run, then
applied), runs the tests, and records the Astryx codemods consumers need in
`codemods/<next version>/upstream.json` (`--as <version>` picks the version;
release under that version). `ui-common upgrade` runs them for a consumer that
crosses it, with the `@lablup/ui-common` specifiers swapped for Astryx's so
Astryx's codemods recognise them. It runs Astryx's codemods before the tests,
since a rename Astryx ships a codemod for would otherwise fail them first.

Then, by hand:

1. Read the `gen:exports` diff. Update `exports.exclude.json` if the generator
   reports a stale entry or a new data export.
2. Re-sync or delete each fork ("Forks of Astryx components");
   `src/forks/forks.test.ts` fails until you do.
3. `pnpm run verify`.
4. Note new and removed subpaths in `CHANGELOG.md`. A removed subpath is a
   breaking change.

## The upgrade tool

`ui-common upgrade` runs the steps in `codemods/registry.mjs`, keyed by the
ui-common version that made the change, over a consumer's source.

- **0.1 → 0.2** (`codemods/0.2/`) takes all of its data from
  [`migration/0.1-to-0.2.json`](migration/0.1-to-0.2.json): replacement
  imports, prop renames, value maps, required packages, stylesheet entry
  points, class renames and the manual notes its TODO markers quote. Change
  the map, not the codemods, when the migration changes.
  `codemods/0.2/legacy-classes.json` lists the 0.1 class names; regenerate it
  from a 0.1 checkout with `scripts/extract-legacy-classes.mjs`.
- **Upstream steps** are `codemods/<version>/upstream.json`, written by
  `sync-astryx`.

A codemod that cannot prove a rewrite safe leaves the code as it was, with a
`TODO(ui-common-upgrade):` comment and a report entry. `test/upgrade/` runs
every step over fixture projects and compares the result with `expected/`,
report included. After an intended change:

```
UPDATE_FIXTURES=1 pnpm vitest run test/upgrade
```

and read the diff. Fixtures are consumer code: keep them free of product
names, like the rest of this repository.

## Versioning

Semver. The public surface is: exported components and their props, exported
hooks and types, the `exports` map, the Astryx version (it defines the token
contract), and the CSS entry point paths.

| Change                                                 | Release |
| ------------------------------------------------------ | ------- |
| New component, new optional prop, new mirrored subpath | Minor   |
| Bug fix that keeps the rendered contract               | Patch   |
| Removed or renamed prop, component, or export path     | Major   |
| Astryx bump that removes or renames anything           | Major   |
| Changed default value that alters rendering            | Major   |
| Raised React or StyleX peer floor                      | Major   |

While the API is migrating, releases are prereleases (`0.2.0-alpha.N`).
Before 1.0, a breaking change bumps the minor version.

## Pull requests

Run `pnpm run verify` before pushing. It is what CI runs. CI also installs the
packed tarball into the clean project under `fixture/` and builds it.

For a component admission, say in the description which product ships it
today and who does the move.

## Releasing

1. Update the version in `package.json` and add a `CHANGELOG.md` entry.
2. Merge to `main` and confirm CI is green, including the external install job.
3. Create a GitHub release tagged `v<version>`. The publish workflow verifies
   that the tag matches `package.json` and refuses to publish on a mismatch.
4. The workflow runs in the `release` environment with `packages: write` and
   the built-in `GITHUB_TOKEN`. No long-lived credential is stored here.

## Pre-public review

This repository is held to a public bar: no internal hostnames, credentials,
customer names, unreviewed fixtures, or assets whose redistribution rights
under Apache-2.0 have not been confirmed. Check comments and test fixtures too,
not just the implementation. Those are where internal details survive a copy.
