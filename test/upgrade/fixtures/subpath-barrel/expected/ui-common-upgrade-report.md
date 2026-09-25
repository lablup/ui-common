# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.19 → 0.2.0-alpha.0 (installed @lablup/ui-common <version>).

Scanned 6 files under `src`.

## Summary

| | Count |
|---|---:|
| Files changed | 4 |
| package.json changed | yes |
| TODO markers left in code | 11 |
| Manual-review findings | 5 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/components/common/DataTableWrapper.tsx`: +35 −23, components
- `src/components/common/index.ts`: +13 −6, components
- `src/styles/theme.ts`: +1 −2, script-stylesheet-imports
- `src/styles/ui-common-entry.css` (new): +15 −0, stylesheet-entry

## package.json

- dependencies["@lablup/ui-common"]: "^0.1.0-alpha.19" → "^0.2.0-alpha.0".
- added @stylexjs/stylex ^0.19.0 to dependencies.
- added @astryxdesign/lab 0.6.2-canary.c9fb1ad to dependencies: a Drawer moved to @lablup/ui-common/lab, and ui-common pins the lab canary exactly.

## Manual review

### TODO markers (11)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/components/common/DataTableWrapper.tsx:35` TabList renders the strip only. `tabs` (id, label, content) becomes <Tab value={id} label={label} /> children, and the active panel is rendered by the caller.
- `src/components/common/DataTableWrapper.tsx:51` Table idKey: idKey takes (item) or a property name; the index argument is gone.
- `src/components/common/DataTableWrapper.tsx:52` Table columns: rename id→key, render→renderCell, initialWidth→width; renderCell takes the row item, and width is pixel()/proportional() from @lablup/ui-common/Table.
- `src/components/common/DataTableWrapper.tsx:53` loading, loadingState and emptyState: render them around the Table.
- `src/components/common/DataTableWrapper.tsx:54` onRowClick, isRowClickable and rowClassName: use the row-interaction plugin or children mode.
- `src/components/common/DataTableWrapper.tsx:69` lab Drawer renders no header: render the title, subtitle and footer inside children.
- `src/components/common/DataTableWrapper.tsx:70` preventDismiss and onDismissAttempt: decline the close in onOpenChange.
- `src/components/common/index.ts:2` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
- `src/components/common/index.ts:4` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
- `src/components/common/index.ts:8` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
- `src/components/common/index.ts:13` re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.

### CSS selectors on 0.1 class names (2)

A removed component's classes are gone: Astryx renders its own. Restyle through the component's props, the theme, or your `components` layer. A kept component's classes were renamed to `uic-` names (shown as →), but its markup was rebuilt on Astryx, so check the selector still means what it did. Generic names (`.button`, `.select`) may be your own classes: skip those.

| Where | What | Detail |
|---|---|---|
| `src/styles/families.css:1` | `[data-theme="orange-light"] .tabs__tab--active` | .tabs__tab--active (Tabs): gone |
| `src/styles/families.css:9` | `.page-header__title, .error-state__action-btn--primary` | .page-header__title → .uic-page-header__title (PageHeader), .error-state__action-btn--primary → .uic-error-state__action--primary |

### DOM hooks on 0.1 class names (1)

Scripts that find 0.1 markup by class stop matching. Use a ref, a data-testid, or the Astryx component's own API.

| Where | What | Detail |
|---|---|---|
| `src/reports/ReportPreviewFrame.tsx:2` | `return node.closest(".drawer") !== null;` | .drawer (Drawer): gone |

### Tests querying 0.1 class names (1)

Query by role, label or data-testid instead.

| Where | What | Detail |
|---|---|---|
| `src/components/common/Select.test.tsx:6` | `const trigger = container.querySelector(".select__trigger");` | .select__trigger (Select): gone |

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

- DataTable → Table (@lablup/ui-common/Table). Sorting, column resizing, column visibility and persisted column state are Table plugins (`plugins`), not props. loading, loadingState and emptyState: render them around the Table. onRowClick, isRowClickable and rowClassName: use the row-interaction plugin or children mode. The .data-table classes are gone.
- Drawer → Drawer (@lablup/ui-common/lab). lab Drawer renders no header: render the title, subtitle and footer inside children. closeLabel, ariaLabelledBy and ariaDescribedBy have no counterpart. preventDismiss and onDismissAttempt: decline the close in onOpenChange. The .drawer classes are gone.
- EmptyState → EmptyState (@lablup/ui-common/EmptyState). primaryAction and secondaryAction become `actions`, a node: <Button variant="primary" label={a.label} onClick={a.onClick} /> and a secondary Button, or a Link for a secondaryAction with href. showIllustration={false}: omit `icon`. children has no slot; put it in `actions` or below the EmptyState. The title renders as an h3 by default; set headingLevel to fit the outline. The .empty-state classes are gone.
- Select → Selector (@lablup/ui-common/Selector). `label` is required and is a string; a node label needs a string for the accessible name. invalid becomes status={{ type: "error" }}. fullWidth, onBlur and aria-describedby (use `description`) have no direct counterpart. Selector is not generic over the value type; onChange receives a string. The .select classes are gone.
- Tabs → TabList (@lablup/ui-common/TabList). TabList renders the strip only. `tabs` (id, label, content) becomes <Tab value={id} label={label} /> children, and the active panel is rendered by the caller. defaultTab (uncontrolled) needs caller state: TabList is controlled. groups, overflowMode, showOverflowControls, showGroupLabels and the overflow labels: TabList chooses overflow itself (`overflow`); groups have no counterpart. variant: underlined is the default; segmented maps to SegmentedControl; compact to size="sm". fillContainer becomes layout="fill". The .tabs classes are gone.
- A Drawer moved to @lablup/ui-common/lab: @astryxdesign/lab is an optional peer of ui-common, pinned to the canary it is built against. The codemod added it to package.json and @lablup/ui-common/lab/lab.css to the stylesheet entry it rewrote; import lab.css yourself if your entry is elsewhere.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
- 1 `var(--token-*)` read left as they are. `@lablup/ui-common/legacy-tokens.css` declares the 0.1 names (deprecated, removed in 0.3).
