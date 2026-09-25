/**
 * What @lablup/ui-common contributes to the Astryx CLI (FR-4051).
 *
 * A consumer that lists @lablup/ui-common as a dependency gets this loaded
 * implicitly (Astryx CLI 0.6.1+): `astryx docs ui-common` serves the topic
 * below, `astryx search` finds it, and `astryx init --features agents`
 * appends the `agentDocs` lines to the managed agent block.
 *
 * No `components` root yet. The CLI requires each `{Name}.doc.mjs` to sit
 * beside a same-stem `{Name}.tsx`, and the tarball ships no source today.
 * The component docs arrive with the rebuilt customs and that decision.
 *
 * Identity (name, version) comes from package.json. Each root is shipped in
 * the tarball (see `files` in package.json). `pnpm run check:integration`
 * validates the manifest and proves the packed package carries it.
 *
 * @type {import('@astryxdesign/cli/authoring').AstryxIntegration}
 */
export default {
  docs: "./astryx/docs",
  agentDocs: {
    append: [
      "Import Astryx through @lablup/ui-common, never @astryxdesign/*: same subpaths (@lablup/ui-common/Button, /theme/tokens.stylex, /reset.css, /lab).",
      "Use Modal, not Dialog. ui-common hides Astryx Dialog (exports.exclude.json) so every product has one dialog surface.",
      "Theme with <Theme theme={lablupTheme}> from @lablup/ui-common/theme/lablup. Declare @layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities; first.",
      "ui-common strings resolve through Astryx InternationalizationProvider: pass uiCommonMessages from @lablup/ui-common/i18n-catalog in its messages.",
    ],
  },
  issuesUrl: "https://github.com/lablup/ui-common/issues",
};
