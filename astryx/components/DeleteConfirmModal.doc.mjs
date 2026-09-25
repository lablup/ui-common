/**
 * `astryx component DeleteConfirmModal` (and `ui-common component DeleteConfirmModal`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "DeleteConfirmModal",
  displayName: "DeleteConfirmModal",
  import: "@lablup/ui-common",
  category: "Overlay",
  keywords: [
    "delete",
    "confirm",
    "type to confirm",
    "destructive",
    "irreversible",
    "remove",
  ],
  description:
    "Confirms a deletion on Modal: a warning title, a question, the items about to go and a destructive action. For several items, or with isConfirmInputRequired, the user types confirmText before the action enables. isReversible keeps the layout without the typed confirmation or the warning.",
  props: [
    {
      name: "isOpen",
      type: "boolean",
      description: "Whether it is open.",
      required: true,
    },
    {
      name: "onOpenChange",
      type: "(isOpen: boolean) => void",
      description: "Called with false on Cancel, Escape and a backdrop click.",
      required: true,
    },
    {
      name: "items",
      type: "{ key: string; label: ReactNode }[]",
      description: "The items about to be deleted. None disables the action.",
      required: true,
    },
    {
      name: "onAction",
      type: "() => unknown",
      description:
        "The deletion. A returned promise keeps the action pending. It does not close the modal.",
      required: true,
    },
    {
      name: "title",
      type: "ReactNode",
      description: "Title.",
      default:
        'the catalog\'s uic.DeleteConfirmModal.title ("Delete"), or titleMany ("Delete 3 items")',
    },
    {
      name: "titleIcon",
      type: "ReactNode",
      description: "Glyph before the title.",
      default: "the theme's warning icon",
    },
    {
      name: "description",
      type: "ReactNode",
      description: "The question above the list.",
      default: "the catalog's targetDescription with target, else description",
    },
    {
      name: "target",
      type: "ReactNode",
      description:
        'What kind of thing is deleted ("Project"), for the default question.',
    },
    {
      name: "isReversible",
      type: "boolean",
      description: "No typed confirmation and no warning.",
      default: "false",
    },
    {
      name: "isConfirmInputRequired",
      type: "boolean",
      description: "Typed confirmation for one item too.",
      default: "false",
    },
    {
      name: "confirmText",
      type: "string",
      description: "What the user types. An empty string keeps the action disabled.",
      default:
        'the single item\'s text label, else uic.DeleteConfirmModal.confirmText ("Delete")',
    },
    {
      name: "inputLabel",
      type: "ReactNode | (confirmText: ReactNode) => ReactNode",
      description:
        "Label above the field; a function receives the confirm text drawn as a token.",
      default:
        'the catalog\'s uic.DeleteConfirmModal.typeToConfirm ("Type {confirmText} to confirm.")',
    },
    {
      name: "inputPlaceholder",
      type: "string",
      description: "Placeholder of the field.",
    },
    { name: "isInputDisabled", type: "boolean", description: "Disables the field." },
    {
      name: "extraContent",
      type: "ReactNode",
      description: "Content after the field.",
    },
    {
      name: "warningText",
      type: "string",
      description: "The irreversibility warning.",
      default:
        'the catalog\'s uic.DeleteConfirmModal.cannotBeUndone ("This action cannot be undone.")',
    },
    {
      name: "itemListMaxHeight",
      type: "number",
      description: "Item list height cap in pixels; 0 for none.",
      default: "200",
    },
    {
      name: "hasPlainItems",
      type: "boolean",
      description: "Items without the boxed surface.",
      default: "false",
    },
    {
      name: "actionLabel",
      type: "string",
      description: "Action label.",
      default: 'the catalog\'s uic.common.delete ("Delete")',
    },
    {
      name: "isActionDisabled",
      type: "boolean",
      description: "Disables the action. It cannot open the typed-confirmation gate.",
    },
  ],
  usage: {
    description:
      "Any permanent deletion. Pass isConfirmInputRequired and the resource name as confirmText when one item is deleted irreversibly.",
  },
  examples: [
    {
      label: "Irreversible deletion of one item",
      code: `<DeleteConfirmModal
  isOpen={preset != null}
  onOpenChange={(open) => !open && setPreset(null)}
  items={preset ? [{ key: preset.id, label: preset.name }] : []}
  target="Preset"
  confirmText={preset?.name ?? ""}
  isConfirmInputRequired
  onAction={async () => {
    await remove(preset.id);
    setPreset(null);
  }}
/>`,
    },
  ],
};
