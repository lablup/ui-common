import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import type { DataGridColumn } from "../DataGrid/DataGrid";
import { BulkErrorModal } from "./BulkErrorModal";

interface Failure {
  key: string;
  target: string;
  reason: string;
}

const FAILURES: Failure[] = [
  { key: "row-1", target: "project-alpha", reason: "Permission denied" },
  { key: "row-2", target: "project-beta", reason: "Not found" },
];

const COLUMNS: DataGridColumn<Failure>[] = [
  { key: "target", header: "Target", renderCell: (row) => row.target },
  { key: "reason", header: "Error Message", renderCell: (row) => row.reason },
];

const manyFailures = (count: number): Failure[] =>
  Array.from({ length: count }, (_unused, index) => ({
    key: `row-${index}`,
    target: `target-${index}`,
    reason: "Failed",
  }));

describe("BulkErrorModal", () => {
  it("renders one row per failure with the caller's columns", () => {
    render(
      <BulkErrorModal
        isOpen
        onOpenChange={() => {}}
        columns={COLUMNS}
        data={FAILURES}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Target" })).toBeInTheDocument();
    expect(screen.getByText("project-alpha")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  it("titles itself with the catalog default and has no footer", () => {
    render(
      <BulkErrorModal
        isOpen
        onOpenChange={() => {}}
        columns={COLUMNS}
        data={FAILURES}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Action execution failed");
    expect(screen.queryByRole("button", { name: "OK" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(document.querySelector(".uic-bulk-error-modal__icon")).not.toBeNull();
  });

  it("shows the description in an error banner, titled by the catalog", () => {
    render(
      <BulkErrorModal
        isOpen
        onOpenChange={() => {}}
        title="2 changes failed"
        description="Fix the failed items and retry."
        columns={COLUMNS}
        data={FAILURES}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName("2 changes failed");
    expect(screen.getByText("Error Occurred")).toBeInTheDocument();
    expect(screen.getByText("Fix the failed items and retry.")).toBeInTheDocument();
  });

  it("renders no banner without a description", () => {
    render(
      <BulkErrorModal
        isOpen
        onOpenChange={() => {}}
        columns={COLUMNS}
        data={FAILURES}
      />,
    );
    expect(screen.queryByText("Error Occurred")).toBeNull();
  });

  it("hides the page bar on one page and pages at ten rows", () => {
    const { unmount } = render(
      <BulkErrorModal
        isOpen
        onOpenChange={() => {}}
        columns={COLUMNS}
        data={FAILURES}
      />,
    );
    expect(screen.queryByRole("navigation")).toBeNull();
    unmount();

    render(
      <BulkErrorModal
        isOpen
        onOpenChange={() => {}}
        columns={COLUMNS}
        data={manyFailures(12)}
      />,
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("target-9")).toBeInTheDocument();
    expect(screen.queryByText("target-10")).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Items per page" })).toBeNull();
  });

  it("closes through the header's close button", async () => {
    const onOpenChange = vi.fn();
    render(
      <BulkErrorModal
        isOpen
        onOpenChange={onOpenChange}
        columns={COLUMNS}
        data={FAILURES}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("translates its strings", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <BulkErrorModal
          isOpen
          onOpenChange={() => {}}
          description="retry"
          columns={COLUMNS}
          data={FAILURES}
        />
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName("실행 오류");
    expect(screen.getByText("문제가 발생했습니다.")).toBeInTheDocument();
  });
});
