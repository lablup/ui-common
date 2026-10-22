/**
 * List toolbar: the row above a list's table.
 *
 * Start: a segment that switches the list's scope (Running / Finished) and a
 * PowerSearch filter. End: once rows are selected, the selection count with
 * its bulk actions; then the refresh button.
 *
 * Presentation only. The parent owns the filter, the selection and the
 * fetch; `onRefresh` should resolve when the data has reloaded.
 */
import { useState } from "react";
import {
  CountdownBorder,
  HStack,
  IconButton,
  PowerSearch,
  SegmentedControl,
  SegmentedControlItem,
  SelectionLabel,
  usePowerSearchConfig,
  type PowerSearchFilter,
} from "@lablup/ui-common";
import { RotateCw, Square, Trash2 } from "lucide-react";

const AUTO_REFRESH_MS = 30_000;

const SEARCH_FIELDS = [
  { key: "name", type: "string", label: "Name" },
  { key: "owner", type: "string", label: "Owner" },
] as const;

export interface ListToolbarProps {
  scope: "running" | "finished";
  onScopeChange: (scope: "running" | "finished") => void;
  filters: ReadonlyArray<PowerSearchFilter>;
  onFiltersChange: (filters: ReadonlyArray<PowerSearchFilter>) => void;
  selectedCount: number;
  onClearSelection: () => void;
  onStopSelected: () => void;
  onDeleteSelected: () => void;
  /** Changes on every completed fetch; restarts the auto-refresh countdown. */
  fetchKey: number;
  isFetching: boolean;
  onRefresh: () => Promise<void>;
}

export function ListToolbar({
  scope,
  onScopeChange,
  filters,
  onFiltersChange,
  selectedCount,
  onClearSelection,
  onStopSelected,
  onDeleteSelected,
  fetchKey,
  isFetching,
  onRefresh,
}: ListToolbarProps) {
  const { config } = usePowerSearchConfig(SEARCH_FIELDS, "Items");
  return (
    <HStack gap={3} align="center" justify="between" wrap="wrap">
      <HStack gap={3} align="center" wrap="wrap">
        <SegmentedControl
          aria-label="Scope"
          value={scope}
          onChange={(value) =>
            onScopeChange(value === "finished" ? "finished" : "running")
          }
        >
          <SegmentedControlItem value="running" label="Running" />
          <SegmentedControlItem value="finished" label="Finished" />
        </SegmentedControl>
        <PowerSearch
          label="Filter items"
          isLabelHidden
          config={config}
          filters={filters}
          onChange={onFiltersChange}
        />
      </HStack>
      <HStack gap={2} align="center">
        {selectedCount > 0 && (
          <>
            <SelectionLabel count={selectedCount} onClear={onClearSelection} />
            <IconButton
              label="Stop selected"
              icon={<Square />}
              variant="ghost"
              onClick={onStopSelected}
            />
            <IconButton
              label="Delete selected"
              icon={<Trash2 />}
              variant="ghost"
              onClick={onDeleteSelected}
            />
          </>
        )}
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
            clickAction={onRefresh}
          />
        </CountdownBorder>
      </HStack>
    </HStack>
  );
}

/** The toolbar wired to placeholder state, as a list page would hold it. */
export default function ListToolbarExample() {
  const [scope, setScope] = useState<"running" | "finished">("running");
  const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [selectedCount, setSelectedCount] = useState(2);
  const [fetchKey, setFetchKey] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  return (
    <ListToolbar
      scope={scope}
      onScopeChange={setScope}
      filters={filters}
      onFiltersChange={setFilters}
      selectedCount={selectedCount}
      onClearSelection={() => setSelectedCount(0)}
      onStopSelected={() => {
        // Stop the selected rows.
      }}
      onDeleteSelected={() => {
        // Confirm with DeleteConfirmModal, then delete the selected rows.
      }}
      fetchKey={fetchKey}
      isFetching={isFetching}
      onRefresh={async () => {
        setIsFetching(true);
        try {
          // Refetch the list.
        } finally {
          setIsFetching(false);
          setFetchKey((key) => key + 1);
        }
      }}
    />
  );
}
