# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.0 → 0.2.0-alpha.0 (installed @lablup/ui-common <version>).

Scanned 1 file under `src`.

## Summary

| | Count |
|---|---:|
| Files changed | 1 |
| package.json changed | yes |
| TODO markers left in code | 3 |
| Manual-review findings | 0 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/chat/ReasoningBlock.tsx`: +6 −2, components

## package.json

- devDependencies["@lablup/ui-common"]: "0.1.0-alpha.0" → "0.2.0-alpha.0".
- peerDependencies["@lablup/ui-common"]: ">=0.1.0-alpha.0 <0.2.0" → "^0.2.0-alpha.0".
- peerDependencies["@lablup/ui-common"]: the range ">=0.1.0-alpha.0 <0.2.0" was replaced with "^0.2.0-alpha.0"; widen it again if this package must still accept 0.1.
- added @stylexjs/stylex ^0.19.0 to peerDependencies and devDependencies.

## Manual review

### TODO markers (3)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/chat/ReasoningBlock.tsx:1` namespace import of @lablup/ui-common: in 0.2 Badge, Button, Select, Tabs and the other removed 0.1 components are Astryx's (or gone). Rewrite the UC.X uses by hand.
- `src/chat/ReasoningBlock.tsx:9` shape="circle", inline and active have no counterpart.
- `src/chat/ReasoningBlock.tsx:18` Button is used as a value here; props passed to it this way are not migrated to Astryx Button.

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

### 0.1 stylesheet paths left in place (0)

None.

## Notes

- Button → Button (@lablup/ui-common/Button); or IconButton (@lablup/ui-common/IconButton) when iconOnly is set; the accessible name moves from ariaLabel to label. `label` is required. A non-string child needs `label` for the accessible name and the node as children. variant="success" has no Button variant; use primary. iconPosition="right" becomes `endContent` (an Icon or Badge element only). shape="circle", inline and active have no counterpart. The .button / .button--* classes are gone; Astryx's stable class is .astryx-button.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.
