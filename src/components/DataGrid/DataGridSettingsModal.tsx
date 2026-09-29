/**
 * DataGridSettingsModal
 *
 * Chooses which columns a grid shows, and in what order: a searchable list of
 * checkboxes with drag handles. Columns marked `isAlwaysVisible` stay checked.
 * Dragging is off while a search narrows the list. The working set is fresh
 * on every open; Apply reports it and does not close the dialog.
 *
 * @example
 * <DataGridSettingsModal
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   columns={[{ key: "name", label: "Name", isAlwaysVisible: true }, { key: "email", label: "Email" }]}
 *   visibleColumnKeys={["name"]}
 *   onApply={(result) => {
 *     save(result);
 *     setIsOpen(false);
 *   }}
 * />
 */
import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { GripVertical } from "lucide-react";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { Modal, type ModalProps } from "../Modal/Modal";
import "./DataGrid.css";

export interface DataGridSettingsColumn {
  key: string;
  label: string;
  /** Always shown; its checkbox is locked. */
  isAlwaysVisible?: boolean;
}

export interface DataGridSettingsResult {
  /** The checked keys, always-visible columns included. */
  selectedColumnKeys: string[];
  /** Every column key, in the order the user left them. */
  columnOrder: string[];
}

export interface DataGridSettingsModalProps extends Pick<
  ModalProps,
  "isOpen" | "onOpenChange" | "afterOpenChange"
> {
  columns: ReadonlyArray<DataGridSettingsColumn>;
  /** The keys shown now, in display order. */
  visibleColumnKeys: ReadonlyArray<string>;
  /** Whether rows can be dragged into a new order. Default: true */
  isReorderable?: boolean;
  /** Called with the new settings on Apply. It does not close the dialog. */
  onApply: (result: DataGridSettingsResult) => void;
  /** Default: the catalog's `uic.DataGrid.settings` */
  title?: string;
  /** Default: the catalog's `uic.DataGrid.selectColumns` */
  subtitle?: string;
  /** Label and placeholder of the search field. Default: the catalog's `uic.DataGrid.searchColumns` */
  searchLabel?: string;
  /** Shown when no column matches the search. Default: the catalog's `uic.DataGrid.searchColumns` */
  noMatchText?: ReactNode;
  /** Default: the catalog's `uic.common.apply` */
  applyLabel?: string;
  /** Default: the catalog's `uic.common.cancel` */
  cancelLabel?: string;
}

const WIDTH = 420;
const LIST_HEIGHT = "360px";

function SortableRow({
  id,
  isDragDisabled,
  children,
}: {
  id: string;
  isDragDisabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: isDragDisabled });
  return (
    <div
      ref={setNodeRef}
      className="uic-data-grid-dialog__row"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      {isDragDisabled ? (
        <span className="uic-data-grid-dialog__handle-space" />
      ) : (
        <span
          {...attributes}
          {...listeners}
          className="uic-data-grid-dialog__handle"
          aria-hidden
        >
          <GripVertical size={16} />
        </span>
      )}
      {children}
    </div>
  );
}

function SettingsBody({
  columns,
  visibleColumnKeys,
  isReorderable,
  onApply,
  onOpenChange,
  title,
  subtitle,
  searchLabel,
  noMatchText,
  applyLabel,
  cancelLabel,
}: Omit<DataGridSettingsModalProps, "isOpen" | "afterOpenChange"> & {
  isReorderable: boolean;
}) {
  const t = useUicTranslator();
  const [order, setOrder] = useState<string[]>(() => {
    const known = new Set(columns.map((column) => column.key));
    const visible = visibleColumnKeys.filter((key) => known.has(key));
    const rest = columns
      .map((column) => column.key)
      .filter((key) => !visible.includes(key));
    return [...visible, ...rest];
  });
  const [selected, setSelected] = useState<string[]>(() => [...visibleColumnKeys]);
  const [search, setSearch] = useState("");

  const columnByKey = new Map(columns.map((column) => [column.key, column]));
  const shownKeys = order.filter((key) => {
    const column = columnByKey.get(key);
    if (!column) return false;
    return !search || column.label.toLowerCase().includes(search.toLowerCase());
  });
  const isDragDisabled = !isReorderable || !!search;
  const searchText = searchLabel ?? t("uic.DataGrid.searchColumns");
  const close = () => onOpenChange?.(false);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    setOrder(arrayMove(order, from, to));
  };

  const list = (
    <VStack gap={0} align="stretch">
      {shownKeys.map((key) => {
        const column = columnByKey.get(key);
        if (!column) return null;
        return (
          <SortableRow key={key} id={key} isDragDisabled={isDragDisabled}>
            <CheckboxInput
              label={column.label || key}
              size="sm"
              value={selected.includes(key) || !!column.isAlwaysVisible}
              isDisabled={!!column.isAlwaysVisible}
              onChange={(checked) =>
                setSelected((prev) =>
                  checked
                    ? prev.includes(key)
                      ? prev
                      : [...prev, key]
                    : prev.filter((k) => k !== key),
                )
              }
            />
          </SortableRow>
        );
      })}
      {shownKeys.length === 0 ? (
        <Text type="supporting" color="secondary">
          {noMatchText ?? searchText}
        </Text>
      ) : null}
    </VStack>
  );

  return (
    <Layout
      header={
        <DialogHeader
          title={title ?? t("uic.DataGrid.settings")}
          subtitle={subtitle ?? t("uic.DataGrid.selectColumns")}
          onOpenChange={(next) => {
            if (!next) close();
          }}
        />
      }
      content={
        <LayoutContent>
          <VStack gap={2} align="stretch">
            <TextInput
              label={searchText}
              isLabelHidden
              placeholder={searchText}
              value={search}
              onChange={(value) => setSearch(value ?? "")}
            />
            <div
              className="uic-data-grid-dialog__list"
              style={
                { "--uic-data-grid-dialog-list-height": LIST_HEIGHT } as CSSProperties
              }
            >
              {isDragDisabled ? (
                list
              ) : (
                <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                  <SortableContext
                    items={shownKeys}
                    strategy={verticalListSortingStrategy}
                  >
                    {list}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </VStack>
        </LayoutContent>
      }
      footer={
        <LayoutFooter hasDivider>
          <HStack justify="end" gap={2} align="center">
            <Button
              label={cancelLabel ?? t("uic.common.cancel")}
              variant="secondary"
              onClick={close}
            />
            <Button
              label={applyLabel ?? t("uic.common.apply")}
              variant="primary"
              onClick={() => {
                const required = columns
                  .filter((column) => column.isAlwaysVisible)
                  .map((column) => column.key);
                onApply({
                  selectedColumnKeys: [
                    ...selected,
                    ...required.filter((key) => !selected.includes(key)),
                  ],
                  columnOrder: order,
                });
              }}
            />
          </HStack>
        </LayoutFooter>
      }
      className="uic-data-grid-dialog"
    />
  );
}

export function DataGridSettingsModal({
  isOpen,
  onOpenChange,
  afterOpenChange,
  isReorderable = true,
  ...bodyProps
}: DataGridSettingsModalProps): ReactElement {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      afterOpenChange={afterOpenChange}
      width={WIDTH}
      purpose="form"
      unmountOnClose
    >
      <SettingsBody
        {...bodyProps}
        onOpenChange={onOpenChange}
        isReorderable={isReorderable}
      />
    </Modal>
  );
}
