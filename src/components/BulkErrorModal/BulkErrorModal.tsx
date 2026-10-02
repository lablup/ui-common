/**
 * BulkErrorModal
 *
 * Reports the failures of a bulk operation: one row per failed item, in a
 * `DataGrid` the caller describes with its own columns, since every bulk
 * operation reports a different shape. An optional error banner above it
 * carries guidance, such as how to retry. The modal is a report: it has no
 * footer, and closing goes through the header's close button, the backdrop
 * or Escape (`onOpenChange(false)`).
 *
 * The grid is compact with column rules, pages at ten rows and hides its page
 * bar while every row fits on one page.
 *
 * @example
 * <BulkErrorModal
 *   isOpen={failures.length > 0}
 *   onOpenChange={(open) => !open && setFailures([])}
 *   columns={[
 *     { key: "name", header: "Folder", renderCell: (row) => row.name },
 *     { key: "message", header: "Error", renderCell: (row) => row.message },
 *   ]}
 *   data={failures}
 *   description="Fix the failed folders and try again."
 * />
 */
import type { ReactElement, ReactNode } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { TriangleAlert } from "lucide-react";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import {
  DataGrid,
  type DataGridColumn,
  type DataGridProps,
} from "../DataGrid/DataGrid";
import { Modal, type ModalProps } from "../Modal/Modal";
import "./BulkErrorModal.css";

export interface BulkErrorModalProps<T extends object> extends Omit<
  ModalProps,
  | "children"
  | "title"
  | "footer"
  | "onAction"
  | "actionLabel"
  | "actionVariant"
  | "isActionLoading"
  | "isActionDisabled"
  | "actionButtonProps"
  | "cancelLabel"
  | "hasCancelButton"
> {
  /** How one failed item renders, per column. */
  columns: ReadonlyArray<DataGridColumn<T>>;
  /** One item per failure. */
  data: ReadonlyArray<T>;
  /** Row identity. Default: the item's `id`, then its `key`. */
  idKey?: DataGridProps<T>["idKey"];
  /** Guidance in an error banner above the grid. Without it there is no banner. */
  description?: ReactNode;
  /**
   * Title of the banner. Default: the catalog's `uic.BulkErrorModal.errorOccurred`
   */
  descriptionTitle?: ReactNode;
  /**
   * Modal title. Default: an error glyph and the catalog's
   * `uic.BulkErrorModal.title` ("Action execution failed").
   */
  title?: ReactNode;
}

const WIDTH = 720;
const PAGE_SIZE = 10;

export function BulkErrorModal<T extends object>({
  columns,
  data,
  idKey,
  description,
  descriptionTitle,
  title,
  width = WIDTH,
  ...modalProps
}: BulkErrorModalProps<T>): ReactElement {
  const t = useUicTranslator();
  return (
    <Modal
      {...modalProps}
      width={width}
      title={
        title ?? (
          <HStack gap={2} align="center">
            {/* `var()` does not resolve in the stroke attribute, so the glyph
                strokes currentColor and the class sets the colour. */}
            <TriangleAlert
              color="currentColor"
              size="1em"
              className="uic-bulk-error-modal__icon"
              aria-hidden
            />
            {t("uic.BulkErrorModal.title")}
          </HStack>
        )
      }
      footer={null}
    >
      <VStack gap={3} align="stretch">
        {description ? (
          <Banner
            status="error"
            title={descriptionTitle ?? t("uic.BulkErrorModal.errorOccurred")}
            description={description}
          />
        ) : null}
        <DataGrid<T>
          columns={columns}
          data={data}
          idKey={idKey}
          scrollWidth="max-content"
          pagination={{
            pageSize: PAGE_SIZE,
            hasPageSizeSelector: false,
            isHiddenOnSinglePage: true,
          }}
          isResizable={false}
          density="compact"
          dividers="grid"
        />
      </VStack>
    </Modal>
  );
}
