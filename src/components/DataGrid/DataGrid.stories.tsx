import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import {
  DataGrid,
  type DataGridColumn,
  type DataGridKey,
  type DataGridSort,
} from "./DataGrid";
import { DataGridExportModal } from "./DataGridExportModal";
import { DataGridSettingsModal } from "./DataGridSettingsModal";

interface Resource {
  id: string;
  name: string;
  kind: "Compute" | "Storage" | "Network";
  status: "Running" | "Stopped" | "Pending";
  region: string;
  cpu: number;
  memoryGiB: number;
  createdAt: string;
}

const KINDS = ["Compute", "Storage", "Network"] as const;
const STATUSES = ["Running", "Stopped", "Pending"] as const;
const REGIONS = ["region-a", "region-b", "region-c"];

const makeResources = (count: number): Resource[] =>
  Array.from({ length: count }, (_unused, index) => {
    const n = index + 1;
    return {
      id: `res-${String(n).padStart(3, "0")}`,
      name: `resource-${String(n).padStart(2, "0")}`,
      kind: KINDS[index % KINDS.length]!,
      status: STATUSES[(index * 7) % STATUSES.length]!,
      region: REGIONS[(index * 5) % REGIONS.length]!,
      cpu: ((index * 3) % 16) + 1,
      memoryGiB: 2 ** ((index % 6) + 1),
      createdAt: new Date(Date.UTC(2026, 0, 1 + ((index * 11) % 90)))
        .toISOString()
        .slice(0, 10),
    };
  });

const RESOURCES = makeResources(30);
const MANY_RESOURCES = makeResources(240);

const byString =
  (field: "name" | "kind" | "status" | "region" | "createdAt") =>
  (a: Resource, b: Resource) =>
    a[field].localeCompare(b[field]);
const byNumber = (field: "cpu" | "memoryGiB") => (a: Resource, b: Resource) =>
  a[field] - b[field];

const COLUMNS: DataGridColumn<Resource>[] = [
  {
    key: "name",
    header: "Name",
    renderCell: (r) => r.name,
    sortKey: "name",
    compare: byString("name"),
    isAlwaysVisible: true,
    exportKeys: ["name"],
  },
  {
    key: "kind",
    header: "Kind",
    renderCell: (r) => r.kind,
    sortKey: "kind",
    compare: byString("kind"),
    exportKeys: ["kind"],
  },
  {
    key: "status",
    header: "Status",
    renderCell: (r) => r.status,
    sortKey: "status",
    compare: byString("status"),
    exportKeys: ["status"],
  },
  {
    key: "region",
    header: "Region",
    renderCell: (r) => r.region,
    exportKeys: ["region"],
  },
  {
    key: "cpu",
    header: "CPU",
    renderCell: (r) => r.cpu,
    align: "end",
    width: 90,
    sortKey: "cpu",
    compare: byNumber("cpu"),
    exportKeys: ["cpu"],
  },
  {
    key: "memory",
    header: "Memory",
    renderCell: (r) => `${r.memoryGiB} GiB`,
    align: "end",
    width: 110,
    sortKey: "memory",
    compare: byNumber("memoryGiB"),
    exportKeys: ["memory_gib"],
  },
  {
    key: "createdAt",
    header: "Created",
    renderCell: (r) => r.createdAt,
    width: 130,
    sortKey: "createdAt",
    compare: byString("createdAt"),
    exportKeys: ["created_at"],
  },
];

const meta = {
  title: "Components/DataGrid",
  component: DataGrid<Resource>,
  subcomponents: { DataGridSettingsModal, DataGridExportModal },
  args: {
    data: RESOURCES,
    columns: COLUMNS,
    idKey: "id",
    onSortChange: fn(),
  },
} satisfies Meta<typeof DataGrid<Resource>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sorting: Story = {
  render: function Render(args) {
    const [sort, setSort] = useState<DataGridSort | null>({
      sortKey: "cpu",
      direction: "descending",
    });
    return (
      <DataGrid<Resource>
        {...args}
        sort={sort}
        onSortChange={(next) => {
          args.onSortChange?.(next);
          setSort(next);
        }}
      />
    );
  },
};

export const Selection: Story = {
  render: function Render(args) {
    const [selectedKeys, setSelectedKeys] = useState<DataGridKey[]>([
      "res-001",
      "res-004",
    ]);
    return (
      <DataGrid<Resource>
        {...args}
        selection={{
          selectedKeys,
          onChange: (keys) => setSelectedKeys(keys),
          getIsItemEnabled: (r) => r.status !== "Pending",
          getRowLabel: (r) => r.name,
        }}
      />
    );
  },
};

export const ColumnResizing: Story = {
  args: {
    isResizable: true,
    columns: COLUMNS.map((column) => ({ ...column, width: column.width ?? 160 })),
  },
};

export const NotResizable: Story = {
  args: { isResizable: false },
};

export const PinnedColumns: Story = {
  args: {
    scrollWidth: 1400,
    columns: COLUMNS.map((column) =>
      column.key === "name"
        ? { ...column, pin: "start" as const, width: 180 }
        : column.key === "createdAt"
          ? { ...column, pin: "end" as const }
          : column,
    ),
  },
};

export const StickyHeader: Story = {
  args: { pagination: false, maxHeight: 320 },
};

export const GroupHeaders: Story = {
  args: {
    columns: COLUMNS.map((column) =>
      column.key === "cpu" || column.key === "memory"
        ? { ...column, groupHeader: "Allocation" }
        : column,
    ),
  },
};

export const Expansion: Story = {
  args: {
    expansion: {
      renderExpandedRow: (r) =>
        `${r.name} runs in ${r.region} with ${r.cpu} CPU and ${r.memoryGiB} GiB memory.`,
      getIsRowExpandable: (r) => r.kind === "Compute",
      onExpandedKeysChange: fn(),
    },
  },
};

export const ColumnSettings: Story = {
  args: {
    columnSettings: {
      defaultOverrides: { region: { hidden: true } },
      onOverridesChange: fn(),
    },
  },
};

export const CsvExport: Story = {
  args: {
    csvExport: {
      supportedKeys: ["name", "kind", "status", "region", "cpu", "memory_gib"],
      onExport: fn(async (_keys: string[]) => {}),
      notice: "The export includes at most 1,000 rows.",
    },
  },
};

export const ServerPagination: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    return (
      <DataGrid<Resource>
        {...args}
        data={MANY_RESOURCES.slice((page - 1) * pageSize, page * pageSize)}
        pagination={{
          page,
          pageSize,
          totalItems: MANY_RESOURCES.length,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
      />
    );
  },
};

export const WithoutPagination: Story = {
  args: { data: RESOURCES.slice(0, 5), pagination: false },
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const Empty: Story = {
  args: { data: [] },
};

export const CustomEmptyState: Story = {
  args: { data: [], emptyState: "No resources match the filter." },
};

export const SettingsModal: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button label="Open settings" onClick={() => setIsOpen(true)} />
        <DataGridSettingsModal
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          columns={COLUMNS.map((column) => ({
            key: column.key,
            label: String(column.header),
            isAlwaysVisible: column.isAlwaysVisible,
          }))}
          visibleColumnKeys={["name", "kind", "status", "cpu"]}
          onApply={fn()}
        />
      </>
    );
  },
};

export const ExportModal: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button label="Open export" onClick={() => setIsOpen(true)} />
        <DataGridExportModal
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          columns={COLUMNS.map((column) => ({
            key: column.key,
            label: String(column.header),
            exportKeys: column.exportKeys ?? [],
          }))}
          supportedKeys={["name", "kind", "status", "cpu"]}
          onExport={fn()}
        />
      </>
    );
  },
};
