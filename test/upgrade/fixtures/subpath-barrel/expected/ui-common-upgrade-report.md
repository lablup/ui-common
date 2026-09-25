# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.19 → 0.2.0-alpha.0 (installed @lablup/ui-common <version>).

Scanned 6 files under `src`.

## Summary

| | Count |
|---|---:|
| Files changed | 4 |
| package.json changed | yes |
| TODO markers left in code | 9 |
| Manual-review findings | 4 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/components/common/DataTableWrapper.tsx`: +33 −23, components
- `src/components/common/index.ts`: +13 −6, components
- `src/styles/theme.ts`: +1 −2, script-stylesheet-imports
- `src/styles/ui-common-entry.css` (new): +15 −0, stylesheet-entry

## package.json

- dependencies["@lablup/ui-common"]: "^0.1.0-alpha.19" → "^0.2.0-alpha.0".
- added @stylexjs/stylex ^0.19.0 to dependencies.
- added @astryxdesign/lab 0.6.2-canary.c9fb1ad to dependencies: a Drawer moved to @lablup/ui-common/lab, and ui-common pins the lab canary exactly.

## Manual review

### TODO markers (9)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/components/common/DataTableWrapper.tsx:35` TabList renders the tab strip only: turn `tabs` into <Tab value label /> children, render the active panel yourself (was `content` / `renderPanel`), and drop `groups`, `variant`, `overflowMode`, `fillContainer` (see `ui-common component TabList`; `segmented` is SegmentedControl).
- `src/components/common/DataTableWrapper.tsx:51` Table columns are {key, header, width, align, renderCell}: rename id→key and render→renderCell, and widths use pixel()/proportional() from @lablup/ui-common/Table.
- `src/components/common/DataTableWrapper.tsx:52` Table has no emptyState, onRowClick: rebuild them with Table plugins (useTableSortable, useTableColumnResize, useTableColumnSettings) or around the table.
- `src/components/common/DataTableWrapper.tsx:67` lab Drawer renders no title, subtitle or footer: put a Heading (and the footer) inside its children, then remove `subtitle` / `footer`.
- `src/components/common/DataTableWrapper.tsx:68` Drawer "preventDismiss": lab Drawer always dismisses on Escape and scrim click; guard in onOpenChange instead.
- `src/components/common/index.ts:2` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
- `src/components/common/index.ts:4` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
- `src/components/common/index.ts:8` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
- `src/components/common/index.ts:13` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.

### CSS selectors on 0.1 class names (1)

Astryx renders none of the 0.1 class names. Restyle through the component's props, the theme, or your `components` layer. Generic names (`.button`, `.select`) may be your own classes: skip those.

| Where | What | Detail |
|---|---|---|
| `src/styles/families.css:1` | `[data-theme="orange-light"] .tabs__tab--active` | .tabs__tab--active (Tabs) |

### DOM hooks on 0.1 class names (1)

Scripts that find 0.1 markup by class stop matching. Use a ref, a data-testid, or the Astryx component's own API.

| Where | What | Detail |
|---|---|---|
| `src/reports/ReportPreviewFrame.tsx:2` | `return node.closest(".drawer") !== null;` | .drawer (Drawer) |

### Tests querying 0.1 class names (1)

Query by role, label or data-testid instead.

| Where | What | Detail |
|---|---|---|
| `src/components/common/Select.test.tsx:6` | `const trigger = container.querySelector(".select__trigger");` | .select__trigger (Select) |

### Module mocks of @lablup/ui-common (0)

None.

### Custom properties that collide with Astryx tokens (1)

Astryx declares the same name. Whichever rule wins the cascade now restyles both your CSS and Astryx's components. Rename yours, or set it through a theme (`defineTheme`) on purpose.

| Where | What | Detail |
|---|---|---|
| `src/styles/families.css:6` | `:root { --color-text-secondary: #6b7280 }` | --color-text-secondary |

### 0.1 stylesheet paths left in place (0)

None.

## Notes

- Badge: the codemod keeps Badge. Astryx reserves Badge for counts and loud status; a settled value (a tag, a category, a state label) reads better as Token (`@lablup/ui-common/Token`, `label` + `color`). Decide per call site.
- Button: children became `label` (the accessible name, required). `title` became `tooltip`. Sizes collapse onto sm/md/lg (xsmall → sm).
- Select → Selector: `onChange` receives a string value. A 0.1 Select typed over a non-string value needs its own mapping.
- StatusTag → StatusDot: a dot with an accessible label, no visible text.
- Tabs → TabList and DataTable → Table are reshaped only partly: the TODO markers say what is left.
- Drawer → @lablup/ui-common/lab Drawer: `@astryxdesign/lab` is an optional peer of ui-common, pinned to the canary ui-common is built against. The codemod adds it to package.json when it moved a Drawer, and adds `@lablup/ui-common/lab/lab.css` to the stylesheet entry it rewrites; import lab.css yourself if your entry is elsewhere.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps library reads resolving until 0.3.
- 1 `var(--token-*)` read left as they are. `@lablup/ui-common/legacy-tokens.css` declares the 0.1 names (deprecated, removed in 0.3).
