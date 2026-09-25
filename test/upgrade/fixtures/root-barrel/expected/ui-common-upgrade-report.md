# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.7 → 0.2.0-alpha.0 (installed @lablup/ui-common <version>).

Scanned 4 files under `src`.

## Summary

| | Count |
|---|---:|
| Files changed | 1 |
| package.json changed | yes |
| TODO markers left in code | 10 |
| Manual-review findings | 9 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/pages/ModelsPage.tsx`: +65 −23, components

## package.json

- dependencies["@lablup/ui-common"]: "0.1.0-alpha.7" → "0.2.0-alpha.0".
- added @stylexjs/stylex ^0.19.0 to dependencies.

## Manual review

### TODO markers (10)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/pages/ModelsPage.tsx:10` type StatusKind was removed with StatusTag in 0.2 and has no Astryx counterpart.
- `src/pages/ModelsPage.tsx:44` props spread into <Button> are not migrated; check them against Astryx Button's props.
- `src/pages/ModelsPage.tsx:45` shape="circle", inline and active have no counterpart.
- `src/pages/ModelsPage.tsx:46` `label` is required. A non-string child needs `label` for the accessible name and the node as children.
- `src/pages/ModelsPage.tsx:51` state (loading | active | disabled | warning) has no Card counterpart; express it in the content, or use ClickableCard isDisabled for disabled.
- `src/pages/ModelsPage.tsx:58` variant="primary" has no semantic Badge variant; pick `info` or a colour variant such as `orange`.
- `src/pages/ModelsPage.tsx:60` StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>.
- `src/pages/ModelsPage.tsx:73` StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>.
- `src/pages/ModelsPage.tsx:75` size and animated have no counterpart.
- `src/pages/ModelsPage.tsx:88` variant (default | installed | available) maps to Card variant by intent: default -> "muted", installed -> "default", available -> "muted".

### CSS selectors on 0.1 class names (2)

A removed component's classes are gone: Astryx renders its own. Restyle through the component's props, the theme, or your `components` layer. A kept component's classes were renamed to `uic-` names (shown as →), but its markup was rebuilt on Astryx, so check the selector still means what it did. Generic names (`.button`, `.select`) may be your own classes: skip those.

| Where | What | Detail |
|---|---|---|
| `src/themes/violet.css:7` | `[data-theme="violet-light"] .button--primary:hover` | .button--primary (Button): gone |
| `src/themes/violet.css:11` | `.drawer__content, .my-panel` | .drawer__content (Drawer): gone |

### DOM hooks on 0.1 class names (1)

Scripts that find 0.1 markup by class stop matching. Use a ref, a data-testid, or the Astryx component's own API.

| Where | What | Detail |
|---|---|---|
| `src/chat/InputPopup.tsx:7` | `if (target.closest(".select__dropdown--portal")) return;` | .select__dropdown--portal (Select): gone |

### Tests querying 0.1 class names (2)

Query by role, label or data-testid instead.

| Where | What | Detail |
|---|---|---|
| `src/pages/ModelsPage.test.tsx:12` | `expect(container.querySelector(".button--primary")).not.toBeNull();` | .button--primary (Button): gone |
| `src/pages/ModelsPage.test.tsx:13` | `expect(container.firstChild).toHaveClass("page-layout");` | .page-layout → .uic-page-layout (PageLayout) |

### Module mocks of @lablup/ui-common (1)

A mock of the root barrel now stands in for all of Astryx too, and mocked names such as Button, Badge or Select no longer match what the code imports (Astryx's, from their own subpaths). Re-check every mock factory.

| Where | What | Detail |
|---|---|---|
| `src/pages/ModelsPage.test.tsx:5` | `vi.mock("@lablup/ui-common", async (importOriginal) => ({` | @lablup/ui-common |

### Custom properties that collide with Astryx tokens (3)

Astryx declares the same name. Whichever rule wins the cascade now restyles both your CSS and Astryx's components. Rename yours, or set it through a theme (`defineTheme`) on purpose.

| Where | What | Detail |
|---|---|---|
| `src/chat/InputPopup.tsx:11` | `document.documentElement.style.setProperty("--color-error", "#c82333");` | --color-error |
| `src/themes/violet.css:3` | `[data-theme="violet-light"] { --color-border: #e0dcf5 }` | --color-border |
| `src/themes/violet.css:4` | `[data-theme="violet-light"] { --color-text-primary: #1b1535 }` | --color-text-primary |

### 0.1 stylesheet paths left in place (0)

None.

## Notes

- Badge → Badge (@lablup/ui-common/Badge); or Token (@lablup/ui-common/Token) when the badge is a removable or clickable chip rather than a status label. variant="primary" has no semantic Badge variant; pick `info` or a colour variant such as `orange`. size (small | medium) has no Badge counterpart; drop it. The .badge / .badge--* classes are gone; Astryx's stable class is .astryx-badge.
- BaseCard → Card (@lablup/ui-common/Card); or ClickableCard (@lablup/ui-common/ClickableCard) when the card has onClick or clickable; ClickableCard requires a `label` (take it from ariaLabel). variant (default | installed | available) maps to Card variant by intent: default -> "muted", installed -> "default", available -> "muted". state (loading | active | disabled | warning) has no Card counterpart; express it in the content, or use ClickableCard isDisabled for disabled. direction="row" has no Card counterpart; wrap the children in an HStack. hoverable, clickable, onKeyDown, role and tabIndex: ClickableCard owns hover, focus and keyboard activation. The .base-card classes and the --corner-accent-color property are gone.
- Button → Button (@lablup/ui-common/Button); or IconButton (@lablup/ui-common/IconButton) when iconOnly is set; the accessible name moves from ariaLabel to label. `label` is required. A non-string child needs `label` for the accessible name and the node as children. variant="success" has no Button variant; use primary. iconPosition="right" becomes `endContent` (an Icon or Badge element only). shape="circle", inline and active have no counterpart. The .button / .button--* classes are gone; Astryx's stable class is .astryx-button.
- ProgressBar → ProgressBar (@lablup/ui-common/ProgressBar). value={null} becomes isIndeterminate (and no value). `label` is required and is the accessible name; the old visible `label` text maps to it with isLabelHidden when it was not shown. size and animated have no counterpart. The .progress-bar classes are gone.
- StatusTag → StatusDot (@lablup/ui-common/StatusDot). StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>. size has no counterpart. The .status-tag classes and data-testid="status-tag-indicator" are gone.
- Tooltip → Tooltip (@lablup/ui-common/Tooltip). toggleable, tooltipId, tabIndex and contentClassName have no counterpart; Astryx Tooltip handles focus and touch itself (focusTrigger, touchTrigger). The .tooltip classes are gone.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
- 2 `var(--token-*)` reads left as they are. `@lablup/ui-common/legacy-tokens.css` declares the 0.1 names (deprecated, removed in 0.3).
