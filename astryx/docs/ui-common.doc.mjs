/**
 * `astryx docs ui-common`: how @lablup/ui-common relates to Astryx.
 *
 * @type {import('@astryxdesign/cli/authoring').ReferenceDoc}
 */
export const docs = {
  type: "generic",
  name: "ui-common",
  title: "Lablup ui-common",
  description:
    "The Lablup layer over Astryx: the mirrored Astryx surface, the Lablup theme, and ui-common's own components.",
  category: "guide",
  sections: [
    {
      title: "Overview",
      content: [
        {
          type: "prose",
          text: "@lablup/ui-common re-exports Astryx 1:1 and adds the Lablup brand theme and a few components of its own. Products depend on @lablup/ui-common only. Every Astryx subpath exists under the same name: `@astryxdesign/core/Button` is `@lablup/ui-common/Button`, `@astryxdesign/lab` is `@lablup/ui-common/lab`.",
        },
        {
          type: "list",
          style: "do",
          items: [
            "Import Astryx components from @lablup/ui-common, at the root or at the same subpath Astryx uses.",
            "Import StyleX tokens from `@lablup/ui-common/theme/tokens.stylex`. The `.stylex` suffix is what the StyleX compiler looks for.",
            "Wrap the app in `<Theme theme={lablupTheme}>` from `@lablup/ui-common/theme/lablup`.",
          ],
        },
        {
          type: "list",
          style: "dont",
          items: [
            "Import from @astryxdesign/* directly. ui-common owns the Astryx version.",
            "Use Dialog. ui-common hides it; use Modal.",
          ],
        },
      ],
    },
    {
      title: "Stylesheets and layers",
      content: [
        {
          type: "code",
          lang: "css",
          label: "App entry stylesheet",
          code: '@layer reset, theme, base, astryx-base, astryx-theme, ui-common, components, utilities;\n\n@import "@lablup/ui-common/reset.css";\n@import "@lablup/ui-common/astryx.css";\n@import "@lablup/ui-common/theme/lablup/theme.css";\n@import "@lablup/ui-common/ui-common.css";',
        },
      ],
    },
  ],
};

export default docs;
