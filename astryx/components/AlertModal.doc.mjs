/**
 * `astryx component AlertModal` (and `ui-common component AlertModal`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "AlertModal",
  displayName: "AlertModal",
  import: "@lablup/ui-common",
  category: "Overlay",
  keywords: ["alert dialog", "confirm", "alertdialog", "destructive", "are you sure"],
  description:
    "The WAI-ARIA alert dialog on Modal's portalled surface: role=alertdialog named by its title and described by its description, Cancel focused first, Escape cancels, the backdrop does not. ui-common hides Astryx AlertDialog in its favour: it joins Modal's level stack and leaves the notification layer reachable.",
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
      description: "Called with false on Cancel and on Escape.",
      required: true,
    },
    { name: "title", type: "string", description: "The question.", required: true },
    {
      name: "description",
      type: "string",
      description: "The consequence.",
      required: true,
    },
    {
      name: "actionLabel",
      type: "string",
      description: "Action button label.",
      required: true,
    },
    {
      name: "onAction",
      type: "() => unknown",
      description: "Runs on the action button. It does not close the modal.",
      required: true,
    },
    {
      name: "actionVariant",
      type: "ButtonVariant",
      description: "Action button variant.",
      default: '"destructive"',
    },
    {
      name: "isActionLoading",
      type: "boolean",
      description: "Shows the action pending.",
    },
    { name: "isActionDisabled", type: "boolean", description: "Disables the action." },
    {
      name: "cancelLabel",
      type: "string",
      description: "Cancel label.",
      default: 'the catalog\'s uic.common.cancel ("Cancel")',
    },
    {
      name: "isCancelDisabled",
      type: "boolean",
      description: "Disables the Cancel button. Escape still cancels.",
    },
  ],
  usage: {
    description:
      "A short, blocking question before an action. For an irreversible deletion that needs typed confirmation, use DeleteConfirmModal.",
  },
  examples: [
    {
      label: "Confirm a termination",
      code: `<AlertModal
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="Terminate session?"
  description="Unsaved work in the session is lost."
  actionLabel="Terminate"
  onAction={async () => {
    await terminate();
    setIsOpen(false);
  }}
/>`,
    },
  ],
};
