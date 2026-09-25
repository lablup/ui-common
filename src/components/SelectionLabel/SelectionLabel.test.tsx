import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { SelectionLabel } from "./SelectionLabel";

describe("SelectionLabel", () => {
  it("renders nothing for no selection", () => {
    const { container, rerender } = render(<SelectionLabel count={0} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<SelectionLabel count={-1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says how many items are selected", () => {
    render(<SelectionLabel count={3} />);
    expect(screen.getByText("3 selected")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("clears the selection from a named button", async () => {
    const onClear = vi.fn();
    render(<SelectionLabel count={2} onClear={onClear} />);
    await userEvent.click(screen.getByRole("button", { name: "Deselect all" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("takes explicit strings and a clear glyph over the defaults", () => {
    render(
      <SelectionLabel
        count={2}
        onClear={() => {}}
        label="2 sessions"
        clearLabel="Clear sessions"
        clearIcon={<svg data-testid="glyph" />}
      />,
    );
    expect(screen.getByText("2 sessions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear sessions" })).toContainElement(
      screen.getByTestId("glyph"),
    );
  });

  it("takes its default strings from the shipped translations", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <SelectionLabel count={5} onClear={() => {}} />
      </InternationalizationProvider>,
    );
    expect(screen.getByText("5개 선택됨")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "선택 취소" })).toBeInTheDocument();
  });
});
