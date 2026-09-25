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
      title: "ui-common components",
      content: [
        {
          type: "prose",
          text: "ui-common's own components are built on Astryx primitives and never share a name with an Astryx export. Each is exported from the package root; Modal also has its own subpath.",
        },
        {
          type: "list",
          style: "unordered",
          items: [
            "`Modal` (`@lablup/ui-common/Modal`): the dialog. Takes every Dialog prop; adds nesting, notices above the modal, `title`/`onAction`/`footer` conventions and `unmountOnClose`.",
            "`PageLayout`, `PageHeader`: a page's width clamp, and its title, actions and error banner.",
            "`StatCard`: a dashboard metric on Astryx Card.",
            "`ErrorState`: a full-area error with recovery actions.",
            "`SkeletonCard`, `SkeletonText`, `SkeletonChart`, `SkeletonRow`: loading placeholders drawn with Astryx Skeleton.",
            "`SmoothHeight`, `DigitPopIn`: height and number motion.",
            "`CountBadge`, `DoubleBadge`, `BooleanToken`: a count overlaid on a child, welded Badges, and an on/off Token.",
            "`IconWithTooltip`: a focusable glyph with a Tooltip. `ImageWithFallback`: an image that falls back to a node.",
            "`NotificationStack`: floating notices with task progress, Cancel/Retry and an action; the caller owns the list.",
            "`OverlayScrollbar`: a persistent scroll thumb over a scroll container, in place of its native bar.",
            "`ConfirmPopover`: a one-click confirmation on Popover, for reversible actions.",
            '`SelectionLabel`: "3 selected" with a button that clears the selection.',
            "`UncontrolledInput`: a text or number field that reports its value on Enter or blur.",
            "`AlertModal`: the alert-dialog pattern on Modal, in its level stack. Use it instead of AlertDialog.",
            "`DeleteConfirmModal`: confirms a deletion on Modal; typed confirmation for irreversible ones.",
            "`StepNumberInput`: a number field that steps along a list of values (1, 2, 4, 8); `NumberStepper` is its stepper column.",
          ],
        },
        {
          type: "code",
          lang: "tsx",
          label: "Modal",
          code: 'import { Modal } from "@lablup/ui-common/Modal";\n\n<Modal\n  isOpen={isOpen}\n  onOpenChange={setIsOpen}\n  title="Rename folder"\n  actionLabel="Rename"\n  onAction={async () => {\n    await rename();\n    setIsOpen(false);\n  }}\n>\n  <TextInput label="Name" value={name} onChange={setName} />\n</Modal>',
        },
        {
          type: "prose",
          text: "Moving from `@astryxdesign/core/Dialog`: change the specifier to `@lablup/ui-common/Modal`, `Dialog` to `Modal` and `DialogProps` to `ModalProps`. `DialogHeader`, `DialogPosition`, `DialogPurpose` and `DialogVariant` are re-exported unchanged (also as `ModalHeader`, `ModalPosition`, ...).",
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
