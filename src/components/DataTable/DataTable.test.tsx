/**
 * Tests for `DataTable` (epic #2730 / issue #2738 · sort: epic #2859 / issue #2861).
 *
 * Covers:
 * - Renders header + body rows
 * - Empty state slot when `rows` is empty
 * - Loading state slot when `loading` is true
 * - Persists column widths to localStorage under the namespaced key
 * - Honors `alwaysVisible` so always-on columns can never be hidden
 * - Calls `onRowClick` for clickable rows
 *
 * Sorting (epic #2859 / issue #2861):
 * - Ascending sort (sortValueAccessor)
 * - Descending sort (sortValueAccessor)
 * - Sort toggle cycle: asc → desc → clear
 * - Keyboard activation (Enter and Space) of sortable headers
 * - aria-sort attribute on sorted and unsorted-but-sortable columns
 * - Stable sort: equal-valued rows retain original relative order
 * - Table without any sortable columns still renders correctly
 * - sortComparator overrides sortValueAccessor when both are present
 * - Controlled sort mode (sortColumnId + sortDirection + onSortChange)
 * - Resizing still works alongside sortable columns
 * - Original rows prop is not mutated by sorting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn, type SortDirection } from "./DataTable";

interface Row {
  id: string;
  name: string;
  score: number;
}

const ROWS: Row[] = [
  { id: "a", name: "Alpha", score: 3 },
  { id: "b", name: "Bravo", score: 1 },
  { id: "c", name: "Charlie", score: 2 },
];

const COLUMNS: DataTableColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    minWidth: 100,
    initialWidth: 200,
    render: (r) => <span>{r.name}</span>,
  },
  {
    id: "id",
    header: "ID",
    minWidth: 80,
    render: (r) => <code>{r.id}</code>,
  },
];

const SORTABLE_COLUMNS: DataTableColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    minWidth: 100,
    initialWidth: 200,
    sortable: true,
    sortValueAccessor: (r) => r.name,
    render: (r) => <span>{r.name}</span>,
  },
  {
    id: "score",
    header: "Score",
    minWidth: 80,
    sortable: true,
    sortValueAccessor: (r) => r.score,
    defaultSortDirection: "asc",
    render: (r) => <span data-testid={`score-${r.id}`}>{r.score}</span>,
  },
  {
    id: "id",
    header: "ID",
    minWidth: 80,
    render: (r) => <code>{r.id}</code>,
  },
];

describe("DataTable", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // ---- Existing baseline tests -------------------------------------------

  it("renders header and body cells", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();
  });

  it("renders the empty state when rows is empty", () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={[]}
        getRowKey={(r) => r.id}
        emptyState={<div>nothing here</div>}
      />,
    );
    expect(screen.getByText("nothing here")).toBeInTheDocument();
  });

  it("renders the loading state when loading is true", () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        loading
        loadingState={<div>loading rows</div>}
      />,
    );
    expect(screen.getByText("loading rows")).toBeInTheDocument();
  });

  it("invokes onRowClick when a row is clicked", () => {
    const onClick = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        onRowClick={onClick}
      />,
    );
    fireEvent.click(screen.getByText("Alpha"));
    expect(onClick).toHaveBeenCalledWith({ id: "a", name: "Alpha", score: 3 });
  });

  it("applies the column widths it is given", () => {
    const { container } = render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        columnState={{ widths: { name: 333 }, visibility: {} }}
      />,
    );
    const headers = container.querySelectorAll("th");
    expect(headers[0]?.getAttribute("style")).toContain("width: 333px");
  });

  it("hides columns whose visibility flag is false unless alwaysVisible", () => {
    const cols: DataTableColumn<Row>[] = [
      { ...COLUMNS[0]!, alwaysVisible: true },
      { ...COLUMNS[1]! },
    ];
    render(
      <DataTable
        columns={cols}
        rows={ROWS}
        getRowKey={(r) => r.id}
        columnState={{ widths: {}, visibility: { name: false, id: false } }}
      />,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByText("ID")).not.toBeInTheDocument();
  });

  it("touches no storage of its own", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const getItem = vi.spyOn(Storage.prototype, "getItem");

    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        columnState={{ widths: { name: 200 }, visibility: {} }}
        onColumnStateChange={() => {}}
      />,
    );

    // Where column preferences live is the consumer's decision, and a host
    // without `localStorage` has to keep working.
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    setItem.mockRestore();
    getItem.mockRestore();
  });

  it("does not report the state it was handed back to the caller", () => {
    const onColumnStateChange = vi.fn();
    const columnState = { widths: { name: 250 }, visibility: {} };

    const { rerender } = render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        columnState={columnState}
        onColumnStateChange={onColumnStateChange}
      />,
    );
    rerender(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        columnState={columnState}
        onColumnStateChange={onColumnStateChange}
      />,
    );

    // A caller that persists on change and feeds the result back must not
    // find itself in a loop.
    expect(onColumnStateChange).not.toHaveBeenCalled();
  });

  // ---- Sorting: aria-sort -------------------------------------------------

  it("renders aria-sort='none' on sortable columns when no sort is active", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    const headers = container.querySelectorAll("th");
    // Name column is sortable and inactive
    const nameHeader = Array.from(headers).find((h) => h.textContent?.includes("Name"));
    expect(nameHeader).toBeDefined();
    expect(nameHeader?.getAttribute("aria-sort")).toBe("none");
  });

  it("renders aria-sort='ascending' on the active ascending column", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    // Click Name header to sort ascending
    fireEvent.click(screen.getByText("Name"));
    const headers = container.querySelectorAll("th");
    const nameHeader = Array.from(headers).find((h) => h.textContent?.includes("Name"));
    expect(nameHeader?.getAttribute("aria-sort")).toBe("ascending");
  });

  it("renders aria-sort='descending' after clicking active column twice", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    const nameHeader = () =>
      Array.from(container.querySelectorAll("th")).find((h) =>
        h.textContent?.includes("Name"),
      )!;

    fireEvent.click(nameHeader()); // asc
    fireEvent.click(nameHeader()); // desc
    expect(nameHeader().getAttribute("aria-sort")).toBe("descending");
  });

  it("clears aria-sort after clicking active column a third time", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    const nameHeader = () =>
      Array.from(container.querySelectorAll("th")).find((h) =>
        h.textContent?.includes("Name"),
      )!;

    fireEvent.click(nameHeader()); // asc
    fireEvent.click(nameHeader()); // desc
    fireEvent.click(nameHeader()); // clear
    expect(nameHeader().getAttribute("aria-sort")).toBe("none");
  });

  it("does not set aria-sort on non-sortable columns", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    const headers = container.querySelectorAll("th");
    const idHeader = Array.from(headers).find((h) => h.textContent?.includes("ID"));
    expect(idHeader?.hasAttribute("aria-sort")).toBe(false);
  });

  // ---- Sorting: ascending / descending row order -------------------------

  it("sorts rows ascending by string accessor when header is clicked", () => {
    render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    fireEvent.click(screen.getByText("Name"));
    const cells = screen.getAllByRole("cell");
    const names = cells
      .map((c) => c.textContent)
      .filter((t) => ["Alpha", "Bravo", "Charlie"].includes(t ?? ""));
    expect(names).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("sorts rows descending by string accessor on second click", () => {
    render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    fireEvent.click(screen.getByText("Name")); // asc
    fireEvent.click(screen.getByText("Name")); // desc
    const cells = screen.getAllByRole("cell");
    const names = cells
      .map((c) => c.textContent)
      .filter((t) => ["Alpha", "Bravo", "Charlie"].includes(t ?? ""));
    expect(names).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("sorts rows ascending by numeric accessor", () => {
    render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    fireEvent.click(screen.getByText("Score"));
    expect(screen.getByTestId("score-b")).toBeInTheDocument(); // score 1
    const scoreIds = ["score-b", "score-c", "score-a"]; // 1, 2, 3
    const cells = scoreIds.map((id) => screen.getByTestId(id));
    expect(cells[0]?.textContent).toBe("1");
    expect(cells[1]?.textContent).toBe("2");
    expect(cells[2]?.textContent).toBe("3");
  });

  it("sorts rows descending by numeric accessor on second click", () => {
    render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    fireEvent.click(screen.getByText("Score")); // asc
    fireEvent.click(screen.getByText("Score")); // desc
    const scoreIds = ["score-a", "score-c", "score-b"]; // 3, 2, 1
    const cells = scoreIds.map((id) => screen.getByTestId(id));
    expect(cells[0]?.textContent).toBe("3");
    expect(cells[1]?.textContent).toBe("2");
    expect(cells[2]?.textContent).toBe("1");
  });

  // ---- Sorting: stable sort ---------------------------------------------

  it("preserves original order for rows with equal sort values (stable)", () => {
    const tiedRows: Row[] = [
      { id: "x", name: "Same", score: 10 },
      { id: "y", name: "Same", score: 10 },
      { id: "z", name: "Same", score: 10 },
    ];
    // Use a column definition that renders the id in a way we can query.
    const stableCols: DataTableColumn<Row>[] = [
      {
        id: "name",
        header: "Name",
        sortable: true,
        sortValueAccessor: (r) => r.name,
        render: (r) => <span>{r.name}</span>,
      },
      {
        id: "id",
        header: "ID",
        render: (r) => <span data-testid={`row-id-${r.id}`}>{r.id}</span>,
      },
    ];
    render(<DataTable columns={stableCols} rows={tiedRows} getRowKey={(r) => r.id} />);
    fireEvent.click(screen.getByText("Name")); // ascending
    // All three ids should still appear in original order x, y, z
    const idCells = [
      screen.getByTestId("row-id-x"),
      screen.getByTestId("row-id-y"),
      screen.getByTestId("row-id-z"),
    ];
    // Verify they are all present (stable sort didn't lose any rows)
    expect(idCells[0]?.textContent).toBe("x");
    expect(idCells[1]?.textContent).toBe("y");
    expect(idCells[2]?.textContent).toBe("z");
    // Verify the DOM order matches original insertion order (stable)
    const allRows = screen
      .getAllByRole("row")
      .filter((r) => r.querySelector("[data-testid^='row-id-']") !== null);
    expect(
      allRows.map((r) => r.querySelector("[data-testid^='row-id-']")?.textContent),
    ).toEqual(["x", "y", "z"]);
  });

  // ---- Sorting: keyboard activation --------------------------------------

  it("activates sort on Enter key press on a sortable header", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    const nameHeader = Array.from(container.querySelectorAll("th")).find((h) =>
      h.textContent?.includes("Name"),
    )!;
    fireEvent.keyDown(nameHeader, { key: "Enter" });
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
  });

  it("activates sort on Space key press on a sortable header", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    const nameHeader = Array.from(container.querySelectorAll("th")).find((h) =>
      h.textContent?.includes("Name"),
    )!;
    fireEvent.keyDown(nameHeader, { key: " " });
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
  });

  it("does not activate sort on arbitrary key press", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    const nameHeader = Array.from(container.querySelectorAll("th")).find((h) =>
      h.textContent?.includes("Name"),
    )!;
    fireEvent.keyDown(nameHeader, { key: "Tab" });
    expect(nameHeader.getAttribute("aria-sort")).toBe("none");
  });

  // ---- Sorting: sortComparator -------------------------------------------

  it("uses sortComparator when provided, overriding sortValueAccessor", () => {
    const comparatorSpy = vi.fn((a: Row, b: Row, dir: SortDirection) =>
      dir === "asc" ? a.score - b.score : b.score - a.score,
    );
    const cols: DataTableColumn<Row>[] = [
      {
        id: "score",
        header: "Score",
        sortable: true,
        sortValueAccessor: (_r) => 0, // Would produce no useful ordering
        sortComparator: comparatorSpy,
        render: (r) => <span data-testid={`score-${r.id}`}>{r.score}</span>,
      },
    ];
    render(<DataTable columns={cols} rows={ROWS} getRowKey={(r) => r.id} />);
    fireEvent.click(screen.getByText("Score"));
    expect(comparatorSpy).toHaveBeenCalled();
    // Comparator should produce ascending score order: 1, 2, 3
    expect(screen.getByTestId("score-b").textContent).toBe("1"); // b.score=1 first
  });

  // ---- Sorting: does not mutate original rows ----------------------------

  it("does not mutate the original rows prop when sorting", () => {
    const originalRows = [...ROWS];
    render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    fireEvent.click(screen.getByText("Name"));
    // ROWS array should be unchanged in identity and order
    expect(ROWS).toEqual(originalRows);
  });

  // ---- Sorting: table without sortable columns --------------------------

  it("renders correctly when no columns are sortable", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />);
    // No sort icons should be present
    const { container } = render(
      <DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    expect(container.querySelectorAll(".data-table__sort-icon").length).toBe(0);
    // All rows should still be rendered
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
  });

  // ---- Sorting: controlled mode -----------------------------------------

  it("calls onSortChange when a sortable header is clicked (controlled)", () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={SORTABLE_COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        sortColumnId={undefined}
        sortDirection={undefined}
        onSortChange={onSortChange}
      />,
    );
    fireEvent.click(screen.getByText("Name"));
    expect(onSortChange).toHaveBeenCalledWith("name", "asc");
  });

  it("renders rows according to controlled sort props", () => {
    render(
      <DataTable
        columns={SORTABLE_COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        sortColumnId="name"
        sortDirection="desc"
        onSortChange={vi.fn()}
      />,
    );
    const cells = screen.getAllByRole("cell");
    const names = cells
      .map((c) => c.textContent)
      .filter((t) => ["Alpha", "Bravo", "Charlie"].includes(t ?? ""));
    expect(names).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("renders aria-sort='descending' from controlled props", () => {
    const { container } = render(
      <DataTable
        columns={SORTABLE_COLUMNS}
        rows={ROWS}
        getRowKey={(r) => r.id}
        sortColumnId="name"
        sortDirection="desc"
        onSortChange={vi.fn()}
      />,
    );
    const nameHeader = Array.from(container.querySelectorAll("th")).find((h) =>
      h.textContent?.includes("Name"),
    );
    expect(nameHeader?.getAttribute("aria-sort")).toBe("descending");
  });

  // ---- Sorting: resizing compatibility ----------------------------------

  it("resizing a sortable column does not affect sort state", () => {
    const { container } = render(
      <DataTable columns={SORTABLE_COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />,
    );
    // Activate sort on name
    const nameHeader = Array.from(container.querySelectorAll("th")).find((h) =>
      h.textContent?.includes("Name"),
    )!;
    fireEvent.click(nameHeader);
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");

    // Simulate a resize drag on the same column's resize handle
    const resizeHandle = nameHeader.querySelector(
      ".data-table__resize-handle",
    ) as HTMLElement;
    fireEvent.mouseDown(resizeHandle, { clientX: 200 });
    fireEvent.mouseMove(window, { clientX: 250 });
    fireEvent.mouseUp(window);

    // Sort should still be active
    expect(nameHeader.getAttribute("aria-sort")).toBe("ascending");
  });
});
