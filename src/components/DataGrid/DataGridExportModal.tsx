/**
 * DataGridExportModal
 *
 * Picks the columns a CSV export includes: a searchable list of checkboxes,
 * all exportable columns checked on open. A column whose export keys are not
 * all in `supportedKeys` is shown disabled, so the user sees why it is
 * missing. Columns that export the same set of keys toggle together; the
 * emitted keys must not depend on which of two equivalent rows was clicked.
 *
 * Export awaits `onExport` with the chosen keys, deduplicated. It does not
 * close the dialog.
 *
 * @example
 * <DataGridExportModal
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   columns={[{ key: "name", label: "Name", exportKeys: ["name"] }]}
 *   supportedKeys={["name"]}
 *   onExport={async (keys) => {
 *     await download(keys);
 *     setIsOpen(false);
 *   }}
 * />
 */
import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { Modal, type ModalProps } from "../Modal/Modal";
import "./DataGrid.css";

export interface DataGridExportColumn {
  key: string;
  label: string;
  /** Fields the column exports as. None: the column cannot be exported. */
  exportKeys: ReadonlyArray<string>;
}

export interface DataGridExportModalProps extends Pick<
  ModalProps,
  "isOpen" | "onOpenChange" | "afterOpenChange"
> {
  columns: ReadonlyArray<DataGridExportColumn>;
  /** Export keys that can be produced. */
  supportedKeys: ReadonlyArray<string>;
  /** Runs the export. The Export button stays pending until it settles. */
  onExport: (keys: string[]) => Promise<void> | void;
  /** A warning above the list, e.g. that the export is truncated. */
  notice?: ReactNode;
  /** Default: the catalog's `uic.DataGrid.exportCsv` */
  title?: string;
  /** Default: the catalog's `uic.DataGrid.selectColumns` */
  subtitle?: string;
  /** Label and placeholder of the search field. Default: the catalog's `uic.DataGrid.searchColumns` */
  searchLabel?: string;
  /** Shown when no column matches the search. Default: the catalog's `uic.DataGrid.searchColumns` */
  noMatchText?: ReactNode;
  /** Default: the catalog's `uic.DataGrid.export` */
  exportLabel?: string;
  /** Default: the catalog's `uic.common.cancel` */
  cancelLabel?: string;
}

const WIDTH = 500;
const LIST_HEIGHT = "330px";

interface Option {
  key: string;
  label: string;
  exportKeys: ReadonlyArray<string>;
  isSelectable: boolean;
}

const groupIdOf = (keys: ReadonlyArray<string>) => [...keys].sort().join(",");

function ExportBody({
  columns,
  supportedKeys,
  onExport,
  onOpenChange,
  notice,
  title,
  subtitle,
  searchLabel,
  noMatchText,
  exportLabel,
  cancelLabel,
}: Omit<DataGridExportModalProps, "isOpen" | "afterOpenChange">) {
  const t = useUicTranslator();
  const options: Option[] = columns.map((column) => ({
    key: column.key,
    label: column.label,
    exportKeys: column.exportKeys,
    isSelectable:
      column.exportKeys.length > 0 &&
      column.exportKeys.every((key) => supportedKeys.includes(key)),
  }));

  const membersByGroup = new Map<string, string[]>();
  for (const option of options) {
    if (option.exportKeys.length === 0 || !option.isSelectable) continue;
    const groupId = groupIdOf(option.exportKeys);
    membersByGroup.set(groupId, [...(membersByGroup.get(groupId) ?? []), option.key]);
  }
  const membersOf = (option: Option) =>
    option.exportKeys.length === 0
      ? [option.key]
      : (membersByGroup.get(groupIdOf(option.exportKeys)) ?? [option.key]);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () =>
      new Set(
        options.filter((option) => option.isSelectable).map((option) => option.key),
      ),
  );
  const [search, setSearch] = useState("");

  const shownOptions = search
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;
  const searchText = searchLabel ?? t("uic.DataGrid.searchColumns");
  const close = () => onOpenChange?.(false);

  const toggle = (option: Option, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of membersOf(option)) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  };

  return (
    <Layout
      header={
        <DialogHeader
          title={title ?? t("uic.DataGrid.exportCsv")}
          subtitle={subtitle ?? t("uic.DataGrid.selectColumns")}
          onOpenChange={(next) => {
            if (!next) close();
          }}
        />
      }
      content={
        <LayoutContent>
          <VStack gap={2} align="stretch">
            {notice ? (
              <Banner
                status="warning"
                title={notice}
                data-testid="uic-data-grid-export-notice"
              />
            ) : null}
            <TextInput
              label={searchText}
              isLabelHidden
              placeholder={searchText}
              value={search}
              onChange={(value) => setSearch(value ?? "")}
              size="sm"
            />
            <div
              className="uic-data-grid-dialog__list"
              style={{ "--data-grid-dialog-list-height": LIST_HEIGHT } as CSSProperties}
            >
              <VStack gap={0} align="stretch">
                {shownOptions.map((option) => (
                  <div key={option.key} className="uic-data-grid-dialog__option">
                    <CheckboxInput
                      label={option.label || option.key}
                      size="sm"
                      value={selectedKeys.has(option.key)}
                      isDisabled={!option.isSelectable}
                      onChange={(checked) => toggle(option, checked)}
                    />
                  </div>
                ))}
                {shownOptions.length === 0 ? (
                  <Text type="supporting" color="secondary">
                    {noMatchText ?? searchText}
                  </Text>
                ) : null}
              </VStack>
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
              label={exportLabel ?? t("uic.DataGrid.export")}
              variant="primary"
              clickAction={async () => {
                const keys = options
                  .filter((option) => selectedKeys.has(option.key))
                  .flatMap((option) => option.exportKeys);
                await onExport([...new Set(keys)]);
              }}
            />
          </HStack>
        </LayoutFooter>
      }
      className="uic-data-grid-dialog"
    />
  );
}

export function DataGridExportModal({
  isOpen,
  onOpenChange,
  afterOpenChange,
  ...bodyProps
}: DataGridExportModalProps): ReactElement {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      afterOpenChange={afterOpenChange}
      width={WIDTH}
      purpose="form"
      unmountOnClose
    >
      <ExportBody {...bodyProps} onOpenChange={onOpenChange} />
    </Modal>
  );
}
