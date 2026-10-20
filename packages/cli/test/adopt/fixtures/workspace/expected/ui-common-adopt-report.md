# ui-common adopt report

`ui-common adopt` astryx → @lablup/ui-common 0.2.0 (@lablup/ui-common-cli 0.2.0).

Ran the codemods over 9 files under `.`, `packages/kit`, `packages/web`; searched 10 files under the project root for manual-review findings.

## Action required

- **Astryx moves from 0.6.0 to 0.7.0 in packages/kit.** @lablup/ui-common 0.2.0 is built on Astryx 0.7.0. adopt ran Astryx's codemods for that span (`migrate-native-picker-to-presentation`, `migrate-deprecated-theme-surface`, `validate-data-token-ownership`, `migrate-field-input-styling`, `preserve-bottom-sheet-content-padding`, `rename-empty-search-results-text`); review what they changed (the `astryx:` transforms under Changed files), and read Astryx's release notes for what no codemod covers.
- **Astryx moves from 0.6.2 to 0.7.0 in packages/web.** @lablup/ui-common 0.2.0 is built on Astryx 0.7.0. adopt ran Astryx's codemods for that span (`migrate-native-picker-to-presentation`, `migrate-deprecated-theme-surface`, `validate-data-token-ownership`, `migrate-field-input-styling`, `preserve-bottom-sheet-content-padding`, `rename-empty-search-results-text`); review what they changed (the `astryx:` transforms under Changed files), and read Astryx's release notes for what no codemod covers.

## Summary

| | Count |
|---|---:|
| Files changed | 9 |
| package.json changed | yes |
| TODO markers left in code | 0 |
| Manual-review findings | 0 |

## Steps

- 0.2.0: Astryx (`@astryxdesign/*`) → @lablup/ui-common

## Rewritten specifiers

| Kind | Count |
|---|---:|
| core (root) | 2 |
| core stylesheets | 2 |
| lab | 1 |
| theme-neutral/<X> | 1 |
| theme-neutral/theme.css | 1 |

## Changed files

- `packages/kit/package.json`: +5 −1, package-json
- `packages/kit/src/index.ts`: +2 −2, dialog-to-modal, specifiers
- `packages/kit/src/kit.css`: +1 −1, layer-order
- `packages/kit/src/SidePanel.tsx`: +1 −1, dialog-to-modal, specifiers
- `packages/web/index.html`: +1 −1, layer-order
- `packages/web/package.json`: +4 −0, package-json
- `packages/web/src/entry.css`: +5 −3, specifiers, layer-order
- `packages/web/src/main.tsx`: +2 −2, specifiers
- `pnpm-workspace.yaml`: +5 −0, package-json

## package.json

- packages/kit/package.json: added @lablup/ui-common 0.2.0 to peerDependencies and devDependencies: the one dependency that brings Astryx (core, theme-neutral) at the versions it pins.
- packages/kit/package.json: added @stylexjs/stylex ^0.19.0 to devDependencies: the StyleX runtime @lablup/ui-common and Astryx share.
- packages/kit/package.json: removed @astryxdesign/core from peerDependencies: @lablup/ui-common brings it, pinned.
- packages/kit/package.json: devDependencies["@astryxdesign/core"] is "catalog:", which resolves to 0.6.2; @lablup/ui-common 0.2.0 pins 0.7.0. Move that entry to 0.7.0.
- packages/kit/package.json: added @astryxdesign/lab 0.7.0-canary.97a0d31 to peerDependencies and devDependencies: @lablup/ui-common/lab needs it, and @lablup/ui-common pins the lab canary exactly.
- added overrides: "@astryxdesign/lab>@astryxdesign/core": "0.7.0" to pnpm-workspace.yaml: @astryxdesign/lab peers on a core canary, and without it the lab components run on a second copy of @astryxdesign/core.
- packages/web/package.json: added @lablup/ui-common 0.2.0 to dependencies: the one dependency that brings Astryx (core, theme-neutral) at the versions it pins.
- packages/web/package.json: added @lablup/ui-common-cli 0.2.0 to devDependencies: the `ui-common` bin (`ui-common doctor`, `ui-common agents`, the Astryx CLI in @lablup/ui-common terms), released at the same version as @lablup/ui-common.
- packages/web/package.json: dependencies["@astryxdesign/core"] is "catalog:", which resolves to 0.6.2; @lablup/ui-common 0.2.0 pins 0.7.0. Move that entry to 0.7.0.
- added @astryxdesign/core, @astryxdesign/cli to allowBuilds in pnpm-workspace.yaml, declined: their postinstall only prints an `astryx init` nudge, and pnpm 11 stops the install (ERR_PNPM_IGNORED_BUILDS) until each is allowed or declined.

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
