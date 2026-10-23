# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.19 → 0.2.0-alpha.0 (@lablup/ui-common-cli <version>).

Ran the codemods over 6 files under `src`; searched 6 files under the project root for manual-review findings.

## Action required

- **Wrap the app in `<Theme theme={lablupTheme}>` (`import { Theme } from "@lablup/ui-common"`, `import { lablupTheme } from "@lablup/ui-common/theme/lablup/built"`).** No module uses `<Theme>`, and the upgrade found no `createRoot(…).render(…)` to wrap. Without it Astryx components get no theme; pass `mode` ("light" | "dark" | "system", the default) where the app switches colour schemes.

## Summary

| | Count |
|---|---:|
| Files changed | 4 |
| package.json changed | yes |
| TODO markers left in code | 11 |
| Manual-review findings | 7 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/components/common/DataTableWrapper.tsx`: +33 −21, components
- `src/components/common/index.ts`: +13 −6, components
- `src/styles/theme.ts`: +1 −2, script-stylesheet-imports
- `src/styles/ui-common-entry.css` (new): +14 −0, stylesheet-entry

## package.json

- dependencies["@lablup/ui-common"]: "^0.1.0-alpha.19" → "^0.2.0-alpha.0".
- added @lablup/ui-common-cli 0.2.0-alpha.0 to devDependencies: the `ui-common` bin ships in its own package since 0.2, released at the same version as @lablup/ui-common.
- added @stylexjs/stylex ^0.19.0 to dependencies.

## Manual review

### TODO markers (11)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/components/common/DataTableWrapper.tsx:35` TabList renders the strip only. `tabs` (id, label, content) becomes <Tab value={id} label={label} /> children, and the active panel is rendered by the caller.
- `src/components/common/DataTableWrapper.tsx:51` Table idKey: idKey takes (item) or a property name; the index argument is gone.
- `src/components/common/DataTableWrapper.tsx:52` Table columns: rename id→key, render→renderCell, initialWidth→width; renderCell takes the row item, and width is pixel()/proportional() from @lablup/ui-common/Table.
- `src/components/common/DataTableWrapper.tsx:53` loading, loadingState and emptyState: render them around the Table.
- `src/components/common/DataTableWrapper.tsx:54` onRowClick, isRowClickable and rowClassName: use the row-interaction plugin or children mode.
- `src/components/common/DataTableWrapper.tsx:69` Drawer renders no header: compose DrawerHeader (title and close button) and the footer inside children.
- `src/components/common/DataTableWrapper.tsx:70` preventDismiss and onDismissAttempt: decline the close in onOpenChange.
- `src/components/common/index.ts:2` re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
- `src/components/common/index.ts:4` re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
- `src/components/common/index.ts:8` re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
- `src/components/common/index.ts:13` re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.

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

### 0.1 theme switches and theme selectors (2)

0.1 switched themes by stylesheet and `html[data-theme="orange-…"]`. In 0.2 `<Theme theme={lablupTheme} mode=…>` owns `html[data-theme]` and sets it to `light` or `dark`, so code that writes another value fights it, and selectors on another value never match.

| Where | What | Detail |
|---|---|---|
| `src/styles/families.css:1` | `[data-theme="orange-light"] .tabs__tab--active {` | data-theme = "orange-light": `<Theme>` only ever sets `html[data-theme]` to "light" or "dark": select on `html[data-theme="dark"]` (or "light"), and put brand colours in the theme. |
| `src/styles/theme.ts:5` | `export const THEMES = ["orange-light", "orange-dark"] as const;` | 0.1 theme name "orange-light". `<Theme>` sets `html[data-theme]` to "light" or "dark" itself: pass the mode as `<Theme theme={lablupTheme} mode="light" \| "dark" \| "system">` instead of writing the attribute. |

### 0.1 class names your own CSS also defines (lower confidence) (0)

None.

### Local wrappers around 0.1 components (0)

None.

### 0.1 stylesheet paths left in place (0)

None.

## Notes

- Imports through `@/` (1) did not resolve: the upgrade reads relative imports and tsconfig `paths`, not bundler aliases. Elements of 0.1 components imported through a project barrel that way were not migrated; check those modules by hand.
- DataTable → Table (@lablup/ui-common/Table). Sorting, column resizing, column visibility and persisted column state are Table plugins (`plugins`), not props. loading, loadingState and emptyState: render them around the Table. onRowClick, isRowClickable and rowClassName: use the row-interaction plugin or children mode. The .data-table classes are gone.
- Drawer → Drawer (@lablup/ui-common/Drawer). Drawer renders no header: compose DrawerHeader (title and close button) and the footer inside children. closeLabel, ariaLabelledBy and ariaDescribedBy have no counterpart. preventDismiss and onDismissAttempt: decline the close in onOpenChange. The .drawer classes are gone.
- EmptyState → EmptyState (@lablup/ui-common/EmptyState). primaryAction and secondaryAction become `actions`, a node: <Button variant="primary" label={a.label} onClick={a.onClick} /> and a secondary Button, or a Link for a secondaryAction with href. showIllustration={false}: omit `icon`. children has no slot; put it in `actions` or below the EmptyState. The title renders as an h3 by default; set headingLevel to fit the outline. The .empty-state classes are gone.
- Select → Selector (@lablup/ui-common/Selector). Selector is ui-common's Form.Item wrapper: it takes no `label`. Inside a form the enclosing Form.Item's `label` names it; on its own, `aria-label` does. invalid becomes status="error" (the border; the message belongs to Form.Item's `help`). fullWidth, onBlur and aria-describedby have no direct counterpart. Selector is not generic over the value type; onChange receives a string. The .select classes are gone.
- Tabs → TabList (@lablup/ui-common/TabList). TabList renders the strip only. `tabs` (id, label, content) becomes <Tab value={id} label={label} /> children, and the active panel is rendered by the caller. defaultTab (uncontrolled) needs caller state: TabList is controlled. groups, overflowMode, showOverflowControls, showGroupLabels and the overflow labels: TabList chooses overflow itself (`overflow`); groups have no counterpart. variant: underlined is the default; segmented maps to SegmentedControl; compact to size="sm". fillContainer becomes layout="fill". The .tabs classes are gone.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
- 1 `var(--token-*)` read left as they are. `@lablup/ui-common/legacy-tokens.css` declares the 0.1 names (deprecated, removed in 0.3).
