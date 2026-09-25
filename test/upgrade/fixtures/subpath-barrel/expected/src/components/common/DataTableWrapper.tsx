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
      {/* TODO(ui-common-upgrade): TabList renders the tab strip only: turn `tabs` into <Tab value label /> children, render the active panel yourself (was `content` / `renderPanel`), and drop `groups`, `variant`, `overflowMode`, `fillContainer` (see `ui-common component TabList`; `segmented` is SegmentedControl). */}
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
      {/* TODO(ui-common-upgrade): Table columns are {key, header, width, align, renderCell}: rename id→key and render→renderCell, and widths use pixel()/proportional() from @lablup/ui-common/Table. */}
      {/* TODO(ui-common-upgrade): Table has no emptyState, onRowClick: rebuild them with Table plugins (useTableSortable, useTableColumnResize, useTableColumnSettings) or around the table. */}
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
      {/* TODO(ui-common-upgrade): lab Drawer renders no title, subtitle or footer: put a Heading (and the footer) inside its children, then remove `subtitle` / `footer`. */}
      {/* TODO(ui-common-upgrade): Drawer "preventDismiss": lab Drawer always dismisses on Escape and scrim click; guard in onOpenChange instead. */}
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
