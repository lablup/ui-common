# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows the policy in [CONTRIBUTING.md](CONTRIBUTING.md#versioning).

## [Unreleased]

## [0.1.0-alpha.14]

### Fixed

- **A control inside a clickable `DataTable` row no longer also activates the
  row.** A row with `onRowClick` that contains an Edit button had two actions
  competing for one click, and both fired: the button edited and the row also
  navigated away from the thing just edited. The same held for a nested link,
  input, or anything else focusable, and on Enter as well as click.

  The row is the fallback now, so anything more specific inside it wins. Every
  consumer had this and none could fix it from outside, since the handlers are
  the component's own.

## [0.1.0-alpha.13]

### Added

- **`DataTable` takes `isRowClickable` and `rowClassName`.** A table that mixes
  actionable and informational rows had no way to say so: `onRowClick` applied
  to every row, which meant a row that could not act on a click still carried
  the pointer affordance, a tab stop, and `role="button"`, announcing itself as
  a button it was not. `isRowClickable` narrows it, and the affordance, the tab
  stop and the role move together so the three cannot drift apart.

  `rowClassName` gives one row an extra class, for flagging a specific row
  without forking the table: a transient deep-link highlight, a stale entry, a
  row being removed. A falsy return adds nothing.

  Both are pure predicates over `(row, index)` and were contributed by a
  consumer that had been carrying them locally.

## [0.1.0-alpha.12]

### Fixed

- **A closed `Drawer` is now `inert`, not merely `aria-hidden`.** The backdrop
  carried `aria-hidden` when closed, which takes the subtree out of the
  accessibility tree but leaves its focusable children in the tab sequence. A
  keyboard user tabbing past a closed drawer landed inside an invisible form,
  with no way to tell where focus had gone. `inert` removes both, and the two
  new tests fail without it: one asserts the attribute, the other tabs across a
  closed drawer and checks focus lands on the control after it.

## [0.1.0-alpha.11]

### Added

- **`Drawer` takes a dismissal guard: `preventDismiss` and `onDismissAttempt`.**
  A drawer holding an unsaved form has to refuse Escape and a backdrop click
  without simply disabling them, or the user loses work with no signal. When
  `preventDismiss` is set, both paths shake the panel and call
  `onDismissAttempt` instead of `onClose`, so the consumer can offer an explicit
  discard. The close button and any footer control still call `onClose`
  directly, which lets a consumer route those through its own confirmation
  rather than being unable to close at all.

  The guard is read through refs so the callback keeps a stable identity. That
  matters: the focus-management effect depends on it, and if the identity
  changed the moment a form became dirty, the effect would re-run on the first
  keystroke and steal focus from the field being typed into.

  `.drawer--shaking` carries the animation and is suppressed under
  `prefers-reduced-motion`.

- **`PageHeader` takes `errorDetail`, `onRetry`, and `retryLabel`.** An error
  banner that can only be dismissed makes a transient failure look permanent.
  `onRetry` renders a Retry button before the dismiss control, and `errorDetail`
  puts the raw server text on a muted second line so a long detail does not
  crowd the message. Retry and dismiss stay two props on purpose: dismissing
  must not fire a request.

  Both were contributed by a consumer that had been carrying them locally.

## [0.1.0-alpha.10]

### Added

- **The control-height ladder: `--token-controlHeightSM` (`2rem`),
  `--token-controlHeight` (`2.5rem`), and `--token-controlHeightLG`
  (`2.75rem`).** `Button` carried two of those three as literals, so a text
  field or a picker placed beside it had no shared value to match and had to
  repeat the number by hand. That is how a filter row ends up with controls on
  three different baselines.

  `Button` now reads the SM and LG rungs. **Rendering is unchanged**: the token
  values are the literals it already used, and each call site keeps that
  literal as its inline fallback. The `1.75rem` on `.button--tiny` stays a
  literal deliberately; it is a compact inline action rather than a rung of the
  control ladder.

  The middle rung has no consumer in this package yet. It is declared with the
  other two because a ladder missing its default is not a ladder: the first
  component that needs a 40px box would otherwise invent a literal, which is
  the thing this replaces.

## [0.1.0-alpha.9]

### Added

- **`--token-fontSizeXXL` (`1.5rem`), the step above `XL` in the size ladder.**
  The ladder had `XXS` but nothing above `XL`, so a component with a large
  numeric readout had no token to reach for and took a heading token instead.
  Both products that define this name already declare `1.5rem`, so introducing
  it shifts nothing.

- **`styles/tokenContract.test.ts`.** CONTRIBUTING has always said that a token
  a component reads must be declared in `styles/base.css`, because one declared
  only in a product's theme file makes the component render correctly there and
  nowhere else. Nothing enforced it. The rule holds today, so this pins it as a
  ratchet rather than fixing anything.

### Fixed

- **`StatCard` sizes its value from the numeric ladder, not from a heading
  token.** `.stat-card__value` read `--token-fontSizeHeading2`, so the number
  followed whatever heading ladder the consuming product had chosen. A stat
  value is a numeric display rather than a heading, and the two are decisions
  about different things: one is about data, the other about prose. A consumer
  shipping the Ant Design v5 heading scale rendered the value at 30px where
  this package intends 24px, without asking for it and with no way to correct
  it that did not also move every heading in the product.

  It now reads `var(--token-fontSizeXXL, 1.5rem)`. **This shifts nothing for
  either existing consumer**: both declare `--token-fontSizeHeading2` and
  `--token-fontSizeXXL` at the same `1.5rem`, and the package's own default
  declared `1.5rem` for the heading token too. The change is worth making
  anyway, because the two names were only equal by coincidence and the
  coincidence had already broken for a third consumer.

  The two `--emphasis` variants still read heading tokens. Moving them needs a
  numeric ladder above `XXL` that no consuming product has agreed on, and
  inventing one here would be a token contract nobody asked for. The reason is
  recorded at the rule.

## [0.1.0-alpha.8]

### Added

- **`--token-scrollbarSize` (`0.5rem`) and `--token-scrollbarRadius`
  (`0.25rem`), and the scrollbar rules that read them.** `styles/base.css` had
  no scrollbar styling of any kind, so a consumer got the operating system's
  default bar on every scrollable surface and had no token to change it from.
  The four `::-webkit-scrollbar` rules cover Chromium and Safari; a `:root`
  pair of `scrollbar-width: thin` and `scrollbar-color` covers Firefox, which
  exposes no `::-webkit` pseudo-elements and would otherwise keep the OS bar
  no matter what the other four rules said. Both Firefox properties are
  inherited, so one root declaration themes every descendant and a surface
  that hides its own bar, as `Tabs.css` does, still overrides them locally.

  New tokens are a minor release. The rendering change is the part to read
  before upgrading: a consumer whose scrollbars were the OS default now gets an
  8px themed bar. Outside the alpha series that would be a major under the
  versioning policy, and it lands here for the reason `0.1.0-alpha.2`,
  `alpha.6`, and `alpha.7` each did, that the package is still an alpha with
  one consumer mid-migration.

  `styles/base.css` was until now custom properties and nothing else. This is
  the one exception, and the file header says so: a scrollbar is painted on a
  box the package does not own, so there is no component to carry the rules
  and no other place a consumer can put them once and have every scrollable
  surface inherit them.

- **`styles/scrollbar.test.ts`, a guard against a second source of truth for
  the bar's size.** `[data-theme="x"] ::-webkit-scrollbar` outranks the global
  rule on specificity, so a size declared in a theme file cannot be corrected
  from `base.css` and has to be removed instead. The source product shipped
  exactly that and paid for it on a 200px sidebar rail, where a 17px bar took
  8.5% of the width. The guard reads theme and component stylesheets as source
  text and fails on a `width` or `height` in a `::-webkit-scrollbar` rule that
  does not resolve through `--token-scrollbarSize`. Hiding a bar with
  `display: none` and scoping the shared size to one surface both stay legal,
  because neither one introduces a second size.

### Fixed

- **`StatCard` no longer cuts a long value off without an ellipsis.**
  `.stat-card` sets `overflow: hidden` so the corner accent follows the card's
  rounded corner, and `.stat-card__value` declared no `overflow`,
  `text-overflow`, `white-space`, or `min-width` of its own. A value wider than
  the card was therefore clipped silently, with nothing on screen to say that
  anything had been cut.

  The card cannot grow out of it, which is what makes this the component's
  defect rather than the consumer's: a grid track with a px floor, the usual
  `repeat(auto-fit, minmax(180px, 1fr))`, keeps its floor no matter how long
  the content is. The consumer supplies the constraint, but the component
  supplies both the clip and the unprotected value element. `.stat-card__value`
  now carries `min-width: 0`, `overflow: hidden`, `text-overflow: ellipsis`,
  and `white-space: nowrap`, so it truncates itself. `min-width: 0` is the
  load-bearing one: as a flex item the value's automatic minimum size is its
  content, so without it the element refuses to shrink and overflows instead of
  ellipsing.

  Both `--emphasis` variants inherit the fix, since each changes only
  `font-size`; `prominent` needed it most, because a larger value reaches the
  card edge sooner.

  A patch release. For a consumer whose values already fit, nothing changes.
  For one whose value was being clipped, the rendering moves from a hard cut to
  an ellipsis.

## [0.1.0-alpha.7]

### Fixed

- **Focus indicators no longer paint from the bare `--token-colorPrimary`.**
  That token is chosen for brand, not for contrast, and measured 2.37:1
  against `--token-colorFillSecondary` in this package's own default palette,
  under the 3:1 floor WCAG 2.2 SC 1.4.11 sets for the visual indicator of a
  component state. Because the defect was in the package, every consumer
  inherited it and none could fix it.

  Thirteen `outline` declarations now resolve through
  `var(--token-focusRingColor, var(--token-colorPrimary))`. Seven of them wrote
  the accent directly and bypassed the ring token entirely, so a consumer that
  corrected the token still got the failing colour. Two rings drawn as the
  element's own `border-color` take
  `color-mix(in srgb, var(--token-colorPrimary) 70%, var(--token-colorText))`;
  `.base-card:focus-within` is the one that mattered most, since it sets
  `outline: none` and its border was the whole indicator on the most-used
  primitive in the package. Worst case across ten measured palettes moves from
  2.37:1 to 4.21:1, and no palette regresses.

- A focus indicator now carries no colour fallback literal. This is a narrow,
  deliberate exception to the "always give a token a fallback" rule, recorded
  in [CONTRIBUTING.md](CONTRIBUTING.md) and in the `styles/base.css` header: a
  fixed literal cannot clear 3:1 against a surface it cannot know, so
  "renders unthemed" and "meets the contrast floor" are not both achievable
  from a constant. The decorative fallback literals are untouched, per the
  decision already recorded at `base.css:27-37`.

- The build copies only `.css` out of `src/styles`. It took the whole
  directory, so any non-stylesheet that ever landed beside the tokens shipped
  inside the tarball.

### Changed

- **`--token-focusRingColor` is `#b95b06` in `styles/base.css` and
  `styles/themes/orange-light.css`**, the 70% text mix of the brand accent
  resolved to a literal, raising the shipped default ring from 2.37:1 to
  4.18:1. `orange-dark` keeps `#ff9729`: it already measures 7.00:1, and the
  same mix would lower it to 6.42:1 for no benefit.

  This alters rendering, which the versioning policy would make a major
  release outside the alpha series. It lands here for the same reason
  0.1.0-alpha.2 and 0.1.0-alpha.6 did: the package is still an alpha with one
  consumer mid-migration, and a focus ring under the WCAG floor is not a
  contract worth preserving.

  The value is written resolved rather than as a `color-mix()` call because a
  custom property holds an unparsed token stream: an unsupported `color-mix()`
  substitutes successfully and only then invalidates the `outline` shorthand at
  computed-value time, leaving `outline-style: none` and no ring at all, with
  no `var()` fallback firing. In a `border-color` longhand the failure is the
  opposite and benign, which is why the mix stays inline there.

### Added

- `src/styles/focusIndicator.test.ts`, a contrast gate. Nothing in
  `pnpm verify` read a colour value, so a focus ring at 2.37:1 passed
  typecheck, lint, format, boundary, build and pack without complaint, which
  is how this shipped. The test resolves the token contract the way a browser
  does, composites alpha over an opaque page base, and asserts 3:1 for every
  sheet against all six surfaces a ring can land on. It also pins the two
  indicator shapes, because the defect had two spellings and only one of them
  contained the word `outline`.

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

[Unreleased]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.14...HEAD
[0.1.0-alpha.14]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.13...v0.1.0-alpha.14
[0.1.0-alpha.13]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.12...v0.1.0-alpha.13
[0.1.0-alpha.12]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.11...v0.1.0-alpha.12
[0.1.0-alpha.11]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.10...v0.1.0-alpha.11
[0.1.0-alpha.10]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.9...v0.1.0-alpha.10
[0.1.0-alpha.9]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.8...v0.1.0-alpha.9
[0.1.0-alpha.8]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.7...v0.1.0-alpha.8
[0.1.0-alpha.7]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.6...v0.1.0-alpha.7
[0.1.0-alpha.6]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.5...v0.1.0-alpha.6
[0.1.0-alpha.5]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.4...v0.1.0-alpha.5
[0.1.0-alpha.4]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.3...v0.1.0-alpha.4
[0.1.0-alpha.3]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.0...v0.1.0-alpha.1
[0.1.0-alpha.0]: https://github.com/lablup/ui-common/releases/tag/v0.1.0-alpha.0
