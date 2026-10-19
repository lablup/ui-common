/**
 * Shared pieces for the form-control stories (`src/formControls/<Name>/`):
 * the control inside a `Form.Item`, the way it is used in a form, and the
 * value it holds on its own. Storybook only.
 */
import type { ReactElement, ReactNode } from "react";

import { Button } from "../astryx/Button";
import { HStack, VStack } from "../astryx/Stack";
import { Text } from "../astryx/Text";
import { Form } from "../components/Form";
import type { Rule } from "../components/Form/interface";

/** Shows a value as JSON, so a story can show what the control reports. */
export function ValueReadout({
  label = "Value",
  value,
}: {
  label?: string;
  value: unknown;
}) {
  return (
    <Text type="supporting" color="secondary">
      {label}: {value === undefined ? "undefined" : JSON.stringify(value)}
    </Text>
  );
}

export interface FormItemDemoProps {
  /** The item's label. */
  label: ReactNode;
  /** The item's help text. */
  extra?: ReactNode;
  /** The field's starting value, through the form's `initialValues`. */
  initialValue?: unknown;
  /** `"checked"` for Switch and CheckboxInput. */
  valuePropName?: string;
  /** When the item validates. */
  validateTrigger?: string | string[];
  /** Disables every control, as `<Form disabled>`. */
  disabled?: boolean;
  /** The item's rules; by default the field is required. */
  rules?: Rule[];
  /** Shows the required mark when `rules` hold no `required` rule. */
  required?: boolean;
  /** The control, with no label, value or onChange: the item supplies them. */
  children: ReactElement;
}

/**
 * The control inside a `Form.Item`, as ui-common's form controls are used: the
 * item owns the label, the help text, the required mark and the message, and
 * injects the value. Submit empty to see the error; the field's value is shown
 * under the buttons.
 */
export function FormItemDemo({
  label,
  extra = "Help text comes from Form.Item's extra.",
  initialValue,
  valuePropName,
  validateTrigger,
  disabled,
  rules = [{ required: true, message: "This field is required." }],
  required,
  children,
}: FormItemDemoProps) {
  const [form] = Form.useForm();
  const value = Form.useWatch("field", form);
  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      initialValues={initialValue === undefined ? undefined : { field: initialValue }}
      style={{ maxWidth: 400 }}
    >
      <Form.Item
        label={label}
        name="field"
        extra={extra}
        valuePropName={valuePropName}
        required={required}
        validateTrigger={validateTrigger}
        rules={rules}
      >
        {children}
      </Form.Item>
      <VStack gap={2}>
        <HStack gap={2}>
          <Button type="submit" variant="primary" label="Submit" />
          <Button
            variant="secondary"
            label="Reset"
            onClick={() => form.resetFields()}
          />
        </HStack>
        <ValueReadout label="Form value" value={value} />
      </VStack>
    </Form>
  );
}

/** Two copies of a control side by side, one per border status. */
export function StatusesDemo({
  render,
}: {
  render: (status: "warning" | "error") => ReactElement;
}) {
  return (
    <VStack gap={4} style={{ maxWidth: 400 }}>
      {render("warning")}
      {render("error")}
    </VStack>
  );
}
