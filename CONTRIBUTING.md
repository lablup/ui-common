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

## Name rule

A ui-common component never shares a name with an Astryx core or lab export.
Pick a different name, or use the Astryx component.

## Components

| Component                                                      | Source                         | Built on                                    |
| -------------------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| `Modal`                                                        | `src/components/Modal/`        | `Dialog` (inline), `DialogHeader`, `Layout` |
| `PageLayout`                                                   | `src/components/PageLayout/`   | plain CSS                                   |
| `PageHeader`                                                   | `src/components/PageHeader/`   | `Heading`, `Text`, `Button`, `IconButton`   |
| `StatCard`                                                     | `src/components/StatCard/`     | `Card`, `ClickableCard`, `Text`, `Skeleton` |
| `ErrorState`                                                   | `src/components/ErrorState/`   | `Icon`, `Heading`, `Text`, `Button`         |
| `SkeletonCard`, `SkeletonText`, `SkeletonChart`, `SkeletonRow` | `src/components/Skeleton/`     | `Skeleton`                                  |
| `SmoothHeight`                                                 | `src/components/SmoothHeight/` | plain CSS                                   |
| `DigitPopIn`                                                   | `src/components/DigitPopIn/`   | plain CSS                                   |

Each has tests beside it. `src/components/componentStyles.test.ts` holds every
stylesheet to the styling rules below.

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
- English lives in code, in the `.messages.ts` file. Spread it into
  `uiCommonCatalog` in `src/i18n/catalog.ts`.
- Keep `.messages.ts` files free of React and CSS imports. The build reads the
  catalog.
- Translations go in `src/i18n/locales/<locale>.json`, named like Astryx's own
  locale files (`ko-KR.json`, `ja-JP.json`). Tests reject unknown keys and
  unknown locale names.
- Never import a product i18n runtime.

A string with no prop is a bug. So is a prop with no catalog default.

## Styling

- Plain CSS, co-located with the component and imported by it.
- Every rule inside `@layer ui-common`.
- Class names are BEM with a `uic-` prefix: `uic-page-header__title`.
- Values come from Astryx tokens, `var(--color-...)`, `var(--spacing-...)`.
  No new `--token-*` names. A component's own custom properties start with
  `--uic-`.
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

1. Change the pins in `package.json` and run `pnpm install`.
2. `pnpm run gen:exports`, and read the diff.
3. `pnpm run theme:build`.
4. Update `exports.exclude.json` if the generator reports a stale entry or a
   new data export.
5. `pnpm run verify`.
6. Note new and removed subpaths in `CHANGELOG.md`. A removed subpath is a
   breaking change.

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
