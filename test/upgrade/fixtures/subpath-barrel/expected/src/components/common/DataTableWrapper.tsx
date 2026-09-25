import { Table } from "@lablup/ui-common/Table";
import { Button } from "@lablup/ui-common/Button";
import type { TableColumn } from "@lablup/ui-common/Table";
import { EmptyState } from "@lablup/ui-common/EmptyState";
import { TabList } from "@lablup/ui-common/TabList";
import { Drawer } from "@lablup/ui-common/lab";
import { Selector } from "@lablup/ui-common/Selector";

export interface Row {
  id: string;
  name: string;
}

export function DataTableWrapper({
  rows,
  columns,
  open,
  setOpen,
  tab,
  setTab,
  region,
  setRegion,
}: {
  rows: Row[];
  columns: TableColumn<Row>[];
  open: boolean;
  setOpen: (open: boolean) => void;
  tab: string;
  setTab: (tab: string) => void;
  region: string;
  setRegion: (region: string) => void;
}) {
  return (
    <>
      {/* TODO(ui-common-upgrade): TabList renders the strip only. `tabs` (id, label, content) becomes <Tab value={id} label={label} /> children, and the active panel is rendered by the caller. */}
      <TabList
        tabs={[{ id: "all", label: "All", content: null }]}
        value={tab}
        onChange={setTab}
        aria-label="Views"
      />
      <Selector
        value={region}
        onChange={setRegion}
        options={[{ value: "kr", label: "Korea" }]}
        label="Region"
        size="sm"
        hasSearch
        width="100%"
        isLabelHidden />
      {/* TODO(ui-common-upgrade): Table idKey: idKey takes (item) or a property name; the index argument is gone. */}
      {/* TODO(ui-common-upgrade): Table columns: rename id→key, render→renderCell, initialWidth→width; renderCell takes the row item, and width is pixel()/proportional() from @lablup/ui-common/Table. */}
      {/* TODO(ui-common-upgrade): loading, loadingState and emptyState: render them around the Table. */}
      {/* TODO(ui-common-upgrade): onRowClick, isRowClickable and rowClassName: use the row-interaction plugin or children mode. */}
      <Table
        columns={columns}
        data={rows}
        idKey={(row) => row.id}
        aria-label="Sessions"
        emptyState={
          <EmptyState
            title="No sessions"
            description="Start one to see it here."
            actions={<Button variant="primary" label="Start" onClick={() => setOpen(true)} />}
          />
        }
        onRowClick={(row) => setOpen(Boolean(row))}
      />
      {/* TODO(ui-common-upgrade): lab Drawer renders no header: render the title, subtitle and footer inside children. */}
      {/* TODO(ui-common-upgrade): preventDismiss and onDismissAttempt: decline the close in onOpenChange. */}
      <Drawer isOpen={open} onOpenChange={isOpen => {
        if (!isOpen) {
          setOpen(false);
        }
      }} label="Session" width={900} preventDismiss>
        <p>Details</p>
      </Drawer>
    </>
  );
}
