import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { UnitGridSkeleton } from "./UnitGridSkeleton";

const rowsOf = (container: HTMLElement) =>
  container.querySelectorAll(".uic-unit-grid-skeleton__row");

describe("UnitGridSkeleton", () => {
  it("renders 3 lattice rows by default, two blocks each", () => {
    const { container } = render(<UnitGridSkeleton />);
    const rows = rowsOf(container);
    expect(rows).toHaveLength(3);
    rows.forEach((row) => {
      expect(row.children).toHaveLength(2);
    });
  });

  it("renders `rows` rows", () => {
    const { container } = render(<UnitGridSkeleton rows={5} />);
    expect(rowsOf(container)).toHaveLength(5);
  });

  it("renders no lattice rows for rows=0", () => {
    const { container } = render(<UnitGridSkeleton rows={0} />);
    expect(rowsOf(container)).toHaveLength(0);
  });

  it("spreads className and other DOM props onto the root", () => {
    const { container } = render(
      <UnitGridSkeleton className="custom-class" data-testid="grid-skeleton" />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass("uic-unit-grid-skeleton", "custom-class");
    expect(root).toHaveAttribute("data-testid", "grid-skeleton");
  });
});
