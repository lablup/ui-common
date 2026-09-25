# ui-common upgrade report

`ui-common upgrade` 0.1.0-alpha.0 → 0.2.0-alpha.0 (installed @lablup/ui-common <version>).

Scanned 1 file under `src`.

## Summary

| | Count |
|---|---:|
| Files changed | 1 |
| package.json changed | yes |
| TODO markers left in code | 4 |
| Manual-review findings | 0 |

## Steps

- 0.2.0-alpha.0: 0.1 → 0.2: ui-common on Astryx

## Changed files

- `src/chat/ReasoningBlock.tsx`: +7 −2, components

## package.json

- devDependencies["@lablup/ui-common"]: "0.1.0-alpha.0" → "0.2.0-alpha.0".
- peerDependencies["@lablup/ui-common"]: ">=0.1.0-alpha.0 <0.2.0" → "^0.2.0-alpha.0".
- peerDependencies["@lablup/ui-common"]: the range ">=0.1.0-alpha.0 <0.2.0" was replaced with "^0.2.0-alpha.0"; widen it again if this package must still accept 0.1.
- added @stylexjs/stylex ^0.19.0 to peerDependencies and devDependencies.

## Manual review

### TODO markers (4)

Each is a `TODO(ui-common-upgrade)` comment in the code, above the call it is about. Resolve it, then delete the comment.

- `src/chat/ReasoningBlock.tsx:1` namespace import of @lablup/ui-common: in 0.2 Badge, Button, Select, Tabs and the other removed 0.1 components are Astryx's (or gone). Rewrite the UC.X uses by hand.
- `src/chat/ReasoningBlock.tsx:9` Astryx Button has no "text" variant; mapped to "ghost".
- `src/chat/ReasoningBlock.tsx:10` Button "inline": Astryx Button has no "inline" variant. Use variant="ghost" size="sm", or a Link.
- `src/chat/ReasoningBlock.tsx:19` Button is used as a value here; props passed to it this way are not migrated to Astryx Button.

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

- Badge: the codemod keeps Badge. Astryx reserves Badge for counts and loud status; a settled value (a tag, a category, a state label) reads better as Token (`@lablup/ui-common/Token`, `label` + `color`). Decide per call site.
- Button: children became `label` (the accessible name, required). `title` became `tooltip`. Sizes collapse onto sm/md/lg (xsmall → sm).
- Select → Selector: `onChange` receives a string value. A 0.1 Select typed over a non-string value needs its own mapping.
- StatusTag → StatusDot: a dot with an accessible label, no visible text.
- Tabs → TabList and DataTable → Table are reshaped only partly: the TODO markers say what is left.
- Drawer → @lablup/ui-common/lab Drawer: `@astryxdesign/lab` is an optional peer of ui-common, pinned to the canary ui-common is built against. The codemod adds it to package.json when it moved a Drawer, and adds `@lablup/ui-common/lab/lab.css` to the stylesheet entry it rewrites; import lab.css yourself if your entry is elsewhere.
- Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps library reads resolving until 0.3.
