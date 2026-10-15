/**
 * Info modal: a read-only modal of one record's facts, closed with a single
 * button.
 *
 * Presentation only: pass the record in. For a record that has its own
 * actions, use the detail-drawer template instead.
 */
import { useState } from "react";
import { Button, MetadataList, MetadataListItem, Modal, Text } from "@lablup/ui-common";

export interface InfoRecord {
  name: string;
  email: string;
  role: string;
  createdAt: string;
  description?: string;
}

export interface InfoModalProps {
  record: InfoRecord | null;
  onOpenChange: (isOpen: boolean) => void;
}

export function InfoModal({ record, onOpenChange }: InfoModalProps) {
  return (
    <Modal
      isOpen={record !== null}
      onOpenChange={onOpenChange}
      title={record?.name ?? "Details"}
      footer={
        <Button label="Close" variant="secondary" onClick={() => onOpenChange(false)} />
      }
    >
      {record && (
        <MetadataList columns="single">
          <MetadataListItem label="Email">{record.email}</MetadataListItem>
          <MetadataListItem label="Role">{record.role}</MetadataListItem>
          <MetadataListItem label="Created">{record.createdAt}</MetadataListItem>
          <MetadataListItem label="Description">
            {record.description ?? <Text color="secondary">None</Text>}
          </MetadataListItem>
        </MetadataList>
      )}
    </Modal>
  );
}

const SAMPLE: InfoRecord = {
  name: "Alice",
  email: "alice@example.com",
  role: "Admin",
  createdAt: "2026-01-01",
};

/** The modal behind the button that opens it. */
export default function InfoModalExample() {
  const [record, setRecord] = useState<InfoRecord | null>(null);
  return (
    <>
      <Button label="Show info" onClick={() => setRecord(SAMPLE)} />
      <InfoModal
        record={record}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRecord(null);
        }}
      />
    </>
  );
}
