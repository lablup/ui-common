import { useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { DataGrid, type DataGridColumn } from "./DataGrid";

interface Row {
  id: string;
  name: string;
  size: number;
}

const makeRows = (count: number): Row[] =>
  Array.from({ length: count }, (_unused, index) => ({
    id: String(index + 1),
    name: `row-${index + 1}`,
    size: index + 1,
  }));

const COLUMNS: DataGridColumn<Row>[] = [
  { key: "name", header: "Name", renderCell: (row) => row.name },
];

type Props = ComponentProps<typeof DataGrid<Row>>;

const renderGrid = (props: Partial<Props> = {}) =>
  render(<DataGrid<Row> idKey="id" columns={COLUMNS} {...props} />);

const bodyOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".uic-data-grid__body")!;

const pickPageSize = async (size: number) => {
  await userEvent.click(screen.getByRole("combobox", { name: "Items per page" }));
  await userEvent.click(screen.getByRole("option", { name: String(size) }));
};

describe("DataGrid pagination", () => {
  it("slices the rows to the default page size and shows the range", () => {
    renderGrid({ data: makeRows(25) });

    expect(screen.getByText("row-10")).toBeInTheDocument();
    expect(screen.queryByText("row-11")).not.toBeInTheDocument();
    expect(screen.getByText("1 - 10 of 25 items")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("renders the requested page", () => {
    renderGrid({ data: makeRows(25), pagination: { page: 3, pageSize: 10 } });

    expect(screen.queryByText("row-20")).not.toBeInTheDocument();
    expect(screen.getByText("row-21")).toBeInTheDocument();
    expect(screen.getByText("21 - 25 of 25 items")).toBeInTheDocument();
  });

  it("leaves rows alone when totalItems says they are already one page", () => {
    renderGrid({
      data: makeRows(20),
      pagination: { page: 5, pageSize: 10, totalItems: 250 },
    });

    expect(screen.getByText("row-1")).toBeInTheDocument();
    expect(screen.getByText("row-20")).toBeInTheDocument();
  });

  it("renders every row and no bar when pagination is false", () => {
    renderGrid({ data: makeRows(25), pagination: false });

    expect(screen.getByText("row-25")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("hides the bar on a single page when asked", () => {
    renderGrid({ data: makeRows(3), pagination: { isHiddenOnSinglePage: true } });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("withholds the page-size choice when hasPageSizeSelector is false", () => {
    renderGrid({ data: makeRows(25), pagination: { hasPageSizeSelector: false } });
    expect(screen.queryByRole("combobox", { name: "Items per page" })).toBeNull();
  });

  it("reports a plain page change once, with the current size", async () => {
    const onChange = vi.fn();
    renderGrid({ data: makeRows(100), pagination: { onChange } });

    await userEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    expect(onChange.mock.calls).toEqual([[2, 10]]);
    expect(screen.getByText("row-11")).toBeInTheDocument();
  });

  it("reports a page-size pick once, with the new size", async () => {
    const onChange = vi.fn();
    renderGrid({
      data: makeRows(10),
      pagination: { page: 3, pageSize: 10, totalItems: 100, onChange },
    });

    await pickPageSize(20);

    expect(onChange.mock.calls).toEqual([[1, 20]]);
  });

  it("keeps the picked size on a controlled grid", async () => {
    const Controlled = () => {
      const [page, setPage] = useState(1);
      const [pageSize, setPageSize] = useState(10);
      return (
        <DataGrid<Row>
          idKey="id"
          columns={COLUMNS}
          data={makeRows(25)}
          pagination={{
            page,
            pageSize,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      );
    };
    render(<Controlled />);

    await pickPageSize(20);

    expect(screen.getByText("row-20")).toBeInTheDocument();
    expect(screen.queryByText("row-21")).not.toBeInTheDocument();
  });

  it("still reports the page changes that follow a size pick", async () => {
    const onChange = vi.fn();
    renderGrid({ data: makeRows(100), pagination: { onChange } });

    await pickPageSize(20);
    await userEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    expect(onChange).toHaveBeenLastCalledWith(2, 20);
  });

  it("renders endContent at the end of the bar", () => {
    renderGrid({ data: makeRows(3), pagination: { endContent: <span>extra</span> } });
    expect(screen.getByText("extra")).toBeInTheDocument();
  });
});

describe("DataGrid invalid page", () => {
  const OUT_OF_RANGE = { page: 20, pageSize: 10, totalItems: 177 };

  it("offers a way back when the page is past the last one", async () => {
    const onChange = vi.fn();
    renderGrid({ data: [], pagination: { ...OUT_OF_RANGE, onChange } });

    expect(screen.getByText("Invalid page number")).toBeInTheDocument();
    expect(screen.queryByText("No data to display")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Go to first page" }));
    expect(onChange).toHaveBeenCalledWith(1, 10);
  });

  it.each([
    ["already sliced", { data: makeRows(10), totalItems: 177 }],
    ["client-side", { data: makeRows(25), totalItems: undefined }],
  ])("hides a %s list while the page is below 1", (_label, { data, totalItems }) => {
    renderGrid({ data, pagination: { page: 0, pageSize: 10, totalItems } });

    expect(screen.getByText("Invalid page number")).toBeInTheDocument();
    expect(screen.queryByText("row-1")).not.toBeInTheDocument();
  });

  it.each([
    ["a string", "Custom empty"],
    ["false", false],
  ] as const)("wins over an empty state of %s", (_label, emptyState) => {
    renderGrid({ data: [], emptyState, pagination: OUT_OF_RANGE });

    expect(screen.getByText("Invalid page number")).toBeInTheDocument();
    expect(screen.queryByText("Custom empty")).not.toBeInTheDocument();
  });

  it("treats an empty result as no data, not an invalid page", () => {
    renderGrid({ data: [], pagination: { page: 3, pageSize: 10, totalItems: 0 } });

    expect(screen.getByText("No data to display")).toBeInTheDocument();
    expect(screen.queryByText("Invalid page number")).not.toBeInTheDocument();
  });
});

describe("DataGrid empty state", () => {
  it("renders the catalog default", () => {
    renderGrid({ data: [] });
    expect(screen.getByText("No data to display")).toBeInTheDocument();
  });

  it("wraps a string", () => {
    renderGrid({ data: [], emptyState: "Nothing yet" });
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  });

  it("passes a node through", () => {
    renderGrid({ data: [], emptyState: <div data-testid="custom">custom</div> });
    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.queryByText("No data to display")).not.toBeInTheDocument();
  });

  it("renders nothing for false", () => {
    renderGrid({ data: [], emptyState: false });
    expect(screen.queryByText("No data to display")).not.toBeInTheDocument();
  });
});

describe("DataGrid sorting", () => {
  const SIZE_COLUMNS: DataGridColumn<Row>[] = [
    { key: "name", header: "Name", renderCell: (row) => row.name },
    {
      key: "size",
      header: "Size",
      renderCell: (row) => String(row.size),
      sortKey: "size",
      compare: (a, b) => a.size - b.size,
    },
  ];

  const namesInOrder = (container: HTMLElement) =>
    [...container.querySelectorAll("tbody tr")].map(
      (row) => row.querySelector("td")?.textContent,
    );

  it("sorts on the client by the column's compare, descending reversed", () => {
    const { container } = renderGrid({
      data: makeRows(3),
      columns: SIZE_COLUMNS,
      defaultSort: { sortKey: "size", direction: "descending" },
    });
    expect(namesInOrder(container)).toEqual(["row-3", "row-2", "row-1"]);
  });

  it("changes the uncontrolled sort from the header and reports it", async () => {
    const onSortChange = vi.fn();
    const { container } = renderGrid({
      data: makeRows(3),
      columns: SIZE_COLUMNS,
      defaultSort: { sortKey: "size", direction: "descending" },
      onSortChange,
    });

    await userEvent.click(screen.getByText("Size"));

    expect(onSortChange).toHaveBeenCalledTimes(1);
    const next = onSortChange.mock.calls[0]?.[0];
    expect(next === null || next.sortKey === "size").toBe(true);
    if (next?.direction === "ascending") {
      expect(namesInOrder(container)).toEqual(["row-1", "row-2", "row-3"]);
    }
  });

  it("only reports a controlled sort, leaving rows without compare as given", async () => {
    const onSortChange = vi.fn();
    const { container } = renderGrid({
      data: makeRows(3),
      columns: [
        { key: "name", header: "Name", renderCell: (row) => row.name },
        {
          key: "size",
          header: "Size",
          renderCell: (row) => String(row.size),
          sortKey: "bytes",
        },
      ],
      sort: null,
      onSortChange,
    });

    await userEvent.click(screen.getByText("Size"));

    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange.mock.calls[0]?.[0]?.sortKey).toBe("bytes");
    expect(namesInOrder(container)).toEqual(["row-1", "row-2", "row-3"]);
  });
});

describe("DataGrid selection", () => {
  it("reports selected keys and items; select-all covers the page", async () => {
    const onChange = vi.fn();
    renderGrid({
      data: makeRows(3),
      selection: { selectedKeys: [], onChange, getRowLabel: (row) => row.name },
    });

    await userEvent.click(screen.getByRole("checkbox", { name: "Select row-2" }));
    expect(onChange).toHaveBeenLastCalledWith(
      ["2"],
      [expect.objectContaining({ id: "2" })],
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(onChange.mock.lastCall?.[0]).toEqual(["1", "2", "3"]);
  });

  it("disables rows getIsItemEnabled rejects", () => {
    renderGrid({
      data: makeRows(2),
      selection: {
        selectedKeys: [],
        getRowLabel: (row) => row.name,
        getIsItemEnabled: (row) => row.id !== "1",
      },
    });
    expect(screen.getByRole("checkbox", { name: "Select row-1" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Select row-2" })).toBeEnabled();
  });

  it("keeps keys from other pages on select-all only with isPreservingOtherPages", async () => {
    const onChange = vi.fn();
    renderGrid({
      data: makeRows(2),
      selection: {
        selectedKeys: ["elsewhere"],
        onChange,
        getRowLabel: (row) => row.name,
        isPreservingOtherPages: true,
      },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(onChange.mock.lastCall?.[0]).toEqual(["elsewhere", "1", "2"]);
  });
});

describe("DataGrid expansion", () => {
  const expansion = {
    renderExpandedRow: (row: Row) => <span>detail for {row.name}</span>,
  };
  const headerWidth = (container: HTMLElement, index: number) =>
    container.querySelectorAll<HTMLTableCellElement>("thead th")[index]?.style.width;

  it("toggles a detail row under the row", async () => {
    renderGrid({ data: makeRows(1), expansion });

    expect(screen.queryByText("detail for row-1")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Expand row" }));
    expect(screen.getByText("detail for row-1")).toBeInTheDocument();
  });

  it("sizes the button column 56px first, 40px behind a selection column", () => {
    const first = renderGrid({ data: makeRows(1), expansion });
    expect(headerWidth(first.container, 0)).toBe("56px");
    first.unmount();

    const behind = renderGrid({
      data: makeRows(1),
      expansion,
      selection: { selectedKeys: [] },
    });
    expect(headerWidth(behind.container, 1)).toBe("40px");
  });

  it("honours columnWidth", () => {
    const { container } = renderGrid({
      data: makeRows(1),
      expansion: { ...expansion, columnWidth: 72 },
    });
    expect(headerWidth(container, 0)).toBe("72px");
  });
});

describe("DataGrid scrolling", () => {
  const WIDTH_COLUMNS: DataGridColumn<Row>[] = [
    { key: "name", header: "Name", renderCell: (row) => row.name, width: 120 },
    { key: "size", header: "Size", renderCell: (row) => String(row.size) },
  ];

  it.each([
    ["max-content", "max-content"],
    [800, "800px"],
  ] as const)("maps scrollWidth=%s onto the custom property", (value, expected) => {
    const { container } = renderGrid({ data: makeRows(1), scrollWidth: value });
    const body = bodyOf(container);
    expect(body).toHaveClass("uic-data-grid__body--scroll-x");
    expect(body.style.getPropertyValue("--uic-data-grid-scroll-width")).toBe(expected);
  });

  it("releases max-width on width-less columns only", () => {
    const { container } = renderGrid({
      data: makeRows(1),
      columns: WIDTH_COLUMNS,
      scrollWidth: "max-content",
    });
    const [nameCell, sizeCell] =
      container.querySelectorAll<HTMLTableCellElement>("tbody td");
    expect(nameCell?.style.maxWidth).toBe("");
    expect(sizeCell?.style.maxWidth).toBe("none");
  });

  it("maps maxHeight and lifts a pinned header above the sticky ones", () => {
    const { container } = renderGrid({
      data: makeRows(1),
      columns: [{ ...WIDTH_COLUMNS[0]!, pin: "start" }, WIDTH_COLUMNS[1]!],
      maxHeight: 500,
    });
    const body = bodyOf(container);
    expect(body).toHaveClass("uic-data-grid__body--scroll-y");
    expect(body.style.getPropertyValue("--uic-data-grid-max-height")).toBe("500px");
    const [pinned, plain] =
      container.querySelectorAll<HTMLTableCellElement>("thead th");
    expect(pinned?.style.zIndex).toBe("3");
    expect(plain?.style.zIndex).toBe("");
  });

  it("stays off without scrollWidth or maxHeight", () => {
    const { container } = renderGrid({ data: makeRows(1) });
    const body = bodyOf(container);
    expect(body).not.toHaveClass("uic-data-grid__body--scroll-x");
    expect(body).not.toHaveClass("uic-data-grid__body--scroll-y");
  });
});

describe("DataGrid chrome", () => {
  it("dims and marks busy while loading", () => {
    const { container } = renderGrid({ data: makeRows(1), isLoading: true });
    const body = bodyOf(container);
    expect(body).toHaveAttribute("aria-busy", "true");
    expect(body).toHaveClass("uic-data-grid__body--loading");
  });

  it("hides the header row with isHeaderHidden", () => {
    const { container } = renderGrid({ data: makeRows(1), isHeaderHidden: true });
    expect(bodyOf(container)).toHaveClass("uic-data-grid__body--no-header");
  });

  it("splits header cells unless dividers is grid", () => {
    const rows = renderGrid({ data: makeRows(1) });
    expect(bodyOf(rows.container)).toHaveClass("uic-data-grid__body--header-split");
    rows.unmount();
    const grid = renderGrid({ data: makeRows(1), dividers: "grid" });
    expect(bodyOf(grid.container)).not.toHaveClass("uic-data-grid__body--header-split");
  });

  it("passes the row's page index to renderCell and getRowProps", () => {
    const getRowProps = vi.fn(() => ({ title: "row" }));
    renderGrid({
      data: makeRows(12),
      pagination: { page: 2, pageSize: 10 },
      columns: [
        {
          key: "name",
          header: "Name",
          renderCell: (row, index) => `${row.name}@${index}`,
        },
      ],
      getRowProps,
    });
    expect(screen.getByText("row-12@1")).toBeInTheDocument();
    expect(getRowProps).toHaveBeenCalledWith(expect.objectContaining({ id: "12" }), 1);
  });

  it("applies a column's getCellProps to its body cells", () => {
    const { container } = renderGrid({
      data: makeRows(1),
      columns: [
        {
          key: "name",
          header: "Name",
          renderCell: (row) => row.name,
          getCellProps: () => ({ className: "marked", style: { color: "inherit" } }),
        },
      ],
    });
    expect(container.querySelector("tbody td")).toHaveClass("marked");
  });

  it("falls back from idKey to key, id and position", () => {
    const { container } = render(
      <DataGrid
        columns={[{ key: "label", header: "Label" }]}
        idKey="missing"
        data={[{ label: "a", key: "k1" }, { label: "b", id: "i2" }, { label: "c" }]}
      />,
    );
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(screen.getByText("c")).toBeInTheDocument();
  });

  it("renders a group caption above the header", () => {
    renderGrid({
      data: makeRows(1),
      columns: [{ ...COLUMNS[0]!, groupHeader: "Identity" }],
    });
    const header = screen.getAllByRole("columnheader")[0]!;
    expect(within(header).getByText("Identity")).toBeInTheDocument();
    expect(within(header).getByText("Name")).toBeInTheDocument();
  });
});

describe("DataGrid column settings", () => {
  const THREE: DataGridColumn<Row>[] = [
    {
      key: "name",
      header: "Name",
      renderCell: (row) => row.name,
      isAlwaysVisible: true,
    },
    { key: "size", header: "Size", renderCell: (row) => String(row.size) },
    { key: "extra", header: "Extra", renderCell: () => "x", isHiddenByDefault: true },
  ];
  const headers = () => screen.getAllByRole("columnheader").map((th) => th.textContent);

  it("applies visibility and order from the overrides record", () => {
    renderGrid({
      data: makeRows(1),
      columns: THREE,
      columnSettings: {
        overrides: {
          size: { order: 0 },
          name: { order: 1 },
          extra: { hidden: false, order: 2 },
        },
      },
    });
    expect(headers()).toEqual(["Size", "Name", "Extra"]);
  });

  it("writes the dialog's result back as overrides, keeping widths", async () => {
    const onOverridesChange = vi.fn();
    renderGrid({
      data: makeRows(1),
      columns: THREE,
      columnSettings: {
        defaultOverrides: { size: { width: 140 } },
        onOverridesChange,
      },
    });
    expect(headers()).toEqual(["Name", "Size"]);

    await userEvent.click(screen.getByRole("button", { name: "Table Settings" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Extra" }));
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Size" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply" }));

    expect(onOverridesChange).toHaveBeenLastCalledWith({
      size: { hidden: true, width: 140 },
      extra: { hidden: false },
    });
    expect(headers()).toEqual(["Name", "Extra"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("DataGrid CSV export", () => {
  it("opens the export dialog with its notice and closes after the export", async () => {
    const onExport = vi.fn(async () => {});
    renderGrid({
      data: makeRows(1),
      columns: [{ ...COLUMNS[0]!, exportKeys: ["name"] }],
      csvExport: {
        supportedKeys: ["name"],
        onExport,
        notice: "Only the first 1000 rows.",
      },
    });

    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByTestId("uic-data-grid-export-notice")).toHaveTextContent(
      "Only the first 1000 rows.",
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Export" }));

    expect(onExport).toHaveBeenCalledWith(["name"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("DataGrid strings", () => {
  it("translates its chrome through the Astryx provider", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <DataGrid<Row> idKey="id" columns={COLUMNS} data={[]} />
      </InternationalizationProvider>,
    );
    expect(screen.getByText("표시할 데이터가 없습니다")).toBeInTheDocument();
  });

  it("lets string props win over the catalog", () => {
    renderGrid({
      data: makeRows(1),
      columnSettings: {},
      settingsLabel: "Columns",
      renderRange: ({ total }) => `${total} total`,
    });
    expect(screen.getByRole("button", { name: "Columns" })).toBeInTheDocument();
    expect(screen.getByText("1 total")).toBeInTheDocument();
  });
});
