/**
 * Create modal: a Modal around a validated Form.
 *
 * The modal's primary action submits the form. `onAction` returns the
 * submission's promise, so the button shows its pending state until the
 * create call settles; validation errors keep the modal open on the first
 * invalid field.
 *
 * Presentation only. `create` stands in for the app's mutation.
 *
 * `TextInput` and `TextArea` require `value`; inside `Form.Item` the item
 * supplies it, so the fields below take it as optional.
 */
import { useState } from "react";
import {
  Button,
  Form,
  Modal,
  Selector,
  TextArea,
  TextInput,
  type TextAreaProps,
  type TextInputProps,
} from "@lablup/ui-common";
import { Plus } from "lucide-react";

interface CreateValues {
  name: string;
  type: string;
  description?: string;
}

const TYPE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "shared", label: "Shared" },
];

function TextField({
  value,
  ...props
}: Omit<TextInputProps, "value"> & { value?: string }) {
  return <TextInput {...props} value={value ?? ""} />;
}

function TextAreaField({
  value,
  ...props
}: Omit<TextAreaProps, "value"> & { value?: string }) {
  return <TextArea {...props} value={value ?? ""} />;
}

/** Placeholder for the app's mutation. */
async function create(values: CreateValues): Promise<void> {
  void values;
}

export interface CreateModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated?: () => void;
}

export function CreateModal({ isOpen, onOpenChange, onCreated }: CreateModalProps) {
  const [form] = Form.useForm<CreateValues>();
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Create item"
      actionLabel="Create"
      unmountOnClose
      onAction={async () => {
        const values = await form.validateFields().catch(() => null);
        if (!values) return;
        await create(values);
        onCreated?.();
        onOpenChange(false);
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ type: "standard" }}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Enter a name." }]}
        >
          <TextField label="Name" isLabelHidden />
        </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Selector label="Type" isLabelHidden options={TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextAreaField label="Description" isLabelHidden />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** The modal behind the button that opens it. */
export default function CreateModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        label="Create"
        variant="primary"
        icon={<Plus />}
        onClick={() => setIsOpen(true)}
      />
      <CreateModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
