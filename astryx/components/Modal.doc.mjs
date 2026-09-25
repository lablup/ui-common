/**
 * `astryx component Modal` (and `ui-common component Modal`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "Modal",
  displayName: "Modal",
  import: "@lablup/ui-common/Modal",
  category: "Overlay",
  keywords: ["modal", "dialog", "popup", "confirm", "overlay", "sheet"],
  description:
    "ui-common's dialog, in place of Astryx Dialog (which ui-common does not export). It takes every Dialog prop, renders into a portal so app-level notices stay above it, stacks nested modals, and lays out a header and an OK/Cancel footer when given a title, onAction or footer.",
  props: [
    {
      name: "isOpen",
      type: "boolean",
      description: "Whether the modal is open.",
      required: true,
    },
    {
      name: "onOpenChange",
      type: "(isOpen: boolean) => unknown",
      description:
        "Called when the modal asks to open or close: Escape, backdrop, the close button, Cancel.",
      required: true,
    },
    {
      name: "children",
      type: "ReactNode",
      description:
        "The body. Without title, onAction or footer, the whole surface, exactly like Dialog.",
    },
    {
      name: "title",
      type: "ReactNode",
      description: "Header title; names the dialog. Turns on the structured layout.",
    },
    {
      name: "subtitle",
      type: "string",
      description: "Secondary line under the title.",
    },
    {
      name: "onAction",
      type: "() => unknown",
      description:
        "Primary action. A returned promise shows the button pending until it settles; it does not close the modal.",
    },
    {
      name: "actionLabel",
      type: "string",
      description: "Primary action label.",
      default: 'the catalog\'s uic.Modal.ok ("OK")',
    },
    {
      name: "actionVariant",
      type: "ButtonVariant",
      description: "Primary action variant.",
      default: "'primary'",
    },
    {
      name: "isActionLoading",
      type: "boolean",
      description: "Shows the primary action as pending.",
    },
    {
      name: "isActionDisabled",
      type: "boolean",
      description: "Disables the primary action.",
    },
    {
      name: "actionButtonProps",
      type: "ModalActionButtonProps",
      description: "More props for the primary action button (type, form, icon, ...).",
    },
    {
      name: "cancelLabel",
      type: "string",
      description: "Cancel label.",
      default: 'the catalog\'s uic.Modal.cancel ("Cancel")',
    },
    {
      name: "hasCancelButton",
      type: "boolean",
      description: "Whether the generated footer has a Cancel button.",
      default: "true",
    },
    {
      name: "footer",
      type: "ReactNode | null",
      description: "Replaces the generated footer; null removes it.",
    },
    {
      name: "hasCloseButton",
      type: "boolean",
      description: "Whether the header shows a close button.",
      default: "true",
    },
    {
      name: "headerStartContent",
      type: "ReactNode",
      description: "Content before the title, e.g. a back button.",
    },
    {
      name: "headerEndContent",
      type: "ReactNode",
      description: "Content after the title, before the close button.",
    },
    {
      name: "isLoading",
      type: "boolean",
      description: "Shows a text skeleton in place of the body.",
    },
    {
      name: "unmountOnClose",
      type: "boolean",
      description: "Unmount the content, and drop its state, when the modal closes.",
    },
    {
      name: "afterOpenChange",
      type: "(isOpen: boolean) => void",
      description: "Called right after isOpen changes, never on mount.",
    },
    {
      name: "zIndex",
      type: "number",
      description:
        "Asks for a z-index inside the modal band; a later modal still stacks above.",
    },
    {
      name: "width | maxHeight | position | variant | purpose | padding",
      type: "Dialog props",
      description:
        "As on Astryx Dialog: `ui-common astryx component Dialog` lists them.",
    },
  ],
  usage: {
    description:
      "Use Modal wherever Astryx documentation says Dialog: a Dialog call site moves over by renaming the import. Pass title and onAction for a standard confirm/edit dialog, or children alone for a custom surface.",
    bestPractices: [
      {
        guidance: true,
        description: "Import it from @lablup/ui-common/Modal (or the root).",
      },
      {
        guidance: true,
        description:
          "Close the modal yourself when onAction's work succeeds: onAction does not close it.",
      },
      {
        guidance: false,
        description:
          "Import Dialog: ui-common hides it so every product has one dialog surface.",
      },
    ],
  },
  examples: [
    {
      label: "Rename dialog",
      code: '<Modal\n  isOpen={isOpen}\n  onOpenChange={setIsOpen}\n  title="Rename folder"\n  actionLabel="Rename"\n  onAction={async () => {\n    await rename();\n    setIsOpen(false);\n  }}\n>\n  <TextInput label="Name" value={name} onChange={setName} />\n</Modal>',
    },
  ],
};
