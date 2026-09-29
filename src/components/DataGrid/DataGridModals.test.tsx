import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { DataGridExportModal } from "./DataGridExportModal";
import { DataGridSettingsModal } from "./DataGridSettingsModal";

const SETTINGS_COLUMNS = [
  { key: "name", label: "Name", isAlwaysVisible: true },
  { key: "size", label: "Size" },
  { key: "owner", label: "Owner" },
];

const renderSettings = (
  props: Partial<Parameters<typeof DataGridSettingsModal>[0]> = {},
) => {
  const onApply = vi.fn();
  const onOpenChange = vi.fn();
  const result = render(
    <DataGridSettingsModal
      isOpen
      onOpenChange={onOpenChange}
      columns={SETTINGS_COLUMNS}
      visibleColumnKeys={["name", "owner"]}
      onApply={onApply}
      {...props}
    />,
  );
  return { ...result, onApply, onOpenChange };
};

const handles = (dialog: HTMLElement) =>
  dialog.querySelectorAll(".uic-data-grid-dialog__handle");

describe("DataGridSettingsModal", () => {
  it("lists visible columns first, in display order, then the rest", () => {
    renderSettings();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Table Settings");
    const labels = within(dialog)
      .getAllByRole("checkbox")
      .map((box) => (box as HTMLInputElement).labels?.[0]?.textContent ?? "");
    expect(labels).toEqual(["Name", "Owner", "Size"]);
  });

  it("locks always-visible columns checked", () => {
    renderSettings();
    const name = screen.getByRole("checkbox", { name: "Name" });
    expect(name).toBeChecked();
    expect(name).toBeDisabled();
  });

  it("applies the checked keys, always-visible included, and the order", async () => {
    const { onApply, onOpenChange } = renderSettings({ visibleColumnKeys: ["owner"] });

    await userEvent.click(screen.getByRole("checkbox", { name: "Size" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApply).toHaveBeenCalledWith({
      selectedColumnKeys: ["owner", "size", "name"],
      columnOrder: ["owner", "name", "size"],
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("cancels through onOpenChange without applying", async () => {
    const { onApply, onOpenChange } = renderSettings();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("filters by search and turns dragging off while searching", async () => {
    renderSettings();
    const dialog = screen.getByRole("dialog");
    expect(handles(dialog)).toHaveLength(3);

    await userEvent.type(
      screen.getByRole("textbox", { name: "Search table columns" }),
      "siz",
    );

    expect(within(dialog).getAllByRole("checkbox")).toHaveLength(1);
    expect(handles(dialog)).toHaveLength(0);

    await userEvent.clear(
      screen.getByRole("textbox", { name: "Search table columns" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search table columns" }),
      "zzz",
    );
    expect(within(dialog).queryAllByRole("checkbox")).toHaveLength(0);
    expect(dialog.querySelector(".uic-data-grid-dialog__list")).toHaveTextContent(
      "Search table columns",
    );
  });

  it("renders no drag handles when not reorderable", () => {
    renderSettings({ isReorderable: false });
    expect(handles(screen.getByRole("dialog"))).toHaveLength(0);
  });

  it("starts fresh on every open", async () => {
    const { rerender, onApply, onOpenChange } = renderSettings();
    await userEvent.click(screen.getByRole("checkbox", { name: "Size" }));

    const props = {
      onOpenChange,
      onApply,
      columns: SETTINGS_COLUMNS,
      visibleColumnKeys: ["name", "owner"],
    };
    rerender(<DataGridSettingsModal {...props} isOpen={false} />);
    rerender(<DataGridSettingsModal {...props} isOpen />);

    expect(screen.getByRole("checkbox", { name: "Size" })).not.toBeChecked();
  });

  it("translates its strings", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <DataGridSettingsModal
          isOpen
          onOpenChange={() => {}}
          columns={SETTINGS_COLUMNS}
          visibleColumnKeys={["name"]}
          onApply={() => {}}
        />
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName("표 설정");
    expect(screen.getByRole("button", { name: "적용" })).toBeInTheDocument();
  });
});

const EXPORT_COLUMNS = [
  { key: "name", label: "Name", exportKeys: ["name"] },
  { key: "created", label: "Created", exportKeys: ["created_at"] },
  { key: "createdAgo", label: "Created (relative)", exportKeys: ["created_at"] },
  { key: "secret", label: "Secret", exportKeys: ["secret"] },
  { key: "actions", label: "Actions", exportKeys: [] },
];

const renderExport = (
  props: Partial<Parameters<typeof DataGridExportModal>[0]> = {},
) => {
  const onExport = vi.fn(async () => {});
  const onOpenChange = vi.fn();
  const result = render(
    <DataGridExportModal
      isOpen
      onOpenChange={onOpenChange}
      columns={EXPORT_COLUMNS}
      supportedKeys={["name", "created_at"]}
      onExport={onExport}
      {...props}
    />,
  );
  return { ...result, onExport, onOpenChange };
};

describe("DataGridExportModal", () => {
  it("checks every exportable column and disables the rest", () => {
    renderExport();
    expect(screen.getByRole("checkbox", { name: "Name" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Secret" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Secret" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Actions" })).toBeDisabled();
  });

  it("toggles columns that export the same keys together", async () => {
    renderExport();
    await userEvent.click(screen.getByRole("checkbox", { name: "Created (relative)" }));
    expect(screen.getByRole("checkbox", { name: "Created" })).not.toBeChecked();
  });

  it("exports each chosen key once and leaves closing to the caller", async () => {
    const { onExport, onOpenChange } = renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(onExport).toHaveBeenCalledWith(["name", "created_at"]);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("shows a notice only when one is given", () => {
    const { unmount } = renderExport({ notice: "Only the first 1000 rows." });
    expect(screen.getByTestId("uic-data-grid-export-notice")).toHaveTextContent(
      "Only the first 1000 rows.",
    );
    unmount();
    renderExport();
    expect(screen.queryByTestId("uic-data-grid-export-notice")).toBeNull();
  });

  it("filters by search", async () => {
    renderExport();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search table columns" }),
      "creat",
    );
    expect(within(screen.getByRole("dialog")).getAllByRole("checkbox")).toHaveLength(2);
  });

  it("cancels through onOpenChange", async () => {
    const { onExport, onOpenChange } = renderExport();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onExport).not.toHaveBeenCalled();
  });
});
