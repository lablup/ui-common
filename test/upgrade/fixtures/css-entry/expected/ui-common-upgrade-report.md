# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.23 → 0.2.0-alpha.0 (installed @lablup/ui-common <version>).

Scanned 2 files under `src`.

## Summary

| | Count |
|---|---:|
| Files changed | 2 |
| package.json changed | yes |
| TODO markers left in code | 1 |
| Manual-review findings | 1 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/index.css`: +7 −3, stylesheet-entry
- `src/print.css`: +1 −0, stylesheet-entry

## package.json

- dependencies["@lablup/ui-common"]: "0.1.0-alpha.23" → "0.2.0-alpha.0".

## Manual review

### TODO markers (1)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/print.css:1` this import of styles/base.css carries "print"; replace it with @lablup/ui-common/reset.css, @lablup/ui-common/astryx.css, @lablup/ui-common/theme/lablup/theme.css, @lablup/ui-common/ui-common.css, @lablup/ui-common/legacy-tokens.css under the same condition, and declare "@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;" first.

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

### 0.1 stylesheet paths left in place (1)

Scripts, configs or tests that name `@lablup/ui-common/styles/*` directly. base.css and the orange themes are deprecated in 0.2 and removed in 0.3; the Lablup theme replaces them.

| Where | What | Detail |
|---|---|---|
| `src/print.css:2` | `@import url("@lablup/ui-common/styles/base.css") print;` | 0.1 stylesheet path: deprecated in 0.2, removed in 0.3 |

## Notes

- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
