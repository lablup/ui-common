---
name: ui-common-adopt
description: Move an app that imports Astryx directly (@astryxdesign/core, @astryxdesign/lab, @astryxdesign/theme-neutral) onto @lablup/ui-common in one guided pass, then prove it works. Use when asked to "migrate to ui-common", "adopt ui-common", "move onto @lablup/ui-common", "replace @astryxdesign with ui-common", "stop importing Astryx directly", or when `ui-common doctor` or `ui-common adopt --check` fails.
---

# Adopt @lablup/ui-common in an app that uses Astryx directly

`ui-common adopt --from astryx` does the mechanical part and writes
`ui-common-adopt-report.md`; `ui-common doctor` says what is still wired wrong.
This skill is the order to run them in and the calls only a person (or you,
deliberately) can make. Do not re-derive what the commands print: read their
output and act on it. Background for every check:
`docs/adopting-from-astryx.md` in the ui-common repository (each doctor
failure prints its section).

Run the CLI one-off until the project has it (`npx …` with npm):

```
pnpm dlx @lablup/ui-common-cli@next <command>
```

After `pnpm install` it is `pnpm exec ui-common <command>`.

## 1. Preflight

- The working tree is clean, on a branch of its own. Stop and ask if not.
- Record the baseline: the build, test and dev-server commands from
  package.json, and whether they pass now. A failure that predates the
  migration is not yours to fix; note it.
- Find where Storybook or the main screens can be screenshotted now, in light
  and dark. Take the "before" screenshots now: after the change there is no
  going back for them.

## 2. Dry run, then apply

```
ui-common adopt --from astryx --dry-run --report /tmp/adopt-dry-run.md
```

Read the dry-run report before applying:

- **Action required: "Astryx moves from X to Y".** The app is on an older
  Astryx than ui-common pins. Run Astryx's codemods first, while the code still
  imports `@astryxdesign/*`: `ui-common astryx upgrade --from X --path <src> --apply`.
  Commit that separately, then dry-run adopt again.
- **Files you did not expect to change** (vendored code, generated output
  without an `@generated` header): rerun with `--ignore <path>` for each.

Then apply (`ui-common adopt --from astryx`), run the package manager's
install, and commit the mechanical change on its own, report included, so the
hand edits that follow review separately.

If install stops on `minimumReleaseAge`, add the exact versions the report's
note lists to `minimumReleaseAgeExclude`. Never lower the age policy itself.

## 3. Doctor until it passes

```
ui-common doctor
```

Fix each FAIL with the printed fix and rerun. The judgement calls:

- **single-core / lab-core**: find which package pulls the second
  `@astryxdesign/core` (`pnpm why -r @astryxdesign/core`, `npm ls`). Fix the
  pin or add the override; never silence it with `peerDependencyRules`.
- **vite-prebundle / vitest-inline**: add the snippet from the doc to the
  config the check names. Do not restructure the config.
- **agents**: `ui-common agents --write <the agent file the project uses>`,
  then delete the `<!-- ASTRYX:START -->` block. Keep project lines outside
  the markers.
- A WARN is a decision, not a failure: fix it, or say in the PR why not.

## 4. Work through the report

Every row of `ui-common-adopt-report.md` gets a decision. The rules:

| Report section                       | Decide                                                                                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@astryxdesign/*` imports left       | Replace with the ui-common export the row names. With no replacement (`useImperativeDialog`), rewrite the call site to `Modal` state; keep the Astryx import only if the user agrees, and say so in the PR.    |
| Dialog → Modal: refs                 | A ref used only for focus or measuring can stay (retype to `HTMLDivElement`). A ref used for `showModal()` / `close()` / `open` becomes `isOpen` / `onOpenChange`.                                             |
| Local patches on Astryx              | Covered by a ui-common fork: drop the patch. Otherwise check whether the bug still exists on the pinned Astryx; keep the patch (re-cut for that version) only if it does.                                      |
| Overlays into document.body          | Must it work while a modal is open (toasts, notifications, devtools)? Then add `MODAL_LIVE_ATTRIBUTE` to its root (and `refreshModalBackground()` if it can mount over an open modal). If not, leave it inert. |
| Global keyboard shortcuts            | Should it fire over a modal? Almost never: guard it with `MODAL_OPEN_ATTRIBUTE`.                                                                                                                               |
| Escape handlers                      | Add `event.preventDefault()` where the handler consumed the key.                                                                                                                                               |
| ASTRYX agent blocks / anchored tools | Replace the block (step 3); repoint each tool at `<!-- UI-COMMON:END -->` or its own marker.                                                                                                                   |
| `astryx` CLI invocations             | `astryx <cmd>` → `ui-common <cmd>` in scripts, CI and docs. Keep `astryx theme build` if the project builds a theme; add the `.css` stub only if that build then fails.                                        |
| InternationalizationProvider         | Merge `uiCommonMessages` for every supported locale; map app language codes to Astryx locale names; list unsupported ones explicitly.                                                                          |

Then add the guard that keeps it adopted: ban `@astryxdesign/*` in ESLint
(static and dynamic imports, see the doc) and run
`ui-common adopt --from astryx --check` and `ui-common doctor` in CI.

## 5. Prove it

All of these, and report each result:

1. `ui-common adopt --from astryx --check` exits 0; `ui-common doctor` exits 0.
2. Type check, lint, the production build, and the test suite pass (or fail
   only as they did at baseline).
3. Cold dev-server start: delete the optimizer cache (`node_modules/.vite`),
   start the dev server, load the app in a browser, and confirm it renders
   with no page errors. A warm start proves nothing here.
4. Screenshot the same Storybook stories or screens as in step 1, light and
   dark, and diff them pixel by pixel. Explain every difference: expected ones
   (ui-common's layer now beats Astryx's base styles where it wraps a
   primitive) go in the PR; anything else is a bug to fix.
5. In a real browser, open a modal and check: toasts still dismiss, Escape
   closes one layer per press, shortcuts stay quiet.

## Done when

- adopt `--check` and doctor are green, and both run in CI.
- Every report row is resolved or explained in the PR description.
- Build, tests and a cold dev start pass; the screenshot diff is explained.
- No `@astryxdesign/*` dependency remains except `@astryxdesign/core` at
  ui-common's exact pin (and `@astryxdesign/lab`, `@astryxdesign/cli` where
  used), and `@lablup/ui-common` equals `@lablup/ui-common-cli`.

Hand back to a person when: an Astryx patch fixes something ui-common does not,
a screenshot difference has no explanation, or a call site depends on
`HTMLDialogElement` behaviour `Modal` does not have.
