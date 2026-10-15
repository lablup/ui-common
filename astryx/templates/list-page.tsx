/**
 * List page: a header with refresh and create actions, a PowerSearch filter,
 * and a server-paged DataGrid with sorting and row selection.
 *
 * Presentation only. `fetchPage` stands in for the app's data layer: replace
 * it with your query, and pass the filters, sort and page it receives on to
 * the server. The refresh button re-runs it on click and every
 * AUTO_REFRESH_MS; CountdownBorder draws the time left until the next run.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  CountdownBorder,
  DataGrid,
  HStack,
  IconButton,
  PageHeader,
  PageLayout,
  PowerSearch,
  SelectionLabel,
  VStack,
  usePowerSearchConfig,
  type DataGridColumn,
  type DataGridSort,
  type PowerSearchFilter,
} from "@lablup/ui-common";
import { Plus, RotateCw } from "lucide-react";

const AUTO_REFRESH_MS = 30_000;

interface Row {
  id: string;
  name: string;
  status: "running" | "stopped";
  owner: string;
  createdAt: string;
}

interface Page {
  items: Row[];
  total: number;
}

const SEARCH_FIELDS = [
  { key: "name", type: "string", label: "Name" },
  {
    key: "status",
    type: "enum",
    label: "Status",
    enumValues: [
      { value: "running", label: "Running" },
      { value: "stopped", label: "Stopped" },
    ],
  },
  { key: "owner", type: "string", label: "Owner" },
] as const;

const SAMPLE_ROWS: Row[] = Array.from({ length: 42 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: `Item ${i + 1}`,
  status: i % 3 === 0 ? "stopped" : "running",
  owner: i % 2 === 0 ? "alice" : "bob",
  createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
}));

/** Placeholder for the app's query. Filters and sort are applied server-side. */
async function fetchPage(request: {
  filters: ReadonlyArray<PowerSearchFilter>;
  sort: DataGridSort | null;
  page: number;
  pageSize: number;
}): Promise<Page> {
  const start = (request.page - 1) * request.pageSize;
  return {
    items: SAMPLE_ROWS.slice(start, start + request.pageSize),
    total: SAMPLE_ROWS.length,
  };
}

const COLUMNS: ReadonlyArray<DataGridColumn<Row>> = [
  {
    key: "name",
    header: "Name",
    sortKey: "name",
    isAlwaysVisible: true,
    renderCell: (row) => row.name,
  },
  {
    key: "status",
    header: "Status",
    renderCell: (row) => (
      <Badge
        label={row.status === "running" ? "Running" : "Stopped"}
        variant={row.status === "running" ? "success" : "neutral"}
      />
    ),
  },
  { key: "owner", header: "Owner", sortKey: "owner", renderCell: (row) => row.owner },
  {
    key: "createdAt",
    header: "Created",
    sortKey: "createdAt",
    renderCell: (row) => row.createdAt,
  },
];

export default function ListPage() {
  const { config } = usePowerSearchConfig(SEARCH_FIELDS, "Items");
  const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [sort, setSort] = useState<DataGridSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [data, setData] = useState<Page>({ items: [], total: 0 });
  const [isFetching, setIsFetching] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const refresh = useCallback(async () => {
    setIsFetching(true);
    try {
      setData(await fetchPage({ filters, sort, page, pageSize }));
    } finally {
      setIsFetching(false);
      setFetchKey((key) => key + 1);
    }
  }, [filters, sort, page, pageSize]);

  // Load on every query change, then again AUTO_REFRESH_MS after each load.
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (isFetching) return;
    const timer = setTimeout(() => void refresh(), AUTO_REFRESH_MS);
    return () => clearTimeout(timer);
  }, [fetchKey, isFetching, refresh]);

  return (
    <PageLayout>
      <VStack gap={4}>
        <PageHeader
          title="Items"
          description="Everything in this project."
          actions={
            <HStack gap={2} align="center">
              <CountdownBorder
                durationMs={AUTO_REFRESH_MS}
                resetKey={fetchKey}
                isPaused={isFetching}
              >
                <IconButton
                  label="Refresh"
                  icon={<RotateCw />}
                  variant="ghost"
                  isLoading={isFetching}
                  clickAction={refresh}
                />
              </CountdownBorder>
              <Button
                label="Create"
                variant="primary"
                icon={<Plus />}
                onClick={() => {
                  // Open the create modal (see the create-modal template).
                }}
              />
            </HStack>
          }
        />
        <HStack gap={3} align="center" justify="between">
          <PowerSearch
            label="Filter items"
            isLabelHidden
            config={config}
            filters={filters}
            onChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
          />
          {selectedKeys.length > 0 && (
            <SelectionLabel
              count={selectedKeys.length}
              onClear={() => setSelectedKeys([])}
            />
          )}
        </HStack>
        <DataGrid
          data={data.items}
          columns={COLUMNS}
          idKey="id"
          isLoading={isFetching && data.items.length === 0}
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            setPage(1);
          }}
          selection={{
            selectedKeys,
            onChange: (keys) => setSelectedKeys(keys),
            isPreservingOtherPages: true,
          }}
          pagination={{
            page,
            pageSize,
            totalItems: data.total,
            hasPageSizeSelector: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </VStack>
    </PageLayout>
  );
}
