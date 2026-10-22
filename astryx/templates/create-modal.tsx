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
 * The controls take no label: each Form.Item's label names its control.
 */
import { useRef, useState } from "react";
import {
  Button,
  Form,
  Modal,
  Selector,
  TextArea,
  TextInput,
  type FormInstance,
  type ModalProps,
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

/** Placeholder for the app's mutation. */
async function create(values: CreateValues): Promise<void> {
  void values;
}

/** Modal's props, less the ones the form owns: the body and the submit. */
export interface CreateModalProps extends Omit<
  ModalProps,
  "children" | "onAction" | "footer"
> {
  onCreated?: () => void;
}

export function CreateModal({
  onOpenChange,
  onCreated,
  ...modalProps
}: CreateModalProps) {
  const formRef = useRef<FormInstance<CreateValues>>(null);
  return (
    <Modal
      title="Create item"
      actionLabel="Create"
      unmountOnClose
      {...modalProps}
      onOpenChange={onOpenChange}
      onAction={async () => {
        const values = await formRef.current?.validateFields().catch(() => null);
        if (!values) return;
        await create(values);
        onCreated?.();
        onOpenChange(false);
      }}
    >
      <Form ref={formRef} layout="vertical" initialValues={{ type: "standard" }}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Enter a name." }]}
        >
          <TextInput />
        </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Selector options={TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea />
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
