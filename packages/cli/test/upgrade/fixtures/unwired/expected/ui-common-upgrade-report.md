# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.20 → 0.2.0-alpha.0 (@lablup/ui-common-cli <version>).

Ran the codemods over 3 files under `src`; searched 3 files under the project root for manual-review findings.

## Summary

| | Count |
|---|---:|
| Files changed | 3 |
| package.json changed | yes |
| TODO markers left in code | 0 |
| Manual-review findings | 0 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/App.tsx`: +2 −6, components
- `src/main.tsx`: +1 −0, stylesheet-entry
- `src/ui-common-entry.css` (new): +14 −0, stylesheet-entry

## package.json

- dependencies["@lablup/ui-common"]: "0.1.0-alpha.20" → "0.2.0-alpha.0".
- added @lablup/ui-common-cli 0.2.0-alpha.0 to devDependencies: the `ui-common` bin ships in its own package since 0.2, released at the same version as @lablup/ui-common.
- added @stylexjs/stylex ^0.19.0 to dependencies.

## Manual review

### TODO markers (0)

None.

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

### Local wrappers around 0.1 components (0)

None.

### 0.1 stylesheet paths left in place (0)

None.

## Notes

- No file loaded @lablup/ui-common's stylesheets (0.1 components loaded their own CSS; 0.2's load none), so the upgrade wrote src/ui-common-entry.css and imported it first in src/main.tsx (the module script index.html loads). Move the import if your app loads its stylesheets elsewhere.
- Button → Button (@lablup/ui-common/Button); or IconButton (@lablup/ui-common/IconButton) when iconOnly is set; the accessible name moves from ariaLabel to label. `label` is required. A non-string child needs `label` for the accessible name and the node as children. variant="success" has no Button variant; use primary. iconPosition="right" becomes `endContent` (an Icon or Badge element only). shape="circle", inline and active have no counterpart. The .button / .button--* classes are gone; Astryx's stable class is .astryx-button.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
