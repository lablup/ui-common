# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows the policy in [CONTRIBUTING.md](CONTRIBUTING.md#versioning).

## [Unreleased]

## [0.2.0-alpha.8]

One `Modal` focus fix.

### Fixed

- `Modal` returned focus to `<body>` instead of the opener when its content
  took focus as it mounted: the first open of a `DeleteConfirmModal` with a
  confirm field (or any autofocusing input), and every open with
  `unmountOnClose`. The opener was read after the content's autofocus had
  already run, so the modal recorded its own field as the opener. It is now
  read before the content commits, and focus returns to it on close by
  Escape, Cancel, the action or the backdrop, nested modals included.

## [0.2.0-alpha.7]

Review fixes: `Modal` now makes the page behind it inert, and the upgrade
tool stops overwriting files, capturing names and hiding lab's second core.

### Changed

- **`Modal` makes the page behind it inert** while it is open, and the
  topmost dialog is `aria-modal="true"`, as `showModal()` would make them.
  Every other child of `document.body` goes `inert` (and, where a kept
  element is nested, every sibling on the way down to it), except modal
  roots claimed through `useModalLevel` (a drawer portal's too) and elements
  marked `data-uic-modal-live`. Closing the last modal removes only the
  `inert` it set. Nested modals behave as before: only the topmost is
  interactive. **Breaking:** an overlay of the app's own that must stay
  usable over a modal (a toaster, a chat widget) needs `data-uic-modal-live`,
  and `refreshModalBackground()` if it mounts while a modal is open.
- `NotificationStack` marks its root `data-uic-modal-live`, so notices stay
  readable and dismissible over a modal.
- New exports from the root and `@lablup/ui-common/Modal`:
  `MODAL_LIVE_ATTRIBUTE` and `refreshModalBackground`.
- `ui-common upgrade --dry-run` writes nothing: it prints the report after
  the summary, and writes it only to a path given with `--report`.
- `ui-common upgrade` points `@astryxdesign/lab`'s core peer at ui-common's
  core whenever it adds lab: an `overrides` entry in the nearest
  `pnpm-workspace.yaml` (created when missing) for pnpm, in package.json for
  npm, and a report note with both recipes otherwise. README's install
  section documents the same recipes, and `ui-common sync-astryx` moves them
  with the core pin.

### Fixed

- The lab canary (`0.6.2-canary.c9fb1ad`) peers on exactly the core canary
  it was cut from, so a consumer got a second `@astryxdesign/core` and
  `@lablup/ui-common/lab` ran on it. The documented overrides resolve it to
  ui-common's core (verified with pnpm 11 and 12, and npm 11); a test fails
  when lab's peer differs from the core pin and README's recipes are missing
  or stale.
- Codemods: the Drawer `onClose` → `onOpenChange` wrapper named its
  parameter `isOpen`, capturing a handler's own `isOpen`
  (`() => { if (isOpen) close(); }` never ran). The parameter now takes a
  name the file does not use.
- Codemods: a component rename (`BaseCard` → `Card`, `Tabs` → `TabList`)
  checked only module-level names, so a function-local `const Card` captured
  the import, and locals or parameters shadowing a 0.1 name were migrated.
  The import now takes a free `Uic`-prefixed alias when any scope uses the
  new name, and only references that resolve to the import are rewritten.
- `ui-common upgrade` overwrote an existing `ui-common-entry.css` outside
  the scanned paths. A file this run did not read is never written: an
  identical entry is reused, otherwise the entry goes to
  `ui-common-entry-2.css` and the report says so. The report path is
  replaced only when it holds an earlier report.
- The SCSS rewrite put the `@layer` order above `@use`, which Sass rejects.
  It now follows the leading `@use`/`@forward` rules.
- Upstream Astryx codemods rewrote every mention of `@lablup/ui-common` and
  `@astryxdesign/core` in a file, comments and strings included; only module
  specifiers are swapped now.

## [0.2.0-alpha.6]

The last component moves from backend.ai-ui that do not wait on its theme
shim: its unit grid and its colour picker.

### Added

- **Components moved from backend.ai-ui**, with Astryx-shaped props and
  their tests, exported from the root and from
  `@lablup/ui-common/components/<Name>`:
  - `UnitGrid`: groups of unit squares packed on one lattice (`serpentine`
    or `wordwrap`), each group a tinted plate with its initial, a hover card
    (`renderGroupPopover`), an optional palette picker (`hueOverrides`,
    `onHueOverrideChange`), a legend row and a partial fill per unit. The
    seven default hues are `--uic-unit-grid-group-1` to `-7` (Astryx
    `--color-icon-*` by default), the initial's inks
    `--uic-unit-grid-ink-dark`/`-light` (`--color-on-light`/`--color-on-dark`),
    and `--uic-unit-grid-popover-z` places the hover card.
    `UnitGridSkeleton` is its loading stand-in.
  - `ColorPicker`: a hex colour field on the platform colour input, with a
    hex text field and an optional clear button (`value`, `onChange` on the
    settled colour, `hasValueLabel`, `hasClear`, `onClear`, `isDisabled`,
    `label`). `toHexColor` normalises `#rgb`, `#rrggbbaa`, `rgb()` and
    `rgba()` to `#rrggbb`. It had no tests in the origin and gets them here.
- Catalog keys `uic.UnitGrid.label`, `uic.UnitGrid.changeGroupColor`,
  `uic.UnitGrid.useColor` (ICU `{index}`), `uic.ColorPicker.label`,
  `uic.ColorPicker.hexValue`, `uic.ColorPicker.clear` and
  `uic.ColorPicker.noColor`, translated in every shipped locale from
  backend.ai-ui's locale files.

## [0.2.0-alpha.5]

Six more components move in from backend.ai-ui, the ones its theme shim
and its flex primitive held back, and Astryx `AlertDialog` is hidden behind
`AlertModal`.

### Added

- **Components moved from backend.ai-ui**, with Astryx-shaped props and
  their tests, exported from the root and from
  `@lablup/ui-common/components/<Name>`. Their layout is Astryx
  `Stack`/`HStack`/`VStack` and `@layer ui-common` CSS on Astryx tokens:
  - `BoardItemTitle`: a dashboard panel's sticky title row (`title`,
    `tooltip`, `tooltipIcon`, `endContent`); `--uic-board-item-title-z`
    sets its z-index (default 50).
  - `Statistic`: a metric with a caption, a large value and a notched usage
    bar (`label`, `value`, `total`, `unit`, `precision`, `progressMode`
    `hidden`/`placeholder`/`visible`, `progressSteps`, `color`,
    `unlimitedLabel`, `infinityLabel`).
  - `DividedRow`: a wrapping row that draws a divider between neighbours on
    the same line only (`wrap`, `rowGap`, `columnGap`, `dividerWidth`,
    `dividerColor`, `dividerInset`, `itemStyle`).
  - `TokenList`: values inline, the rest behind `+N` on hover or click
    (`items`, `maxInline`, `emptyText`, `variant`, `trigger`).
  - `TokenRow`: tokens cut off with "and N more" (`items`, `maxCount`,
    `totalCount`, `color`, `emptyText`, `moreLabel`).
  - `NotificationItem`: the title, description, actions and footer of one
    notice.
- Catalog keys `uic.Statistic.unlimited` and `uic.TokenRow.more` (ICU
  `{count}`), translated in every shipped locale from backend.ai-ui's locale
  files.

### Removed

- **Breaking:** `AlertDialog` is no longer mirrored. The
  `@lablup/ui-common/AlertDialog` subpath is gone, and `AlertDialog`,
  `AlertDialogProps`, `useImperativeAlertDialog` and
  `ImperativeAlertDialogReturn` leave the root barrel. Dialog-based surfaces
  go through `Modal`'s level stack; a raw `AlertDialog` bypasses it. Use
  `AlertModal`, which now also has the top-level subpath
  `@lablup/ui-common/AlertModal`, the way `Modal` stands in for `Dialog`.

## [0.2.0-alpha.4]

Three more components move in from backend.ai-ui: the rest of its dialog
family and its list-stepped number field.

### Added

- **Components moved from backend.ai-ui**, with Astryx-shaped props and
  their tests, exported from the root and from
  `@lablup/ui-common/components/<Name>`:
  - `AlertModal`: the WAI-ARIA alert-dialog pattern on `Modal`'s portalled
    surface and level stack (`title`, `description`, `actionLabel`,
    `onAction`, `actionVariant`, `isActionLoading`, `isActionDisabled`,
    `cancelLabel`, `isCancelDisabled`, plus `Modal`'s own props). Cancel
    takes focus first; Escape cancels, the backdrop does not. Use it instead
    of `AlertDialog` beside `Modal`.
  - `DeleteConfirmModal`: confirms a deletion on `Modal` (`items`, `target`,
    `description`, `title`, `titleIcon`, `onAction`, `actionLabel`), with a
    typed confirmation (`isConfirmInputRequired`, `confirmText`,
    `inputLabel`, `inputPlaceholder`, `isInputDisabled`) for irreversible
    deletions and `isReversible` for undoable ones. `inputLabel` takes a node
    or a function that places the confirm-text token.
  - `StepNumberInput`: a number field that steps along `steps` on its
    stepper and on ArrowUp/ArrowDown. `NumberStepper` (the stepper column for
    an `InputGroup`) and `getNextStepIndex` are exported with it.
- Catalog keys `uic.common.delete`, `uic.DeleteConfirmModal.{title,
titleMany,description,targetDescription,typeToConfirm,confirmText,
cannotBeUndone}` and `uic.NumberStepper.{increase,decrease}`, translated
  in every shipped locale from backend.ai-ui's locale files.
  `uic.DeleteConfirmModal.titleMany` is an ICU plural.
- `Modal`: `headerClassName` and `footerClassName`, class names on the
  header and footer it generates.

## [0.2.0-alpha.3]

Three more components move in from backend.ai-ui, and ui-common's strings
are translated into every language backend.ai-ui ships.

### Added

- **Components moved from backend.ai-ui**, with Astryx-shaped props and
  their tests, exported from the root and from
  `@lablup/ui-common/components/<Name>`:
  - `ConfirmPopover`: a one-click confirmation on `Popover` for reversible
    actions: `title`, `description`, `icon`, `onAction` (may be async; the
    popover closes when it resolves), `actionLabel`, `actionVariant`,
    `isActionDisabled`, `onCancel`, `cancelLabel`. Cancel takes focus first
    and focus returns to the trigger on close. Every other `Popover` prop,
    the render-prop trigger included, passes through.
  - `SelectionLabel`: "3 selected" with an optional clear button (`count`,
    `onClear`, `label`, `clearLabel`, `clearIcon`).
  - `UncontrolledInput`: a `TextInput`, or a `NumberInput` for
    `type="number"`, that calls `onCommit` on Enter and on blur only.
- Shared catalog keys `uic.common.{ok,cancel,confirm,retry}` for the generic
  action labels, and `uic.SelectionLabel.{selectedCount,clear}` and
  `uic.UncontrolledInput.label`.
- Translations for every language backend.ai-ui ships, carried over from its
  locale files: `de-DE`, `el-GR`, `es-ES`, `fi-FI`, `fr-FR`, `id-ID`,
  `it-IT`, `mn-MN`, `ms-MY`, `pl-PL`, `pt-BR`, `pt-PT`, `ru-RU`, `th-TH`,
  `tr-TR`, `vi-VN`, `zh-CN` and `zh-TW`, next to `ko-KR` and `ja-JP`.
  `id-ID`, `mn-MN`, `ms-MY` and `th-TH` have no Astryx catalog; they are the
  names backend.ai-ui gives Astryx's provider. Strings those languages have
  no translation for yet are an explicit allowlist in the catalog test.

### Changed

- **Catalog keys renamed** to the shared keys. A consumer that overrides one
  under its old name must use the new one:
  `uic.Modal.ok` → `uic.common.ok`; `uic.Modal.cancel` and
  `uic.NotificationStack.cancel` → `uic.common.cancel`;
  `uic.NotificationStack.retry` and `uic.PageHeader.retry` →
  `uic.common.retry`. The English and the `ko-KR`/`ja-JP` text are unchanged.

### Fixed

- `UncontrolledInput` with `type="number"` commits the value just entered.
  The backend.ai-ui original committed the previous one, because
  `NumberInput` reports the new value in the same event as Enter or blur.

## [0.2.0-alpha.2]

Seven components move in from backend.ai-ui, and the `ui-common` bin ships:
the Astryx CLI under ui-common's paths, the agent block, and the 0.1 → 0.2
upgrade tool.

### Added

- **Components moved from backend.ai-ui**, each built on Astryx with
  Astryx-shaped props, exported from the root and from
  `@lablup/ui-common/components/<Name>`:
  - `CountBadge`: a count or a dot overlaid on its child's top-end corner,
    with `max` overflow (`99+`), `isZeroShown`, `offset`, `size` (`sm`/`md`)
    and a named `role="status"` region. `className` goes on the wrapper.
  - `DoubleBadge`: a run of Badges welded into one chip.
  - `BooleanToken`: an on/off value as a Token (green for true), with a
    `fallback` for a value that is not a boolean.
  - `IconWithTooltip`: a glyph in an unstyled, focusable button, named by its
    Tooltip's text; `focusable={false}` renders a span.
  - `ImageWithFallback`: an `<img>` that renders a fallback node once it
    fails to load.
  - `OverlayScrollbar`: a persistent, draggable thumb drawn over a scroll
    container, which hides the native bar through
    `data-uic-overlay-scrollbar`. Its stacking order is
    `--uic-overlay-scrollbar-z`.
  - `NotificationStack`: floating Banner notices with task progress,
    Cancel/Retry and an action, auto-close that pauses on hover and focus,
    `maxVisible`, and enter/exit motion. `--uic-notification-stack-z`
    (default 11000, above Modal's band) and
    `--uic-notification-stack-inset-top` place it.
- Catalog strings `uic.BooleanToken.{true,false}` and
  `uic.NotificationStack.{cancel,retry,progress}`, with `ko-KR` and `ja-JP`
  translations.
- **The `ui-common` bin**, wrapping the Astryx CLI ui-common pins:
  - `ui-common <astryx command>` runs any Astryx command with its output
    rewritten to `@lablup/ui-common` paths and `ui-common` commands, and a note
    when it names a hidden subpath ("Use Modal, not Dialog"). `--json` stays
    valid JSON and exit codes are Astryx's. `component`, `search` and the
    other lookups work in a project that depends on ui-common alone.
    `ui-common astryx …` runs Astryx without rewriting.
  - `ui-common agents [--write <file>] [--check]` writes the agent block
    between `UI-COMMON` markers: Astryx's block, rewritten, plus ui-common's
    rules.
  - `ui-common upgrade` runs the 0.1 → 0.2 codemods from the migration map:
    imports of the removed components move to their Astryx counterparts,
    provable prop renames are applied and the rest marked
    `TODO(ui-common-upgrade)`, the `styles/base.css` import becomes the 0.2
    stylesheet set, and `package.json` gets the new version, the StyleX peer
    and, with a Drawer, the lab canary. `ui-common-upgrade-report.md` lists
    every TODO, the selectors, DOM queries and tests on 0.1 class names (with
    the `uic-` name where the component was kept), module mocks, and custom
    properties that collide with Astryx's. `--dry-run` writes only the report.
  - `ui-common sync-astryx <version>`, the maintainer's Astryx bump, which
    records the Astryx codemods consumers need for later `upgrade` runs.
- Component docs for the CLI: `ui-common component Modal`,
  `ui-common component PageHeader`, and one for each component above.

### Changed

- `migration/0.1-to-0.2.json` is corrected and extended: it records that
  `usePrefersReducedMotion` moved from `/hooks` (Astryx's hooks barrel from
  0.2) to the root, maps `SelectOption` to Astryx's `SelectorOptionData`, and
  Button `title` to `tooltip`. The codemods read all of their data from it.

## [0.2.0-alpha.1]

The component layer moves onto Astryx: the 0.1 look-alikes are gone, the
components Astryx has no counterpart for are rebuilt on it with their 0.1
props, and `Modal` takes the place of the hidden `Dialog`.
[`migration/0.1-to-0.2.json`](migration/0.1-to-0.2.json) lists every change
below in the form `ui-common upgrade` reads.

### Removed

These 0.1 components are removed, source, styles and
`@lablup/ui-common/components/<Name>` subpath alike. Each is replaced by
Astryx, reached through ui-common. 0.2.0-alpha.0 announced their removal for
0.3; it lands in 0.2 so the prerelease line never ships two components under
one name:

- `Badge`: Astryx `Badge` (`@lablup/ui-common/Badge`), or `Token` for a chip.
  `children` becomes `label`; `danger` becomes `error`.
- `BaseCard`: Astryx `Card`, or `ClickableCard` when it is clickable.
- `Button`: Astryx `Button`, or `IconButton` for an icon-only button.
  `children` becomes `label`, `disabled` `isDisabled`, `loading` `isLoading`,
  `danger` `destructive`; sizes are `sm`, `md`, `lg`.
- `DataTable`: Astryx `Table`. `rows` becomes `data`, `getRowKey` `idKey`, a
  column's `id` `key` and `render` `renderCell`. Sorting and resizing are
  Table plugins.
- `Drawer`: lab `Drawer` (`@lablup/ui-common/lab`, needs the optional
  `@astryxdesign/lab` peer). `onClose` becomes `onOpenChange`.
- `EmptyState`: Astryx `EmptyState`. `illustration` becomes `icon`; the two
  action objects become an `actions` node.
- `ProgressBar`: Astryx `ProgressBar`. `value={null}` becomes
  `isIndeterminate`; `label` is required.
- `Select`: Astryx `Selector`. `searchable` becomes `hasSearch`, `disabled`
  `isDisabled`; `label` is a required string.
- `Skeleton` (the base shape only): Astryx `Skeleton`. `variant="circle"`
  becomes `radius="rounded"`. It is always decorative; announce the wait on
  the region around it.
- `StatusTag`: Astryx `StatusDot`, with `state` mapped onto `variant` and
  `pulse` onto `isPulsing`. The dot carries the label as its accessible name
  only; render the text beside it.
- `Tabs`: Astryx `TabList`. It renders the strip; the caller renders the
  panel. `activeTab` becomes `value`, `onTabChange` `onChange`.
- `Tooltip`: Astryx `Tooltip`. `placement` `top`/`bottom` becomes
  `above`/`below`.

### Changed

- **`PageHeader`, `PageLayout`, `StatCard`, `ErrorState`, `SmoothHeight`,
  `DigitPopIn`, `SkeletonCard`, `SkeletonText`, `SkeletonChart` and
  `SkeletonRow` are rebuilt on Astryx**, with the same props. They render
  Astryx `Heading`, `Text`, `Button`, `IconButton`, `Icon`, `Card`,
  `ClickableCard` and `Skeleton`, and their styles now live in
  `@layer ui-common` and read Astryx tokens only.
- **Their class names moved to `uic-`**: `page-header` is `uic-page-header`,
  `stat-card__value` is `uic-stat-card__value`, and so on. The shapes inside
  the Skeleton composites are `uic-skeleton-shape` (on Astryx's
  `astryx-skeleton`). `ErrorState`'s `error-state__action-btn` is
  `uic-error-state__action`. DigitPopIn's tuning properties are
  `--uic-digit-pop-in-*`. StatCard no longer sets `corner-accent` or reads
  `--corner-accent-color`; its tone draws its own corner.
- **Built-in strings come from the catalog**: PageHeader's Retry and Dismiss
  labels and the Skeleton composites' loading names resolve through
  `uic.PageHeader.*` and `uic.Skeleton*.loading`. The props that set them
  still win.
- `StatCard` with `onClick` renders Astryx `ClickableCard`; its accessible name
  sits on the card's inner button.
- `ErrorState`'s default icon is Astryx's `error` glyph.

### Added

- **`Modal`**, at `@lablup/ui-common/Modal` and the root: ui-common's dialog in
  place of Astryx `Dialog`. It takes every `Dialog` prop, renders into a
  `document.body` portal so layers above the modal band stay reachable, stacks
  nested modals (only the topmost traps focus and takes Escape, through
  Astryx's layer stack), keeps content mounted while closed unless
  `unmountOnClose`, and reports each edge through `afterOpenChange`. With
  `title`, `onAction` or `footer` it lays out a header, the body and a footer
  with a primary action (pending while `onAction`'s promise runs) and Cancel.
  `ModalHeader`, `ModalPosition`, `ModalPurpose` and `ModalVariant` are
  Astryx's Dialog parts under Modal names; `DialogHeader`, `DialogPosition`,
  `DialogPurpose` and `DialogVariant` are re-exported unchanged, so a `Dialog`
  import moves by changing the specifier and `Dialog`/`DialogProps`.
  `configureModalZIndex` sets the z-index band (default 1100 to 10999) and
  `useModalLevel` lets another portalled surface join the stack.
- Catalog strings `uic.Modal.ok`, `uic.Modal.cancel`, `uic.PageHeader.retry`,
  `uic.PageHeader.dismissError` and `uic.Skeleton{Card,Text,Row,Chart}.loading`,
  with `ko-KR` and `ja-JP` translations in `ui-common-locales/`.
- `migration/0.1-to-0.2.json`, the 0.1 → 0.2 map for the upgrade tool.
- The export generator checks that an exclusion's `replacedBy` exists, and lets
  the replacement re-export the excluded subpath's own names when they resolve
  to Astryx's declaration.

## [0.2.0-alpha.0]

ui-common is now Lablup's layer on top of Astryx. This release lays the
foundation: the mirrored Astryx surface, the Lablup theme, the new stylesheets
and the string catalog. The 0.1 components stay in place for now; the ones
Astryx covers are deprecated and go in 0.3. See [docs/astryx.md](docs/astryx.md)
for the architecture.

### Breaking

- **Astryx is a dependency.** `@astryxdesign/core`, `@astryxdesign/theme-neutral`
  and `@astryxdesign/cli` 0.6.2 are exact-pinned dependencies.
  `@stylexjs/stylex` ^0.19 is a new peer. `@astryxdesign/lab`
  0.6.2-canary.c9fb1ad is an optional exact peer.
- **React 19 only.** The `react` and `react-dom` peer range is now `^19.0.0`,
  which Astryx requires. React 18 is no longer supported.
- **The root barrel is Astryx's.** `import { Button } from "@lablup/ui-common"`
  now gives Astryx's `Button`. The same holds for `Badge`, `EmptyState`,
  `ProgressBar`, `Skeleton` and `Tooltip`, and their props types. The 0.1
  components of those names are still at
  `@lablup/ui-common/components/<Name>` until 0.3.
- **`@lablup/ui-common/hooks` is Astryx's hooks.** `usePrefersReducedMotion`
  is still exported from the package root.

### Added

- **The Astryx surface, mirrored 1:1.** Every `@astryxdesign/core` subpath
  exists under the same name (`@lablup/ui-common/Button`,
  `@lablup/ui-common/Table/utils`, `@lablup/ui-common/theme/tokens.stylex`,
  `@lablup/ui-common/astryx.css`, `@lablup/ui-common/locales/<locale>.json`).
  Lab is at `@lablup/ui-common/lab` and `lab/lab.css`, and the neutral theme
  at `theme/neutral`, `theme/neutral/built` and `theme/neutral/theme.css`. The
  surface is generated by `scripts/gen-exports.mjs` and guarded by a drift
  test. `Dialog` is hidden (use `Modal` once it ships), along with two Astryx
  CLI data files; see `exports.exclude.json`.
- **The Lablup theme.** `@lablup/ui-common/theme/lablup` (source),
  `theme/lablup/built` and `theme/lablup/theme.css` (pre-built). It extends
  neutral with the orange accent (`#FF7A00` / `#DC6B03`), the 0.1 status hues,
  and the 0.1 font family name. Info is the theme-local `--uic-color-info`,
  since Astryx has no info token.
- **`@lablup/ui-common/ui-common.css`**, the global sheet, in
  `@layer ui-common`. It carries the scrollbar rules, now on Astryx tokens.
  The canonical layer order is
  `@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;`.
- **`@lablup/ui-common/legacy-tokens.css`**, a deprecated bridge. It declares
  all 122 0.1 `--token-*` names inside `@layer ui-common`, each as the matching
  Astryx token where one exists and as its 0.1 value otherwise.
- **String catalog.** `@lablup/ui-common/i18n-catalog` exports
  `uiCommonMessages`, `uiCommonCatalog` and `mergeMessages`, and
  `@lablup/ui-common/ui-common-locales/<locale>.json` ships the catalog per
  locale. Custom components resolve their built-in strings through Astryx's
  `InternationalizationProvider`, with English as the fallback. The catalog is
  empty until the first component moves its strings in.
- **Astryx CLI integration.** `astryx.integration.mjs` gives consumers
  `astryx docs ui-common` and four agent-block lines, including "Use Modal,
  not Dialog".

### Deprecated (removed in 0.3)

- The `--token-*` contract, `styles/base.css` and `styles/themes/*.css`. Use
  the Lablup theme and Astryx tokens; `legacy-tokens.css` bridges meanwhile.
- These 0.1 components, each with its Astryx replacement: `Badge` → `Badge` or
  `Token`, `BaseCard` → `Card`, `Button` → `Button`, `DataTable` → `Table`,
  `Drawer` → lab `Drawer`, `EmptyState` → `EmptyState`, `ProgressBar` →
  `ProgressBar`, `Select` → `Selector`, `Skeleton` → `Skeleton`, `StatusTag` →
  `StatusDot`, `Tabs` → `TabList`, `Tooltip` → `Tooltip`.
  `PageHeader`, `PageLayout`, `StatCard`, `ErrorState`, `SmoothHeight`,
  `DigitPopIn` and the Skeleton composites stay, and are rebuilt on Astryx.

## [0.1.0-alpha.23]

### Added

- **`DigitPopIn`, text that arrives one character at a time.** Each character
  of a formatted number rises into place from a light blur after the one
  before it, and a new `text` plays it again. The characters are hidden from
  assistive tech and a plain copy of the text is read instead, so a screen
  reader hears "1,234" rather than five glyphs. Under `prefers-reduced-motion`
  it renders the plain text. Duration, distance, stagger, blur and easing are
  custom properties on the root, so one use can retune the motion without a
  new prop.

  It is exported rather than kept inside `StatCard` because the numbers that
  want it are not all in cards: the Statistics page in `backend.ai-go` shows
  latency percentiles and cowork metrics beside its stat cards, and is the
  consumer taking it up in both places.

- **`StatCard` takes `animate="digits"`.** `animate` now also accepts
  `"count"` and `"digits"`; `true` still means the count-up it always did, so
  no existing call changes. `"digits"` renders the formatted value through
  `DigitPopIn`, and the value then clips only sideways, since a vertical clip
  would cut the characters off as they rise. String values and the loading
  state render as before.

## [0.1.0-alpha.22]

### Fixed

- **Preserved declared and resized `DataTable` column widths in the rendered
  layout (#48).** Tables now use their content width while retaining a 100%
  minimum, so short tables still fill their container and wide tables keep
  overflow inside the existing local scroll region.

## [0.1.0-alpha.21]

### Added

- **Made `DataTable` column resizing accessible to pointer and keyboard users
  (#45).** Resizable headers expose focusable separators with localized labels,
  measured current widths, finite minimum and maximum values, Arrow-key steps,
  and Home-key reset. Pointer resizing starts from the rendered header width,
  rejects secondary pointers, and safely handles cancellation and lost capture.

- **Added optional `maxWidth` and `resizeValueText` contracts to `DataTable`.**
  Consumers can set column-specific resize ceilings and localize announced pixel
  values. Existing non-resizable columns remain unbounded unless they opt into
  an explicit maximum.

### Fixed

- **Reserved a token-sized resize target without covering header content.** The
  grip now has a 32px hit area and at least 3:1 contrast in the shipped light
  and dark themes while sortable labels and controls keep their own space.

## [0.1.0-alpha.20]

### Fixed

- **Applied an explicit `minWidth` consistently in `DataTable` (#43).** Initial and
  restored widths are clamped before rendering, resize keeps the same floor,
  and header and body cells both carry it. Columns without a minimum retain
  their existing fluid sizing. Header and body cells also share logical start
  alignment by default while explicit left, right, and center values remain
  physical.

- **Moved `Drawer` focus after its visible open state commits (#43).** Changing
  an inline close callback no longer tears down focus management, while Escape
  still invokes the latest callback and focus returns to the opening control.
  Default title and description IDs are unique per mounted drawer; caller IDs
  and drawers without subtitles retain their existing contracts.

## [0.1.0-alpha.19]

### Fixed

- **A skeleton placeholder is one live region, not one per shape.** `role="status"`
  is an implicit polite live region, and every composite here filled its own
  region with `Skeleton` primitives that each carried their own. A
  `SkeletonCard` mounted seven regions for one wait, a pie `SkeletonChart` ten,
  a `SkeletonText` four.

  `SkeletonCard`, `SkeletonRow` and `SkeletonText` had it backwards twice over:
  the container carried `role="status"` with no accessible name, and
  `loadingLabel` was forwarded to every decorative child instead. The region
  that should have been announced was anonymous and the ones that should have
  been silent all carried the caller's words.

  `Skeleton` takes `decorative`, which drops the role and the label and marks
  the shape `aria-hidden` while keeping its size and shimmer. The composites
  pass it to their children and name their own container. A consumer's
  `getByRole("status", { name })` now resolves to one node, which is what a
  consumer in continuum-hub had already worked around with `getAllByRole`.

### Added

- **`Select`**, admitted through the proposal in #16: a single-select listbox
  with an optional search filter, icons, descriptions, a disabled-but-visible
  option state, a field label, and the `invalid` and `aria-describedby` props a
  form needs. The listbox is portalled, so a select near the bottom of a
  scrolling panel is not clipped by it.

  Rule 2 is what made it admissible: `backend.ai-go` and `continuum-hub` both
  ship this component with the same `SelectOption` shape and the same core
  props, and the hub's is the superset. That is why `MultiSelect` and
  `TextInput` are not here; the same check disqualified both.

  Two things changed on the way in. The empty-search line was a product locale
  key and is now `noOptionsLabel`, with an English default, the shape
  `closeLabel` and `moreTabsLabel` already use. And the focus border was drawn
  from the bare accent, which measures 2.61:1 on white in one shipped family;
  it now mixes the accent with the text colour, as this package requires of any
  border-drawn focus ring.

  Fifteen tests, which is fifteen more than either product had.

- **`--token-colorTextDisabled`, `--token-colorTextPlaceholder` and
  `--token-colorPrimaryBgHover`** in `styles/base.css`, which `Select` reads.
  The first two are `#767676` rather than the usual `#bfbfbf`: text a reader is
  expected to read is not exempt from 4.5:1, and `#bfbfbf` measures 2.2:1.

- **`Skeleton` takes `decorative`.** Off by default, so a standalone skeleton is
  still its own live region, which is the one case where the primitive really is
  the whole affordance.

## [0.1.0-alpha.18]

### Fixed

- **The tooltip is placed in the same commit that opens it.** Placement was
  measured a frame after mount, and until it landed the content sat in the DOM
  with `visibility: hidden`: painted nowhere, absent from the accessibility
  tree, and unfindable by any query that respects that tree. A consumer's test
  that focused a trigger and looked for the tooltip was racing a frame, and lost
  under load.

  It measures in a layout effect now, so the position is set before the browser
  paints and the content is never in the tree unplaced. The scroll and resize
  re-measurement moved with it.

## [0.1.0-alpha.17]

### Added

- **`StatCard` takes `labelNode`.** A stat label is not always plain text. It
  may be a glossary term carrying its own definition, a unit badge, an info
  affordance. `label` is typed `string` and is also what composes the card's
  accessible name, so a consumer that needed a node there had no way in, and
  one of them kept a 339-line copy of this component to change one element.

  `labelNode` renders in place of the label text. `label` stays required and
  stays the accessible name, because a name derived from a node is whatever
  text happens to fall out of it rather than something the consumer wrote.

## [0.1.0-alpha.16]

### Added

- **`Tooltip` takes `toggleable`, which makes the trigger a control.** With it,
  the trigger carries `role="button"` and an `aria-expanded` that tracks the
  content, and Enter and Space toggle it (both prevented from their defaults,
  since Space scrolls the page and Enter submits an enclosing form). Off by
  default, so no existing trigger changes: content that only supplements what is
  already on screen is not a control and should not claim to be one.

  It exists because a glossary term is the opposite case. The definition is
  something a reader summons deliberately, and where there is no hover at all,
  activation is how they get it. Two products had independently built exactly
  this trigger contract around one, and both would have had to give it up to
  adopt this component. Losing an affordance is not a reasonable price for
  sharing code.

## [0.1.0-alpha.15]

### Fixed

- **`Tooltip` stays anchored to its trigger while the page scrolls.** Placement
  was measured once when the tooltip opened. The content is `position: fixed`
  in a portal, so nothing moved it afterwards: scrolling with the pointer still
  on the trigger, or with focus still on it, left the tooltip sitting where the
  trigger used to be, pointing at whatever had scrolled into that spot. A
  window resize left it off the edge the same way.

  It now re-measures on scroll and on resize while it is open. Scroll listening
  is in the capture phase, since a scroll inside a container does not bubble and
  a trigger inside a scrolling panel is the common case.

- **`Tooltip` now satisfies all three parts of the WCAG criterion it cites.**
  The docblock claimed WCAG 2.1 SC 1.4.13, which requires the content to be
  dismissible, hoverable and persistent. Two of the three were missing.

  Escape now closes it, without moving the pointer or focus. Before, a tooltip
  opened by hover could only be closed by moving the pointer away, so content
  that covered what the reader was looking at had to be walked off.

  Leaving the trigger now defers the hide by a grace period instead of hiding at
  once, so the pointer can cross the 8px gap and reach the content. A direct hop
  from the trigger onto the content was already fine, because React propagates
  enter and leave through the portal, but nobody moves a pointer along that
  path: crossing the gap put the pointer over the body, which hid the tooltip
  before it could be reached. Anything the tooltip holds that is longer than a
  glance, or that has to be selected, was unreachable.

  The content also carried `pointer-events: none`, which made it unreachable
  from CSS whatever the component did: never the target of a pointer event, so
  arriving on it fired nothing and it could not be selected either. That is
  gone, and a guard keeps it gone, since jsdom does not implement the property
  and every behaviour test passes with it in place.

  The existing tests covered rendering, hover, focus and the ARIA wiring, none
  of which exercised any of this.

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

[Unreleased]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.19...HEAD
[0.1.0-alpha.19]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.18...v0.1.0-alpha.19
[0.1.0-alpha.18]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.17...v0.1.0-alpha.18
[0.1.0-alpha.17]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.16...v0.1.0-alpha.17
[0.1.0-alpha.16]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.15...v0.1.0-alpha.16
[0.1.0-alpha.15]: https://github.com/lablup/ui-common/compare/v0.1.0-alpha.14...v0.1.0-alpha.15
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
