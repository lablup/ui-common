/**
 * Detail drawer: a side drawer that shows one row of a list.
 *
 * DrawerHeader carries the title, status and close button; the body is a
 * MetadataList of the item's facts; actions sit in a footer row.
 *
 * Presentation only: pass the selected item in and handle the actions in
 * the parent.
 */
import { useState } from "react";
import {
  Badge,
  Button,
  Divider,
  Drawer,
  DrawerHeader,
  HStack,
  MetadataList,
  MetadataListItem,
  Text,
  VStack,
  type DrawerProps,
} from "@lablup/ui-common";

export interface DetailItem {
  id: string;
  name: string;
  status: "running" | "stopped";
  owner: string;
  createdAt: string;
  description?: string;
}

/**
 * Drawer's props, less the ones the item owns: whether it is open and the
 * body. `label` defaults to the item's name.
 */
export interface DetailDrawerProps extends Omit<
  DrawerProps,
  "isOpen" | "children" | "label"
> {
  item: DetailItem | null;
  label?: string;
  onEdit: (item: DetailItem) => void;
  onDelete: (item: DetailItem) => void;
}

export function DetailDrawer({
  item,
  onOpenChange,
  onEdit,
  onDelete,
  label,
  ...drawerProps
}: DetailDrawerProps) {
  return (
    <Drawer
      side="end"
      width={480}
      {...drawerProps}
      isOpen={item !== null}
      onOpenChange={onOpenChange}
      label={label ?? (item ? `${item.name} details` : "Details")}
    >
      {item && (
        <VStack gap={0}>
          <DrawerHeader
            title={item.name}
            subtitle={item.id}
            startContent={
              <Badge
                label={item.status === "running" ? "Running" : "Stopped"}
                variant={item.status === "running" ? "success" : "neutral"}
              />
            }
            onOpenChange={onOpenChange}
            hasDivider
          />
          <VStack gap={4} padding={4}>
            <MetadataList columns="single">
              <MetadataListItem label="Owner">{item.owner}</MetadataListItem>
              <MetadataListItem label="Created">{item.createdAt}</MetadataListItem>
              <MetadataListItem label="Description">
                {item.description ?? <Text color="secondary">None</Text>}
              </MetadataListItem>
            </MetadataList>
          </VStack>
          <Divider />
          <HStack gap={2} justify="end" padding={4}>
            <Button
              label="Delete"
              variant="destructive"
              onClick={() => onDelete(item)}
            />
            <Button label="Edit" variant="primary" onClick={() => onEdit(item)} />
          </HStack>
        </VStack>
      )}
    </Drawer>
  );
}

const SAMPLE: DetailItem = {
  id: "item-1",
  name: "Item 1",
  status: "running",
  owner: "alice",
  createdAt: "2026-01-01",
};

/** The drawer opened from a row, as a list page would open it. */
export default function DetailDrawerExample() {
  const [selected, setSelected] = useState<DetailItem | null>(null);
  return (
    <>
      <Button label="Open details" onClick={() => setSelected(SAMPLE)} />
      <DetailDrawer
        item={selected}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        onEdit={() => {
          // Open the edit modal.
        }}
        onDelete={() => {
          // Confirm with DeleteConfirmModal, then delete.
        }}
      />
    </>
  );
}
