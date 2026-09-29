# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.23 → 0.2.0-alpha.0 (@lablup/ui-common-cli <version>).

Ran the codemods over 6 files under `src`; searched 6 files under the project root for manual-review findings.

## Summary

| | Count |
|---|---:|
| Files changed | 6 |
| package.json changed | yes |
| TODO markers left in code | 14 |
| Manual-review findings | 1 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/components/common/Select/index.tsx`: +8 −4, components
- `src/components/common/index.ts`: +6 −4, components
- `src/components/common/status.ts`: +4 −2, components
- `src/components/common/table.ts`: +3 −3, components
- `src/pages/Overview.tsx`: +14 −8, components
- `src/pages/Settings.tsx`: +1 −0, components

## package.json

- dependencies["@lablup/ui-common"]: "0.1.0-alpha.23" → "0.2.0-alpha.0".
- added @lablup/ui-common-cli 0.2.0-alpha.0 to devDependencies: the `ui-common` bin ships in its own package since 0.2, released at the same version as @lablup/ui-common.
- added @stylexjs/stylex ^0.19.0 to dependencies.

## Manual review

### TODO markers (14)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/components/common/Select/index.tsx:7` props spread into <BaseSelect> are not migrated; check them against Astryx Selector's props.
- `src/components/common/Select/index.tsx:8` `label` is required and is a string; a node label needs a string for the accessible name.
- `src/components/common/index.ts:2` re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
- `src/components/common/index.ts:4` re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
- `src/components/common/index.ts:6` type StatusKind was removed with StatusTag in 0.2 and has no Astryx counterpart.
- `src/components/common/index.ts:8` SortDirection is no longer re-exported: ./table does not export it any more (removed in 0.2, no Astryx counterpart).
- `src/components/common/status.ts:5` ProgressBar is used as a value here; props passed to it this way are not migrated to Astryx ProgressBar.
- `src/components/common/table.ts:1` type SortDirection was removed with DataTable in 0.2 and has no Astryx counterpart.
- `src/components/common/table.ts:2` SortDirection (removed with DataTable in 0.2, no Astryx counterpart) is no longer re-exported from here; modules importing it from here need a type of their own.
- `src/pages/Overview.tsx:3` type StatusKind was removed with StatusTag in 0.2 and has no Astryx counterpart; @/components/common no longer exports it.
- `src/pages/Overview.tsx:6` type SortDirection was removed with DataTable in 0.2 and has no Astryx counterpart; ../components/common no longer exports it.
- `src/pages/Overview.tsx:11` StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>.
- `src/pages/Overview.tsx:13` `label` is required and is the accessible name; the old visible `label` text maps to it with isLabelHidden when it was not shown.
- `src/pages/Settings.tsx:6` variant (default | installed | available) maps to Card variant by intent: default -> "muted", installed -> "default", available -> "muted".

### CSS selectors on 0.1 class names (0)

None.

### DOM hooks on 0.1 class names (0)

None.

### Tests querying 0.1 class names (0)

None.

### Module mocks of @lablup/ui-common (0)

None.

### Custom properties that collide with Astryx tokens (0)

None.

### 0.1 class names your own CSS also defines (lower confidence) (0)

None.

### Local wrappers around 0.1 components (1)

Your own component renders a 0.1 component and hands its props on, so it now renders the Astryx one. Its call sites pass the wrapper's props, which the upgrade does not rewrite: check the wrapper's props type and what it passes on against the Astryx component. A pure re-export (`export { Button } from …`) is not listed: its call sites were migrated.

| Where | What | Detail |
|---|---|---|
| `src/components/common/Select/index.tsx:5` | `Select` | local wrapper around Select (Astryx Selector): review its props. Imported by 1 scanned module, whose props were not migrated. |

### 0.1 stylesheet paths left in place (0)

None.

## Notes

- Imports through `~/` (2) did not resolve: the upgrade reads relative imports and tsconfig `paths`, not bundler aliases. Elements of 0.1 components imported through a project barrel that way were not migrated; check those modules by hand.
- BaseCard → Card (@lablup/ui-common/Card); or ClickableCard (@lablup/ui-common/ClickableCard) when the card has onClick or clickable; ClickableCard requires a `label` (take it from ariaLabel). variant (default | installed | available) maps to Card variant by intent: default -> "muted", installed -> "default", available -> "muted". state (loading | active | disabled | warning) has no Card counterpart; express it in the content, or use ClickableCard isDisabled for disabled. direction="row" has no Card counterpart; wrap the children in an HStack. hoverable, clickable, onKeyDown, role and tabIndex: ClickableCard owns hover, focus and keyboard activation. The .base-card classes and the --corner-accent-color property are gone.
- Button → Button (@lablup/ui-common/Button); or IconButton (@lablup/ui-common/IconButton) when iconOnly is set; the accessible name moves from ariaLabel to label. `label` is required. A non-string child needs `label` for the accessible name and the node as children. variant="success" has no Button variant; use primary. iconPosition="right" becomes `endContent` (an Icon or Badge element only). shape="circle", inline and active have no counterpart. The .button / .button--* classes are gone; Astryx's stable class is .astryx-button.
- ProgressBar → ProgressBar (@lablup/ui-common/ProgressBar). value={null} becomes isIndeterminate (and no value). `label` is required and is the accessible name; the old visible `label` text maps to it with isLabelHidden when it was not shown. size and animated have no counterpart. The .progress-bar classes are gone.
- Select → Selector (@lablup/ui-common/Selector). `label` is required and is a string; a node label needs a string for the accessible name. invalid becomes status={{ type: "error" }}. fullWidth, onBlur and aria-describedby (use `description`) have no direct counterpart. Selector is not generic over the value type; onChange receives a string. The .select classes are gone.
- StatusTag → StatusDot (@lablup/ui-common/StatusDot). StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>. size has no counterpart. The .status-tag classes and data-testid="status-tag-indicator" are gone.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
