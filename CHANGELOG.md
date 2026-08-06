# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows the policy in [CONTRIBUTING.md](CONTRIBUTING.md#versioning).

## [Unreleased]

## [0.1.0-alpha.6]

Four places where one product's concepts had come across with the code, found
by re-reading the package against a single question: is this a rendering
component, or does it need to know something only a product knows. All four
are breaking, and they land while there is exactly one consumer.

### Changed

- **`DataTable` no longer writes to `localStorage`.** `persistKey` is replaced
  by `columnState` and `onColumnStateChange`. Where column preferences live,
  under which key, per user or per workspace, or whether they persist at all,
  is a decision only the consumer can make, and a component that answers it
  cannot be reused by a consumer that answers differently. It also stopped the
  table working anywhere `localStorage` is absent.
- **`ErrorState` takes a tone, not an error category.** `type` was
  `"network" | "configuration" | "model" | "permission" | "generic"`; `"model"`
  in particular is one product's vocabulary. All five resolved to three colours
  anyway, so the prop is now `tone: "danger" | "warning" | "accent"`, plus an
  `icon` slot. A consumer maps its own categories onto tones.
- **`EmptyState` takes an illustration, not the name of one.** The ten drawings
  that shipped here (chat, models, creations, benchmark, logs, statistics,
  schedule and the rest) are one product's information architecture; no other
  consumer has a "creations" screen to draw for. `illustration` is now a
  `ReactNode`, and the drawings move to the product that owns those screens.
  This reverses the export added in 0.1.0-alpha.3, which unblocked a consumer
  by widening the wrong side of the boundary.
- **`Tabs` no longer carries a guide-tag system.** `tag`, the deprecated
  `required`, `TabTagType`, `TabTagLabels`, `TAG_CONFIG` and `tagLabels` are
  removed. The arrangement had already split across the boundary, with the
  badge variant here and the label text passed in from the consumer's locale
  bundle, which is what a wrong boundary looks like. A consumer renders its own
  badge through the existing `TabItem.labelExtra` slot and owns both halves;
  the `.tabs__tag-badge` class stays for the styling.

### Migration

```tsx
// DataTable
- <DataTable persistKey="sessions.activeTab" ... />
+ <DataTable columnState={state} onColumnStateChange={setState} ... />

// ErrorState
- <ErrorState type="model" ... />        → tone="danger"
- <ErrorState type="network" ... />      → tone="warning"
- <ErrorState type="configuration" ... />→ tone="accent"

// EmptyState
- <EmptyState illustration="models" ... />
+ <EmptyState illustration={<ModelsIllustration />} ... />

// Tabs
- { id, label, content, tag: "beta" }
+ { id, label, content, labelExtra: <Badge variant="info">Beta</Badge> }
```

## [0.1.0-alpha.5]

### Fixed

- The build no longer mistakes a dependency stylesheet for one of its own. A
  bare specifier such as `katex/dist/katex.min.css` resolves to a path inside
  the package root, so the check meant to leave dependencies alone never fired
  and the build would stop on a stylesheet it was never meant to re-link. This
  package has no such import yet; `@lablup/ui-ai` hit it while taking the same
  fix.

## [0.1.0-alpha.4]

### Added

- `SkeletonCard`, `SkeletonText` and `SkeletonRow` take a `loadingLabel` and
  forward it to every `Skeleton` they render. `Skeleton` has always taken its
  accessible name as a prop, but the composed skeletons offered no way to pass
  one through, so every nested skeleton announced the English default however
  the consumer was translated.

## [0.1.0-alpha.3]

### Added

- The ten `EmptyState` illustrations are exported. They shipped inside the
  package from the first release but no barrel named them, so a consumer
  composing its own empty state, which is the case `EmptyState` itself cannot
  cover, had no way to reach one. Same shape as the stylesheets in
  0.1.0-alpha.1: present in the tarball, addressable by nothing.
- `IllustrationProps` is exported alongside them, so a consumer can type a
  wrapper without redeclaring it.

## [0.1.0-alpha.2]

### Changed

- The package ships the theming mechanism and one default palette rather than
  a catalogue of one product's palettes. `styles/themes/` keeps `orange-light`
  and `orange-dark`, the Lablup brand default; the eight `bliss`, `glass`,
  `reverie` and `stained` stylesheets are removed. They were byte-identical
  copies of files the source product already owns, so nothing is lost: a
  product with its own visual identity defines its own `[data-theme]` blocks
  over the same 113 token names and ships them itself.
- `styles/base.css` now carries the orange-light values for the 55 tokens a
  theme defines, so the default palette and the one shipped theme agree. The
  113 token names, the structural values, and every component are unchanged.

Removing a stylesheet path is a breaking change under the versioning policy,
which is why it lands while the package is still an alpha with one consumer
mid-migration.

## [0.1.0-alpha.1]

### Fixed

- Component stylesheets now reach the consumer. In library mode Rollup strips
  `import "./Button.css"` out of the chunk and nothing puts it back, so
  0.1.0-alpha.0 shipped all 20 component stylesheets as emitted assets that no
  chunk imported and no `exports` entry named. Every component rendered
  unstyled and there was no supported way to load the rules: a consumer
  bundling `Button` got 4.52 kB of CSS (tokens only) where it should have got
  21.06 kB. The build now re-attaches each stylesheet to the chunk whose module
  imported it, so nothing changes at the call site.
- `check:pack` now fails on a packed stylesheet that no module imports and no
  `exports` entry names, and CI asserts that a component's rules land in the
  install fixture's own bundle. Both checks were green across the defect
  because each only asked whether advertised paths resolve, never whether a
  shipped file was reachable.

## [0.1.0-alpha.0]

### Added

- Repository bootstrap: build, type-check, lint, format, test, packed-artifact
  validation, and a clean external React install fixture.
- Apache-2.0 license and the initial public boundary rules.

[Unreleased]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.6...HEAD
[0.1.0-alpha.6]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.5...v0.1.0-alpha.6
[0.1.0-alpha.5]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.4...v0.1.0-alpha.5
[0.1.0-alpha.4]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.3...v0.1.0-alpha.4
[0.1.0-alpha.3]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.0...v0.1.0-alpha.1
[0.1.0-alpha.0]: https://github.com/lablup/ui-common/releases/tag/v0.1.0-alpha.0
