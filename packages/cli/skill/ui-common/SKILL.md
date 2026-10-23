---
name: ui-common
description: "@lablup/ui-common, Lablup's UI layer on the Astryx design system, is reachable on this computer through the ui-common command; use it when building or changing UI, choosing components or templates, layout, styling or theming in any project that depends on @lablup/ui-common, and use it there instead of the astryx skill."
---

@lablup/ui-common is Lablup's UI layer on Astryx: Astryx's components under `@lablup/ui-common` import paths, the Lablup theme, and components of its own.
Use it when you build or change UI in a project whose package.json has `@lablup/ui-common`. There it replaces the `astryx` skill: run `ui-common`, not `astryx`, and never import `@astryxdesign/*`.
Run it through the project's package manager (`pnpm exec ui-common <cmd>`, `npx ui-common <cmd>`). Start with `ui-common search '<what you need>'`.
Then read `ui-common component <Name>` or `ui-common docs <topic>`, not the package's files. Import exactly what they print: the `@lablup/ui-common` root or one of its subpaths.

WORKFLOW — start every page from a template, never from scratch:

1. `ui-common build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `ui-common template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `ui-common template <Block>` for parts it lacks; `ui-common component <Name>` to read props before using one.

Follow the project's own agent docs (the UI-COMMON block); `ui-common agents --write AGENTS.md` writes one where there is none.
Before you deliver, re-read each file; replace any raw <div>/<span>, imported .css/@apply, or hardcoded #hex/px with the component or a token. Then build the project and deliver that build, not a description of it.
If the project has no `ui-common` command, add `@lablup/ui-common-cli` as a devDependency at the version of its `@lablup/ui-common`.
