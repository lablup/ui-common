/**
 * `astryx component BulkEditFormItem` (and `ui-common component BulkEditFormItem`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "BulkEditFormItem",
  displayName: "BulkEditFormItem",
  import: "@lablup/ui-common",
  category: "Inputs",
  keywords: ["bulk edit", "batch edit", "keep as is", "multiple records", "form item"],
  description:
    'A Form.Item for editing one field across many records. It starts as a read-only "Keep as is" placeholder (the value stays undefined, so a submit leaves every record alone); clicking or focusing it swaps in the wrapped control; hasClear adds "Clear", which sets the value to null; "Undo changes" returns to keep mode. Takes every Form.Item prop but required, and rules without required.',
  props: [
    {
      name: "name",
      type: "NamePath",
      description: "The field the item edits.",
      required: true,
    },
    {
      name: "children",
      type: "ReactElement",
      description:
        "The control. It is cloned with value/onChange, a ref (focused when editing starts) and open/onOpenChange (opened when editing starts).",
    },
    {
      name: "hasClear",
      type: "boolean",
      description: "Offers Clear, which sets the value to null.",
    },
    {
      name: "keepValueLabel",
      type: "string",
      description: "The placeholder in keep mode.",
      default: 'the catalog\'s uic.BulkEditFormItem.keepAsIs ("Keep as is")',
    },
    {
      name: "clearValueLabel",
      type: "string",
      description: "The placeholder once cleared.",
      default: 'the catalog\'s uic.BulkEditFormItem.clear ("Clear")',
    },
    {
      name: "clearLabel",
      type: "string",
      description: "The clear action's label.",
      default: 'the catalog\'s uic.BulkEditFormItem.clear ("Clear")',
    },
    {
      name: "undoLabel",
      type: "string",
      description: "The label of the action that returns to keep mode.",
      default: 'the catalog\'s uic.BulkEditFormItem.undoChanges ("Undo changes")',
    },
  ],
  usage: {
    description:
      "A form that edits several selected records at once, where an untouched field must not overwrite their differing values. Render it inside a Form from @lablup/ui-common/Form.",
  },
  examples: [
    {
      label: "An optional field that can be cleared on every record",
      code: '<BulkEditFormItem name="priority" label="Priority" hasClear clearValueLabel="No priority">\n  <NumberInput label="Priority" isLabelHidden />\n</BulkEditFormItem>',
    },
  ],
};
