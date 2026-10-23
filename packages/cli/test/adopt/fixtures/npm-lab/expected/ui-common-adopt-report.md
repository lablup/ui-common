# ui-common adopt report

`ui-common adopt` astryx → @lablup/ui-common 0.2.0 (@lablup/ui-common-cli 0.2.0).

Ran the codemods over 3 files under `.`; searched 3 files under the project root for manual-review findings.

## Action required

- **Astryx moves from 0.6.2 to 0.7.3.** @lablup/ui-common 0.2.0 is built on Astryx 0.7.3. adopt ran Astryx's codemods for that span (`migrate-native-picker-to-presentation`, `migrate-deprecated-theme-surface`, `validate-data-token-ownership`, `migrate-field-input-styling`, `preserve-bottom-sheet-content-padding`, `rename-empty-search-results-text`, `migrate-list-edge-compensation-to-edge`); review what they changed (the `astryx:` transforms under Changed files), and read Astryx's release notes for what no codemod covers.

## Summary

| | Count |
|---|---:|
| Files changed | 3 |
| package.json changed | yes |
| TODO markers left in code | 0 |
| Manual-review findings | 0 |

## Steps

- 0.2.0: Astryx (`@astryxdesign/*`) → @lablup/ui-common

## Rewritten specifiers

| Kind | Count |
|---|---:|
| core stylesheets | 2 |
| core/<X> | 1 |
| lab | 1 |
| lab/lab.css | 1 |

## Changed files

- `package.json`: +11 −2, package-json
- `src/Filters.jsx`: +3 −2, specifiers, drawer-from-lab
- `src/styles.css`: +4 −3, specifiers, layer-order

## package.json

- added @lablup/ui-common 0.2.0 to dependencies: the one dependency that brings Astryx (core, theme-neutral) at the versions it pins.
- added @stylexjs/stylex ^0.19.0 to dependencies: the StyleX runtime @lablup/ui-common and Astryx share.
- added @lablup/ui-common-cli 0.2.0 to devDependencies: the `ui-common` bin (`ui-common doctor`, `ui-common agents`, the Astryx CLI in @lablup/ui-common terms), released at the same version as @lablup/ui-common.
- removed @astryxdesign/theme-neutral from dependencies: @lablup/ui-common depends on it and mirrors it as @lablup/ui-common/theme/neutral.
- dependencies["@astryxdesign/lab"]: "^0.6.2-canary.c9fb1ad" → "0.7.3-canary.cac3d8d", the version @lablup/ui-common 0.2.0 pins.
- added overrides["@astryxdesign/lab"]["@astryxdesign/core"] = "0.7.3": @astryxdesign/lab peers on a core canary, and without it the lab components run on a second copy of @astryxdesign/core.

## Manual review

### TODO markers (0)

None.

### `@astryxdesign/*` imports left in place (0)

None.

### Dialog → Modal: refs (0)

None.

### Local patches on Astryx (0)

None.

### Overlays rendered into document.body (0)

None.

### Global keyboard shortcuts (0)

None.

### Escape handlers of your own (0)

None.

### Astryx agent blocks, and tools anchored on them (0)

None.

### `astryx` CLI invocations (0)

None.

### Form controls: the field chrome moves to Form.Item (0)

None.

### InternationalizationProvider without ui-common's strings (0)

None.

## Notes

- Astryx codemod "migrate-theme-catalog-to-descriptors" rewrites an Astryx integration package (Give each integration theme a typed descriptor instead of the manifest.json catalog); run `ui-common astryx upgrade` if this project is one.
- Astryx codemod "migrate-copied-themes-to-descriptors" rewrites an Astryx integration package (Give copied app themes their local descriptors); run `ui-common astryx upgrade` if this project is one.
