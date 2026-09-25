# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.19 → 0.2.0-alpha.0 (installed @lablup/ui-common <version>).

Scanned 4 files under `src`.

## Summary

| | Count |
|---|---:|
| Files changed | 5 |
| package.json changed | yes |
| TODO markers left in code | 6 |
| Manual-review findings | 3 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/design-system/common-adapters.tsx`: +46 −24, components
- `src/design-system/common-components.css`: +0 −2, stylesheet-entry
- `src/index.scss`: +8 −1, stylesheet-entry
- `src/main.tsx`: +1 −1, script-stylesheet-imports
- `src/ui-common-entry.css` (new): +15 −0, stylesheet-entry

## package.json

- dependencies["@lablup/ui-common"]: "0.1.0-alpha.19" → "0.2.0-alpha.0".
- added @stylexjs/stylex ^0.19.0 to dependencies.
- added @astryxdesign/lab 0.6.2-canary.c9fb1ad to dependencies: a Drawer moved to @lablup/ui-common/lab, and ui-common pins the lab canary exactly.

## Manual review

### TODO markers (6)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/design-system/common-adapters.tsx:16` Button variant is dynamic; map its values onto Astryx's: primary→primary, secondary→secondary, ghost→ghost, danger→destructive, text→ghost, outline→secondary, success→primary.
- `src/design-system/common-adapters.tsx:17` Button "label" must be a string; it was the element's children.
- `src/design-system/common-adapters.tsx:55` lab Drawer `label` must be a string (it was the title).
- `src/design-system/common-adapters.tsx:56` lab Drawer renders no title, subtitle or footer: put a Heading (and the footer) inside its children, then remove `subtitle` / `footer`.
- `src/design-system/common-adapters.tsx:75` ProgressBar "animated": Astryx ProgressBar always animates its fill.
- `src/design-system/common-adapters.tsx:86` Tooltip "className": Astryx Tooltip has no such prop; it wires the trigger and the ARIA ids itself. Style the trigger, not the tooltip.

### CSS selectors on 0.1 class names (2)

Astryx renders none of the 0.1 class names. Restyle through the component's props, the theme, or your `components` layer. Generic names (`.button`, `.select`) may be your own classes: skip those.

| Where | What | Detail |
|---|---|---|
| `src/design-system/common-components.css:1` | `.empty-state__title` | .empty-state__title (EmptyState) |
| `src/index.scss:11` | `.button--primary` | .button--primary (Button) |

### DOM hooks on 0.1 class names (0)

None.

### Tests querying 0.1 class names (0)

None.

### Module mocks of @lablup/ui-common (0)

None.

### Custom properties that collide with Astryx tokens (1)

Astryx declares the same name. Whichever rule wins the cascade now restyles both your CSS and Astryx's components. Rename yours, or set it through a theme (`defineTheme`) on purpose.

| Where | What | Detail |
|---|---|---|
| `src/design-system/common-components.css:6` | `:root { --color-error: #d4380d }` | --color-error |

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
