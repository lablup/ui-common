# Contributing to @lablup/ui-common

## Component admission

Most reusable-looking components should not be here. A component that lives in
one product can be changed by the team that owns it in an afternoon. Once it is
here, changing it means a version bump, a compatibility range, and four
consumers who did not ask for the change. That cost is worth paying only when
the component is genuinely shared.

A component is admitted when all three hold:

1. **Product-neutral.** Its props are generic view models and callbacks. If a
   prop type would have to be imported from a product API, the component is not
   ready. Reshape the props, or leave it where it is.
2. **A real second consumer.** Not "another product could use this." A specific
   product that will consume it, with someone committed to doing that. One
   consumer plus a hypothetical is one consumer.
3. **Tests travel with it.** Accessibility and behavior tests come in the same
   change. A component without tests is a component whose behavior nobody can
   safely change later, which defeats the point of sharing it.

Failing any one of these is a normal outcome. Say so in the pull request and
leave the component with its product.

### Things that are never admitted

API clients, endpoints, authentication, application state, stores, routing,
Tauri APIs, licensing, permissions, product-specific feature panels, and
anything that reads a product locale key.

## The boundary

`pnpm run check:boundary` fails the build on imports of the private AI package,
product path aliases, `react-i18next`, `@tauri-apps/*`, `zustand`, and relative
imports that escape `src/`. ESLint enforces the same set at the resolver level.

These are not style rules. Each one, if it lands, makes the package
uninstallable or unusable for at least one consumer, and it usually lands by
accident during a copy from a product repository.

## Text and labels

Never call a translation function. Every user-facing string is a prop with an
English default:

```tsx
interface DrawerProps {
  /** Accessible label for the close control. */
  closeLabel?: string; // default: "Close"
}
```

The default keeps an untranslated consumer working and accessible. The prop
lets a translated consumer pass its own string. Adding a hard-coded English
string with no prop is a bug; so is adding a prop with no default.

## Design tokens

Tokens are API. Adding one is a minor release. Renaming or removing one is a
major release, and needs the same migration note a renamed prop would get.

Always give a token a fallback so a consumer that has not adopted a theme still
renders:

```css
color: var(--token-colorText, #1a1a1a);
```

A token's inline fallback should equal its value in `src/styles/base.css`.
About 143 inherited fallbacks do not, because they came over verbatim from
the source product where they were already unreachable. Do not add new ones that
disagree, and do not "fix" the inherited ones without treating it as the
visual change it is.

Never add a token to a component without adding it to `src/styles/base.css`.
A token that only exists in a product's theme file makes the component render
correctly there and nowhere else, which is the failure mode this package
exists to prevent.

## Styling

Component CSS lives next to the component and is imported by it, so a subpath
import pulls only that component's styles. Theme families under
`src/styles/themes/` are standalone entry points that no component imports.
Do not add an import that pulls a theme file into a component; it would make
every consumer ship every theme.

## Versioning

Semver, with the public surface defined as: exported components and their
props, exported hooks, exported types, the `exports` map, the `--token-*`
contract, and the CSS entry point paths.

| Change                                                    | Release |
| --------------------------------------------------------- | ------- |
| New component, new optional prop, new token               | Minor   |
| Bug fix that keeps the rendered contract                  | Patch   |
| Removed or renamed prop, component, token, or export path | Major   |
| Changed default value that alters rendering               | Major   |
| Raised React peer range floor                             | Major   |

While the API is migrating across products, releases are prereleases
(`0.1.0-alpha.N`). Stable `1.0.0` waits until the first consumer and at least
one other have validated the contracts in a shipped build. Publishing
`1.0.0` before a second consumer exists would freeze props that only one
product has ever exercised.

## Pull requests

Run `pnpm run verify` before pushing. It is what CI runs, and it ends with
packing the real tarball and installing it into the clean external project
under `fixture/`.

For a component admission, say in the description which product is the second
consumer and who is doing that migration.

## Releasing

1. Update the version in `package.json` and add a `CHANGELOG.md` entry.
2. Merge to `main` and confirm CI is green, including the external install job.
3. Create a GitHub release tagged `v<version>`. The publish workflow verifies
   that the tag matches `package.json` and refuses to publish on a mismatch.
4. The workflow runs in the `release` environment with `packages: write` and
   the built-in `GITHUB_TOKEN`. No long-lived credential is stored here.

## Pre-public review

This repository is Internal now and becomes public once the initial import has
been reviewed. Until then, every change is held to a public bar: no internal
hostnames, credentials, customer names, unreviewed fixtures, or assets whose
redistribution rights under Apache-2.0 have not been confirmed. Check comments
and test fixtures too, not just the implementation. Those are where internal
details survive a copy.
