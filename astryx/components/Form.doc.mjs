/**
 * `astryx component Form` (and `ui-common component Form`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "Form",
  displayName: "Form",
  import: "@lablup/ui-common/Form",
  category: "Inputs",
  keywords: [
    "form",
    "form item",
    "validation",
    "rules",
    "useForm",
    "useWatch",
    "form list",
    "required",
    "antd",
  ],
  description:
    "A form engine with antd's form API: Form, Form.Item, Form.List, Form.ErrorList, Form.Provider, Form.useForm, Form.useWatch, Form.useFormInstance and Form.Item.useStatus, with antd's rules (required, message, validator, type, min, max, pattern, whitespace, warningOnly). Form.Item clones its child with value/onChange and renders a label, the control, the error or help line and extra text on Astryx tokens. Validation messages come from ui-common's catalog in the active Astryx locale. It keeps antd's names on purpose: it is a form-state API, so code written against antd's form moves over with an import rewrite.",
  props: [
    {
      name: "form",
      type: "FormInstance",
      description: "The instance from Form.useForm(); one is created when omitted.",
    },
    {
      name: "initialValues",
      type: "Store",
      description:
        "Seeds the store once; a later change is what resetFields() restores.",
    },
    {
      name: "layout",
      type: "'horizontal' | 'vertical' | 'inline'",
      description: "Label placement for every item.",
      default: "'horizontal'",
    },
    {
      name: "onFinish",
      type: "(values) => void",
      description: "Called with the values when a submit validates.",
    },
    {
      name: "onFinishFailed",
      type: "({ values, errorFields, outOfDate }) => void",
      description: "Called when a submit fails validation.",
    },
    {
      name: "onValuesChange",
      type: "(changedValues, allValues) => void",
      description: "Called on user edits (not on setFieldsValue).",
    },
    {
      name: "requiredMark",
      type: "boolean | 'optional' | (label, { required }) => ReactNode",
      description:
        "The required marker. 'optional' and a function replace the asterisk with a hint in the label.",
    },
    {
      name: "labelCol",
      type: "{ span?, offset?, flex?, className?, style? }",
      description: "Label column in 24ths, for horizontal forms.",
    },
    {
      name: "wrapperCol",
      type: "{ span?, offset?, flex?, className?, style? }",
      description: "Control column in 24ths, for horizontal forms.",
    },
    {
      name: "size",
      type: "'small' | 'middle' | 'large'",
      description: "Label and control row height: --size-element-sm/md/lg.",
    },
    {
      name: "disabled",
      type: "boolean",
      description: "Passes disabled to every control that does not set it.",
    },
    {
      name: "scrollToFirstError",
      type: "boolean | ScrollIntoViewOptions",
      description:
        "On a failed submit, scrolls to the first invalid item and focuses it.",
    },
    {
      name: "validateMessages",
      type: "ValidateMessages",
      description:
        "Message templates (${label}, ${min}, ...) that win over the catalog. FormConfigProvider sets them app-wide.",
    },
    {
      name: "component",
      type: "ElementType | false",
      description: "The root element; false renders none.",
      default: "'form'",
    },
  ],
  usage: {
    description:
      "Data-entry screens whose state, validation and submit need more than a few controlled fields. Style hooks: .uic-form-item and its __label, __control, __explain-error, __extra elements, and --uic-form-item-margin-bottom, --uic-form-item-gap, --uic-form-item-description-color and --uic-form-item-line-height. A control reaches its item's status through Form.Item.useStatus() or FormItemInputContext.",
  },
  examples: [
    {
      label: "A validated form",
      code: 'import { Form } from "@lablup/ui-common/Form";\n\nconst [form] = Form.useForm();\n\n<Form form={form} layout="vertical" onFinish={save}>\n  <Form.Item name="name" label="Name" rules={[{ required: true }]}>\n    <TextInput label="Name" isLabelHidden />\n  </Form.Item>\n</Form>',
    },
  ],
};
