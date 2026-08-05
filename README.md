# @lablup/ui-common

Product-neutral UI components and design tokens shared across Lablup products.

Consumers are Lablup product frontends, including
[all-smi](https://github.com/lablup/all-smi). The package holds presentation
only. It has no API client, no application state, no router, and no
desktop-shell integration, because those differ per product and are what makes
a component impossible to share.

## Install

The package is distributed through GitHub Packages, which requires
authentication even for public packages. Point the `@lablup` scope at the
registry:

```
# .npmrc
@lablup:registry=https://npm.pkg.github.com
```

In GitHub Actions, authenticate with the built-in token:

```yaml
- uses: actions/setup-node@v5
  with:
    registry-url: https://npm.pkg.github.com
    scope: "@lablup"
env:
  NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The workflow needs `permissions: packages: read`.

Locally, use a personal access token with `read:packages`. Put it in your user
`~/.npmrc`, never in a project file.

```
pnpm add @lablup/ui-common
```

`react` and `react-dom` are peer dependencies. Version 18 and 19 are both
supported.

## Use

Import from the root, or from a component subpath when you want the smallest
possible graph:

```tsx
import { Button, StatusTag } from "@lablup/ui-common";
import { Drawer } from "@lablup/ui-common/components/Drawer";
```

Styling is opt-in and split so that importing a component never drags in every
theme:

```ts
// The token contract the components resolve against. Required.
import "@lablup/ui-common/styles/base.css";

// One theme family. Import only the ones you ship.
import "@lablup/ui-common/styles/themes/bliss-light.css";
```

Component CSS travels with the component, so a subpath import pulls only that
component's styles.

## Text is yours, not ours

No component calls a translation function or reads a locale key. Every
user-facing string is a prop with an English default:

```tsx
<Drawer isOpen={open} onClose={close} closeLabel={t("common.closeDrawer")}>
  ...
</Drawer>
```

A consumer with no i18n setup gets working, accessible English. A consumer with
translations passes them in. Neither ends up depending on the other's locale
bundle.

## Design tokens are API

Components resolve their colors, spacing, motion, radii, and shadows from
`--token-*` custom properties. Those properties are a versioned part of the
public surface: renaming or removing one is a breaking change, exactly like
renaming a prop. Every token a component reads has a fallback, so a consumer
that adopts a component without adopting a theme still renders.

## What gets in

The package is not a home for every reusable-looking component. A component is
admitted when all three hold:

1. It is product-neutral, taking generic view models and callbacks rather than
   any product's API types.
2. It has a concrete consumer in more than one product, present or committed.
3. It brings its accessibility and behavior tests with it.

Anything that fails one of these stays with the product that needs it. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## What is deliberately absent

- API clients, endpoints, and authentication.
- Application state, stores, and routing.
- Tauri APIs and plugins, and any desktop-shell assumption.
- Product locale keys and any application-global i18n instance.
- Anything from the private AI companion package. The dependency runs the
  other way, and CI fails if it ever reverses.

## Development

```
pnpm install
pnpm run verify      # typecheck, lint, format, boundary, test, build, pack
pnpm run test:watch
```

`pnpm run verify` is what CI runs. It ends by packing the real tarball and
asserting that every path in the exports map resolves inside it, then a
separate job installs that tarball into a clean external React project under
`fixture/`. Building green and being installable are different claims, and the
second is the one consumers depend on.

## Provenance

The initial component and token slice was extracted from an existing Lablup
product frontend. The import is clean: no upstream git history was published
here. The detailed migration record, including the source commit for each
imported file, lives in that product's own repository.

## License

[Apache-2.0](LICENSE). See [NOTICE](NOTICE).
