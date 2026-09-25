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

- `src/pages/ModelsPage.tsx`: +59 −23, components

## package.json

- dependencies["@lablup/ui-common"]: "0.1.0-alpha.7" → "0.2.0-alpha.0".
- added @stylexjs/stylex ^0.19.0 to dependencies.

## Manual review

### TODO markers (10)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/pages/ModelsPage.tsx:10` type StatusKind was removed with StatusTag in 0.2 and has no Astryx counterpart.
- `src/pages/ModelsPage.tsx:44` props spread into <Button> are not migrated; check them against Astryx Button's props.
- `src/pages/ModelsPage.tsx:45` Astryx Button has no "outline" variant; mapped to "secondary".
- `src/pages/ModelsPage.tsx:46` Button "inline": Astryx Button has no "inline" variant. Use variant="ghost" size="sm", or a Link.
- `src/pages/ModelsPage.tsx:47` Button needs a string `label` (its accessible name); its children are rich content.
- `src/pages/ModelsPage.tsx:52` BaseCard "state": Card has no state; show loading/disabled/warning in its content (Skeleton, Banner).
- `src/pages/ModelsPage.tsx:59` Astryx Badge has no "primary" variant; mapped to the "orange" colour variant (tinted, not solid).
- `src/pages/ModelsPage.tsx:61` StatusDot shows no text: `label` is its accessible name only. Put a <Text> beside it if the label must stay visible.
- `src/pages/ModelsPage.tsx:74` StatusDot shows no text: `label` is its accessible name only. Put a <Text> beside it if the label must stay visible.
- `src/pages/ModelsPage.tsx:76` ProgressBar "size": Astryx ProgressBar has one size.

### CSS selectors on 0.1 class names (2)

Astryx renders none of the 0.1 class names. Restyle through the component's props, the theme, or your `components` layer. Generic names (`.button`, `.select`) may be your own classes: skip those.

| Where | What | Detail |
|---|---|---|
| `src/themes/violet.css:7` | `[data-theme="violet-light"] .button--primary:hover` | .button--primary (Button) |
| `src/themes/violet.css:11` | `.drawer__content, .my-panel` | .drawer__content (Drawer) |

### DOM hooks on 0.1 class names (1)

Scripts that find 0.1 markup by class stop matching. Use a ref, a data-testid, or the Astryx component's own API.

| Where | What | Detail |
|---|---|---|
| `src/chat/InputPopup.tsx:7` | `if (target.closest(".select__dropdown--portal")) return;` | .select__dropdown--portal (Select) |

### Tests querying 0.1 class names (2)

Query by role, label or data-testid instead.

| Where | What | Detail |
|---|---|---|
| `src/pages/ModelsPage.test.tsx:12` | `expect(container.querySelector(".button--primary")).not.toBeNull();` | .button--primary (Button) |
| `src/pages/ModelsPage.test.tsx:13` | `expect(container.firstChild).toHaveClass("page-layout");` | .page-layout (PageLayout) |

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

- Badge: the codemod keeps Badge. Astryx reserves Badge for counts and loud status; a settled value (a tag, a category, a state label) reads better as Token (`@lablup/ui-common/Token`, `label` + `color`). Decide per call site.
- Button: children became `label` (the accessible name, required). `title` became `tooltip`. Sizes collapse onto sm/md/lg (xsmall → sm).
- Select → Selector: `onChange` receives a string value. A 0.1 Select typed over a non-string value needs its own mapping.
- StatusTag → StatusDot: a dot with an accessible label, no visible text.
- Tabs → TabList and DataTable → Table are reshaped only partly: the TODO markers say what is left.
- Drawer → @lablup/ui-common/lab Drawer: `@astryxdesign/lab` is an optional peer of ui-common, pinned to the canary ui-common is built against. The codemod adds it to package.json when it moved a Drawer, and adds `@lablup/ui-common/lab/lab.css` to the stylesheet entry it rewrites; import lab.css yourself if your entry is elsewhere.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps library reads resolving until 0.3.
- 2 `var(--token-*)` reads left as they are. `@lablup/ui-common/legacy-tokens.css` declares the 0.1 names (deprecated, removed in 0.3).
