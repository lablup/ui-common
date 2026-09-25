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
  against.

Astryx itself (`@astryxdesign/core`, `@astryxdesign/theme-neutral`,
`@astryxdesign/cli`) comes in as ui-common's own dependencies, pinned exactly.
Do not add them to your project. ui-common owns the Astryx version. Two copies
of Astryx means two copies of its React contexts, and components stop seeing
the theme.

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

| Component                                                      | What it is                                            | Subpath                    |
| -------------------------------------------------------------- | ----------------------------------------------------- | -------------------------- |
| `Modal`                                                        | The dialog, in place of Astryx `Dialog`. See below.   | `/Modal`                   |
| `PageLayout`                                                   | A page's width clamp (`standard`, `wide`, `full`)     | `/components/PageLayout`   |
| `PageHeader`                                                   | A page's title, description, actions and error banner | `/components/PageHeader`   |
| `StatCard`                                                     | A dashboard metric, on Astryx `Card`                  | `/components/StatCard`     |
| `ErrorState`                                                   | A full-area error with recovery actions               | `/components/ErrorState`   |
| `SkeletonCard`, `SkeletonText`, `SkeletonChart`, `SkeletonRow` | Loading placeholders drawn with Astryx `Skeleton`     | `/components/Skeleton`     |
| `SmoothHeight`                                                 | Animates a container toward its content's height      | `/components/SmoothHeight` |
| `DigitPopIn`                                                   | A number whose characters pop in, one after another   | `/components/DigitPopIn`   |
| `usePrefersReducedMotion`                                      | The `prefers-reduced-motion` media query, as a hook   | root only                  |

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
  stack, stays visible and clickable. The band is `z-index` 1100 to 10999 by
  default; `configureModalZIndex({ base, step, max })` moves it.
- A modal opened from inside another paints above it. Only the topmost one
  traps focus and takes Escape; covered ones are `inert`. Other portalled
  surfaces can join the same stack with `useModalLevel`.
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

### What is hidden

A few Astryx subpaths are deliberately not re-exported. They are listed, with
the reason and the replacement, in [`exports.exclude.json`](exports.exclude.json).
Today that is `Dialog` (use `Modal`) and two Astryx CLI data files.

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
names need updating. [`migration/0.1-to-0.2.json`](migration/0.1-to-0.2.json)
lists every import, prop, class and stylesheet change in a form the upgrade
tool reads.

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

## Astryx CLI

ui-common is an Astryx CLI integration. A project that depends on it gets
`astryx docs ui-common`, and ui-common's guidance lines in the agent block that
`astryx init --features agents` writes. `astryx component` and `astryx search`
still need `@astryxdesign/core` resolvable from your project. If you use them,
keep core as a devDependency for tooling only.

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
