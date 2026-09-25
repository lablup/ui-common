import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { DividedRow } from "./DividedRow";

const dividers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".uic-divided-row__divider"));

describe("DividedRow", () => {
  it("wraps each child and hides the divider after the last one", () => {
    const { container } = render(
      <DividedRow>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </DividedRow>,
    );
    const items = container.querySelectorAll(".uic-divided-row__item");
    expect(items).toHaveLength(3);
    expect(dividers(container).map((d) => d.style.visibility)).toEqual([
      "visible",
      "visible",
      "hidden",
    ]);
    for (const divider of dividers(container)) {
      expect(divider).toHaveAttribute("aria-hidden");
    }
  });

  it("hides the divider after an item that ends a line", () => {
    const tops = [0, 0, 40];
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetTop",
    );
    Object.defineProperty(HTMLElement.prototype, "offsetTop", {
      configurable: true,
      get(this: HTMLElement) {
        const items = Array.from(
          this.parentElement?.querySelectorAll(":scope > .uic-divided-row__item") ?? [],
        );
        return tops[items.indexOf(this)] ?? 0;
      },
    });
    try {
      const { container } = render(
        <DividedRow>
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </DividedRow>,
      );
      expect(dividers(container).map((d) => d.style.visibility)).toEqual([
        "visible",
        "hidden",
        "hidden",
      ]);
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, "offsetTop", original);
    }
  });

  it("skips empty children", () => {
    const { container } = render(
      <DividedRow>
        <span>A</span>
        {null}
        {false}
        <span>B</span>
      </DividedRow>,
    );
    expect(container.querySelectorAll(".uic-divided-row__item")).toHaveLength(2);
  });

  it("defaults its gaps to spacing tokens and exposes the column gap", () => {
    const { container } = render(
      <DividedRow>
        <span>A</span>
      </DividedRow>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.style.rowGap).toBe("var(--spacing-8)");
    expect(row.style.columnGap).toBe("var(--spacing-12)");
    expect(row.style.getPropertyValue("--uic-divided-row-column-gap")).toBe(
      "var(--spacing-12)",
    );
    expect(row.style.flexWrap).toBe("wrap");
  });

  it("takes gaps in pixels, divider geometry and pass-through styles", () => {
    const { container } = render(
      <DividedRow
        wrap="nowrap"
        rowGap={8}
        columnGap={24}
        dividerWidth={2}
        dividerColor="red"
        dividerInset={4}
        itemStyle={{ flex: 1 }}
        className="extra"
        style={{ paddingBlock: 16 }}
      >
        <span>A</span>
        <span>B</span>
      </DividedRow>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row).toHaveClass("uic-divided-row", "extra");
    expect(row.style.flexWrap).toBe("nowrap");
    expect(row.style.rowGap).toBe("8px");
    expect(row.style.columnGap).toBe("24px");
    expect(row.style.paddingBlock).toBe("16px");
    const [first] = dividers(container);
    expect(first!.style.width).toBe("2px");
    expect(first!.style.top).toBe("4px");
    expect(first!.style.bottom).toBe("4px");
    expect(first!.style.background).toBe("red");
    const item = container.querySelector<HTMLElement>(".uic-divided-row__item");
    expect(item!.style.flex).toMatch(/^1/);
  });
});
