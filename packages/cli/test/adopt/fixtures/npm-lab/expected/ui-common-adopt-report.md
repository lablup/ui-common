# ui-common adopt report

`ui-common adopt` astryx → @lablup/ui-common 0.2.0 (@lablup/ui-common-cli 0.2.0).

Ran the codemods over 3 files under `.`; searched 3 files under the project root for manual-review findings.

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
- `src/Filters.jsx`: +2 −2, specifiers
- `src/styles.css`: +4 −3, specifiers, layer-order

## package.json

- added @lablup/ui-common 0.2.0 to dependencies: the one dependency that brings Astryx (core, theme-neutral) at the versions it pins.
- added @stylexjs/stylex ^0.19.0 to dependencies: the StyleX runtime @lablup/ui-common and Astryx share.
- added @lablup/ui-common-cli 0.2.0 to devDependencies: the `ui-common` bin (`ui-common doctor`, `ui-common agents`, the Astryx CLI in @lablup/ui-common terms), released at the same version as @lablup/ui-common.
- removed @astryxdesign/theme-neutral from dependencies: @lablup/ui-common depends on it and mirrors it as @lablup/ui-common/theme/neutral.
- dependencies["@astryxdesign/lab"]: "^0.6.2-canary.c9fb1ad" → "0.6.2-canary.c9fb1ad", the version @lablup/ui-common 0.2.0 pins.
- added overrides["@astryxdesign/lab"]["@astryxdesign/core"] = "0.6.2": @astryxdesign/lab peers on a core canary, and without it the lab components run on a second copy of @astryxdesign/core.

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

### InternationalizationProvider without ui-common's strings (0)

None.
