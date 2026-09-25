/**
 * `astryx component ConfirmPopover` (and `ui-common component ConfirmPopover`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "ConfirmPopover",
  displayName: "ConfirmPopover",
  import: "@lablup/ui-common",
  category: "Overlay",
  keywords: ["confirm", "popconfirm", "are you sure", "confirmation", "popover"],
  description:
    "A one-click confirmation anchored to its trigger: a question, an optional supporting line, Cancel and a confirm action, on Astryx Popover. Cancel takes focus first; the action may be async.",
  props: [
    {
      name: "title",
      type: "ReactNode",
      description: "The question. A string renders as the heading line.",
      required: true,
    },
    {
      name: "description",
      type: "ReactNode",
      description: "Supporting line under the title.",
    },
    { name: "icon", type: "ReactNode", description: "Leading glyph beside the title." },
    {
      name: "onAction",
      type: "(event: MouseEvent) => unknown",
      description:
        "Runs on confirm. A returned promise keeps the button pending; the popover closes when it resolves.",
    },
    {
      name: "actionLabel",
      type: "string",
      description: "Confirm button label.",
      default: 'the catalog\'s uic.common.confirm ("Confirm")',
    },
    {
      name: "actionVariant",
      type: "ButtonVariant",
      description: "Confirm button variant; destructive for a harmful action.",
      default: '"primary"',
    },
    {
      name: "isActionDisabled",
      type: "boolean",
      description: "Disable the confirm button.",
      default: "false",
    },
    {
      name: "onCancel",
      type: "(event: MouseEvent) => void",
      description: "Runs on Cancel; the popover closes either way.",
    },
    {
      name: "cancelLabel",
      type: "string",
      description: "Cancel button label.",
      default: 'the catalog\'s uic.common.cancel ("Cancel")',
    },
    {
      name: "label",
      type: "string",
      description: "Accessible name of the popover.",
      default: "title when it is a string, else the action label",
    },
    {
      name: "children",
      type: "ReactNode | (triggerProps) => ReactNode",
      description:
        "The trigger, as on Popover. Use the render-prop form inside a ButtonGroup so the button stays a direct child.",
    },
    {
      name: "isOpen / onOpenChange",
      type: "boolean / (isOpen: boolean) => void",
      description:
        "Controlled open state; uncontrolled without isOpen. Other Popover props pass through.",
    },
  ],
  usage: {
    description:
      "For reversible actions: deactivate, restore, reset a form, leave a shared folder.",
    bestPractices: [
      {
        guidance: false,
        description:
          "Guard an action that cannot be undone with it; use a Modal that asks for the name to be typed.",
      },
    ],
  },
  examples: [
    {
      label: "A reversible, harmful action",
      code: '<ConfirmPopover\n  title="Deactivate this key?"\n  actionLabel="Deactivate"\n  actionVariant="destructive"\n  onAction={() => deactivate(key.id)}\n>\n  <Button label="Deactivate" />\n</ConfirmPopover>',
    },
  ],
};
