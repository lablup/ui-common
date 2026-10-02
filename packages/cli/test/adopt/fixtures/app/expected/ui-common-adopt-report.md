# ui-common adopt report

`ui-common adopt` astryx → @lablup/ui-common 0.2.0 (@lablup/ui-common-cli 0.2.0).

Ran the codemods over 13 files under `.`; searched 17 files under the project root for manual-review findings.

## Summary

| | Count |
|---|---:|
| Files changed | 12 |
| package.json changed | yes |
| TODO markers left in code | 0 |
| Manual-review findings | 13 |

## Steps

- 0.2.0: Astryx (`@astryxdesign/*`) → @lablup/ui-common

## Rewritten specifiers

| Kind | Count |
|---|---:|
| core/<X> | 10 |
| core stylesheets | 6 |
| core (root) | 2 |
| core/locales/*.json | 1 |
| core/theme/tokens.stylex | 1 |
| lab | 1 |
| lab/lab.css | 1 |
| theme-neutral/<X> | 1 |
| theme-neutral/theme.css | 1 |

## Changed files

- `.storybook/preview.ts`: +2 −2, specifiers
- `index.html`: +1 −0, layer-order
- `package.json`: +3 −2, package-json
- `pnpm-workspace.yaml`: +4 −0, package-json
- `src/App.test.tsx`: +2 −2, specifiers
- `src/App.tsx`: +6 −6, dialog-to-modal, specifiers
- `src/ConfirmDelete.tsx`: +3 −3, dialog-to-modal
- `src/index.css`: +5 −5, specifiers, layer-order
- `src/legacy.cjs`: +2 −2, specifiers
- `src/main.tsx`: +4 −4, specifiers
- `src/panel.scss`: +3 −1, specifiers, layer-order
- `src/tokens.ts`: +5 −5, specifiers

## package.json

- added @lablup/ui-common 0.2.0 to dependencies: the one dependency that brings Astryx (core, theme-neutral) at the versions it pins.
- added @lablup/ui-common-cli 0.2.0 to devDependencies: the `ui-common` bin (`ui-common doctor`, `ui-common agents`, the Astryx CLI in @lablup/ui-common terms), released at the same version as @lablup/ui-common.
- dependencies["@astryxdesign/core"]: "^0.6.2" → "0.6.2", the version @lablup/ui-common 0.2.0 pins.
- removed @astryxdesign/theme-neutral from dependencies: @lablup/ui-common depends on it and mirrors it as @lablup/ui-common/theme/neutral.
- added allowBuilds declining @astryxdesign/core, @astryxdesign/cli to pnpm-workspace.yaml: their postinstall only prints an `astryx init` nudge, and pnpm 11 stops the install (ERR_PNPM_IGNORED_BUILDS) until each is allowed or declined.

## Manual review

### TODO markers (0)

None.

### `@astryxdesign/*` imports left in place (1)

ui-common has no mirror for these, or adopt could not move them. Replace each with a ui-common export (the detail says which), or keep Astryx for it on purpose. `adopt --check` and `ui-common doctor` fail while any is left.

| Where | What | Detail |
|---|---|---|
| `src/ConfirmDelete.tsx:2` | `import { useImperativeDialog } from "@astryxdesign/core/Dialog";` | @lablup/ui-common hides Dialog: import Modal from @lablup/ui-common/Modal (adopt renames named imports; this one it could not). |

### Dialog → Modal: refs (2)

A `Modal` / `AlertModal` ref reaches the element with `role="dialog"`, not an `HTMLDialogElement`. Check each use: retype it, and drive the modal with `isOpen` / `onOpenChange` instead of `showModal()` / `close()`.

| Where | What | Detail |
|---|---|---|
| `src/App.tsx:14` | `const dialogRef = useRef<HTMLDialogElement>(null);` | This module moved from Dialog to Modal, whose ref is an HTMLDivElement (role="dialog"). Retype the ref and drop dialog-element calls. |
| `src/App.tsx:29` | `<Modal ref={dialogRef} isOpen={open} onOpenChange={setOpen} purpose={purpose}>` | `ref` on Modal reaches the element with role="dialog", not an HTMLDialogElement: `showModal()`, `close()` and `open` are not there. Open and close it with `isOpen` / `onOpenChange`. |

### Local patches on Astryx (1)

A pnpm or patch-package patch on `@astryxdesign/*` applies only in this project, and ui-common's own copies of some components do not see it. Drop each patch ui-common's fork covers; for the rest decide whether the fix still matters on the Astryx version ui-common pins, and keep the patch at that version or drop it.

| Where | What | Detail |
|---|---|---|
| `pnpm-workspace.yaml:4` | `"@astryxdesign/core@0.6.2": patches/@astryxdesign__core@0.6.2.patch` | touches dist/ComplexSelector/ComplexSelector.js; ui-common ships its own ComplexSelector, so this patch does not reach it: drop it unless the rest still matters |

### Overlays rendered into document.body (1)

While a `Modal` is open, every other child of `<body>` is `inert`. A toast viewport, notification area or debug overlay that must stay usable over a modal needs `MODAL_LIVE_ATTRIBUTE` (from `@lablup/ui-common/Modal`) on its root, and `refreshModalBackground()` if it mounts while a modal is open. Check in a real browser: jsdom ignores `inert`.

| Where | What | Detail |
|---|---|---|
| `src/App.tsx:36` | `{createPortal(<ToastViewport position="bottomEnd" />, document.body)}` | a portal into document.body; Astryx's toast viewport does not mark itself live |

### Global keyboard shortcuts (1)

A document- or window-level shortcut still fires while a modal is open. Skip it while an element with `MODAL_OPEN_ATTRIBUTE` (from `@lablup/ui-common/Modal`) that is not `inert` exists.

| Where | What | Detail |
|---|---|---|
| `src/App.tsx:20` | `window.addEventListener("keydown", onKey);` |  |

### Escape handlers of your own (1)

`Modal`, the lab `Drawer` and popovers close through one layer stack: one Escape closes the top layer only. A handler of yours that consumes Escape (inline edit, a search box) must call `event.preventDefault()`, or the stack closes the surrounding layer too.

| Where | What | Detail |
|---|---|---|
| `src/ConfirmDelete.tsx:17` | `if (event.key === "Escape") setOpen(false);` | no preventDefault() in this module |

### Astryx agent blocks, and tools anchored on them (2)

Replace each `<!-- ASTRYX:START -->` block with ui-common's: `ui-common agents --write <file>` adds the `UI-COMMON` block (keep your own lines outside its markers), then delete the ASTRYX block. A script or workflow that finds its place by the ASTRYX markers breaks when they go: point it at `<!-- UI-COMMON:END -->` or at your own marker.

| Where | What | Detail |
|---|---|---|
| `AGENTS.md:5` | `<!-- ASTRYX:START -->` | an Astryx agent block |
| `scripts/append-rules.mjs:5` | `const at = text.indexOf("<!-- ASTRYX:END -->");` | anchors on the ASTRYX markers |

### `astryx` CLI invocations (3)

`ui-common <command>` runs the Astryx CLI ui-common pins and rewrites its output to ui-common paths; `ui-common astryx <command>` runs it unrewritten. Switch each invocation, or keep `@astryxdesign/cli` as a devDependency at the version `@lablup/ui-common-cli` pins. `astryx theme build` keeps working either way (a recipe that imports ui-common components needs the `.css` stub in docs/adopting-from-astryx.md).

| Where | What | Detail |
|---|---|---|
| `.github/workflows/ci.yml:9` | `- run: pnpm exec astryx upgrade --from 0.6.0` |  |
| `package.json:9` | `"theme": "astryx theme build src/brand.ts -o src/brand.css",` |  |
| `package.json:10` | `"agents": "astryx init --features agents"` |  |

### InternationalizationProvider without ui-common's strings (1)

ui-common's built-in strings resolve through Astryx's `InternationalizationProvider`. Merge `uiCommonMessages` (from `@lablup/ui-common/i18n-catalog`) into its `messages` with `mergeMessages`, or ui-common's components stay in English. Map your language codes to Astryx locale names (`ko` → `ko-KR`).

| Where | What | Detail |
|---|---|---|
| `src/main.tsx:14` | `<InternationalizationProvider locale="ko-KR" messages={{ "ko-KR": astryxKo }}>` |  |

## Notes

- pnpm-workspace.yaml sets `minimumReleaseAge`: a @lablup/ui-common release younger than that will not install. Until it ages out, list `@lablup/ui-common@0.2.0`, `@lablup/ui-common-cli@0.2.0`, `@astryxdesign/lab@0.6.2-canary.c9fb1ad` under `minimumReleaseAgeExclude` (a lab canary never ages out).
