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

- `src/design-system/common-adapters.tsx`: +39 −23, components
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

- `src/design-system/common-adapters.tsx:16` Button variant is dynamic; map its values onto Astryx's: primary→primary, secondary→secondary, danger→destructive, ghost→ghost, text→ghost, outline→secondary, success→(none).
- `src/design-system/common-adapters.tsx:17` Button "label" must be a string; it was the element's children.
- `src/design-system/common-adapters.tsx:55` lab Drawer `label` must be a string; it was the title.
- `src/design-system/common-adapters.tsx:56` lab Drawer renders no header: render the title, subtitle and footer inside children.
- `src/design-system/common-adapters.tsx:75` size and animated have no counterpart.
- `src/design-system/common-adapters.tsx:80` Astryx Tooltip takes no className: style the trigger, not the tooltip.

### CSS selectors on 0.1 class names (2)

A removed component's classes are gone: Astryx renders its own. Restyle through the component's props, the theme, or your `components` layer. A kept component's classes were renamed to `uic-` names (shown as →), but its markup was rebuilt on Astryx, so check the selector still means what it did. Generic names (`.button`, `.select`) may be your own classes: skip those.

| Where | What | Detail |
|---|---|---|
| `src/design-system/common-components.css:1` | `.empty-state__title` | .empty-state__title (EmptyState): gone |
| `src/index.scss:13` | `.button--primary` | .button--primary (Button): gone |

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

- Button → Button (@lablup/ui-common/Button); or IconButton (@lablup/ui-common/IconButton) when iconOnly is set; the accessible name moves from ariaLabel to label. `label` is required. A non-string child needs `label` for the accessible name and the node as children. variant="success" has no Button variant; use primary. iconPosition="right" becomes `endContent` (an Icon or Badge element only). shape="circle", inline and active have no counterpart. The .button / .button--* classes are gone; Astryx's stable class is .astryx-button.
- Drawer → Drawer (@lablup/ui-common/lab). lab Drawer renders no header: render the title, subtitle and footer inside children. closeLabel, ariaLabelledBy and ariaDescribedBy have no counterpart. preventDismiss and onDismissAttempt: decline the close in onOpenChange. The .drawer classes are gone.
- EmptyState → EmptyState (@lablup/ui-common/EmptyState). primaryAction and secondaryAction become `actions`, a node: <Button variant="primary" label={a.label} onClick={a.onClick} /> and a secondary Button, or a Link for a secondaryAction with href. showIllustration={false}: omit `icon`. children has no slot; put it in `actions` or below the EmptyState. The title renders as an h3 by default; set headingLevel to fit the outline. The .empty-state classes are gone.
- ProgressBar → ProgressBar (@lablup/ui-common/ProgressBar). value={null} becomes isIndeterminate (and no value). `label` is required and is the accessible name; the old visible `label` text maps to it with isLabelHidden when it was not shown. size and animated have no counterpart. The .progress-bar classes are gone.
- Select → Selector (@lablup/ui-common/Selector). `label` is required and is a string; a node label needs a string for the accessible name. invalid becomes status={{ type: "error" }}. fullWidth, onBlur and aria-describedby (use `description`) have no direct counterpart. Selector is not generic over the value type; onChange receives a string. The .select classes are gone.
- Skeleton → Skeleton (@lablup/ui-common/Skeleton). variant="circle" becomes radius="rounded"; variant="text" becomes height="1em"; variant="rect" is the default. Astryx Skeleton is always decorative (aria-hidden). loadingLabel and decorative are gone: put role="status" and the label on the region that waits. width and height default to 100% (was 100% and 20px). The .skeleton and .skeleton__shimmer classes are gone; Astryx's stable class is .astryx-skeleton.
- Tooltip → Tooltip (@lablup/ui-common/Tooltip). toggleable, tooltipId, tabIndex and contentClassName have no counterpart; Astryx Tooltip handles focus and touch itself (focusTrigger, touchTrigger). The .tooltip classes are gone.
- A Drawer moved to @lablup/ui-common/lab: @astryxdesign/lab is an optional peer of ui-common, pinned to the canary it is built against. The codemod added it to package.json and @lablup/ui-common/lab/lab.css to the stylesheet entry it rewrote; import lab.css yourself if your entry is elsewhere.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
