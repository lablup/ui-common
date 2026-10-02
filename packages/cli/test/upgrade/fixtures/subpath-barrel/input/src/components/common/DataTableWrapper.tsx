import { DataTable } from "@lablup/ui-common/components/DataTable";
import type { DataTableColumn } from "@lablup/ui-common/components/DataTable";
import { EmptyState } from "@lablup/ui-common/components/EmptyState";
import { Tabs } from "@lablup/ui-common/components/Tabs";
import { Drawer } from "@lablup/ui-common/components/Drawer";
import { Select } from "@lablup/ui-common/components/Select";

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
  columns: DataTableColumn<Row>[];
  open: boolean;
  setOpen: (open: boolean) => void;
  tab: string;
  setTab: (tab: string) => void;
  region: string;
  setRegion: (region: string) => void;
}) {
  return (
    <>
      <Tabs
        tabs={[{ id: "all", label: "All", content: null }]}
        activeTab={tab}
        onTabChange={setTab}
        ariaLabel="Views"
      />
      <Select
        value={region}
        onChange={setRegion}
        options={[{ value: "kr", label: "Korea" }]}
        aria-label="Region"
        size="small"
        searchable
        fullWidth
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        ariaLabel="Sessions"
        emptyState={
          <EmptyState
            title="No sessions"
            description="Start one to see it here."
            primaryAction={{ label: "Start", onClick: () => setOpen(true) }}
          />
        }
        onRowClick={(row) => setOpen(Boolean(row))}
      />
      <Drawer isOpen={open} onClose={() => setOpen(false)} title="Session" width="wide" preventDismiss>
        <p>Details</p>
      </Drawer>
    </>
  );
}
