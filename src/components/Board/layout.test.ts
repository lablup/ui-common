import { describe, expect, it } from "vitest";

import { moveItem, removeItem, resizeItem } from "./engine";
import {
  interpretItems,
  transformItems,
  type BoardItem,
  type GridLayout,
} from "./layout";

const item = (id: string, props: Partial<BoardItem> = {}): BoardItem => ({
  id,
  data: null,
  ...props,
});

/** A(2x2) B(2x2) C(4x2): two panels side by side over a full-width one. */
const THREE = [
  item("a", { rowSpan: 2, columnSpan: 2 }),
  item("b", { rowSpan: 2, columnSpan: 2 }),
  item("c", { rowSpan: 2, columnSpan: 4 }),
];

const positions = (layout: GridLayout) =>
  layout.items.map(
    ({ id, x, y, width, height }) => `${id}:${x},${y} ${width}x${height}`,
  );

describe("interpretItems", () => {
  it("places items left to right, wrapping a full-width one under them", () => {
    const layout = interpretItems(THREE, 4);
    expect(positions(layout)).toEqual(["a:0,0 2x2", "b:2,0 2x2", "c:0,2 4x2"]);
    expect(layout.rows).toBe(4);
  });

  it("packs into the shortest columns", () => {
    const layout = interpretItems(
      [
        item("a", { rowSpan: 2, columnSpan: 1 }),
        item("b", { rowSpan: 4, columnSpan: 1 }),
        item("c", { rowSpan: 2, columnSpan: 1 }),
        item("d", { rowSpan: 2, columnSpan: 1 }),
      ],
      2,
    );
    expect(positions(layout)).toEqual([
      "a:0,0 1x2",
      "b:1,0 1x4",
      "c:0,2 1x2",
      "d:1,4 1x2",
    ]);
    expect(layout.rows).toBe(6);
  });

  it("honours columnOffset for the column count when it fits, else uses 0", () => {
    const fits = interpretItems(
      [
        THREE[0] as BoardItem,
        item("b", { rowSpan: 2, columnSpan: 2, columnOffset: { 4: 0 } }),
        THREE[2] as BoardItem,
      ],
      4,
    );
    expect(positions(fits)).toEqual(["a:0,0 2x2", "b:0,2 2x2", "c:0,4 4x2"]);

    const overflows = interpretItems(
      [
        THREE[0] as BoardItem,
        item("b", { rowSpan: 2, columnSpan: 2, columnOffset: { 4: 3 } }),
        THREE[2] as BoardItem,
      ],
      4,
    );
    expect(positions(overflows)).toEqual(["a:0,0 2x2", "b:0,2 2x2", "c:0,4 4x2"]);
  });

  it("looks the offset up by column count only", () => {
    const layout = interpretItems(
      [
        THREE[0] as BoardItem,
        item("b", { rowSpan: 2, columnSpan: 2, columnOffset: { 6: 0 } }),
        THREE[2] as BoardItem,
      ],
      4,
    );
    expect(positions(layout)[1]).toBe("b:2,0 2x2");
  });

  it("floors spans at the definition's minimums and the board's", () => {
    const layout = interpretItems(
      [
        item("a", { rowSpan: 1, columnSpan: 1, definition: { minColumnSpan: 2 } }),
        item("b", { definition: { defaultColumnSpan: 3, defaultRowSpan: 3 } }),
        item("c", { columnSpan: 9, rowSpan: 2 }),
      ],
      2,
    );
    expect(positions(layout)).toEqual(["a:0,0 2x2", "b:0,2 2x3", "c:0,5 2x2"]);
  });

  it("sorts the result in reading order", () => {
    const layout = interpretItems(
      [
        item("tall", { rowSpan: 4, columnSpan: 1 }),
        item("b", { rowSpan: 2, columnSpan: 1 }),
        item("c", { rowSpan: 2, columnSpan: 1 }),
      ],
      2,
    );
    expect(layout.items.map((it) => it.id)).toEqual(["tall", "b", "c"]);
    expect(positions(layout)).toEqual(["tall:0,0 1x4", "b:1,0 1x2", "c:1,2 1x2"]);
  });

  it("is empty at zero columns and with no items", () => {
    expect(interpretItems([], 4)).toEqual({ items: [], columns: 4, rows: 0 });
  });
});

describe("transformItems", () => {
  const WITH_OFFSETS = [
    item("a", { rowSpan: 2, columnSpan: 2, columnOffset: { 4: 0, 6: 0 } }),
    item("b", { rowSpan: 2, columnSpan: 2, columnOffset: { 4: 2, 6: 2 } }),
    item("c", { rowSpan: 2, columnSpan: 4, columnOffset: { 4: 0, 6: 4 } }),
  ];

  it("writes [columns]: x for every item and keeps the rest of an unchanged prefix", () => {
    const layout = interpretItems(WITH_OFFSETS, 4);
    const next = transformItems(WITH_OFFSETS, layout);
    expect(next.map((it) => it.id)).toEqual(["a", "b", "c"]);
    expect(next.map((it) => it.columnOffset)).toEqual([
      { 4: 0, 6: 0 },
      { 4: 2, 6: 2 },
      { 4: 0, 6: 4 },
    ]);
    // New objects; the source is untouched.
    expect(next[0]).not.toBe(WITH_OFFSETS[0]);
    expect(WITH_OFFSETS[0]?.columnOffset).toEqual({ 4: 0, 6: 0 });
  });

  it("returns the items in the layout's reading order and invalidates from the first change", () => {
    const swapped: GridLayout = {
      columns: 4,
      rows: 4,
      items: [
        { id: "b", x: 0, y: 0, width: 2, height: 2 },
        { id: "a", x: 2, y: 0, width: 2, height: 2 },
        { id: "c", x: 0, y: 2, width: 4, height: 2 },
      ],
    };
    const next = transformItems(WITH_OFFSETS, swapped);
    expect(next.map((it) => it.id)).toEqual(["b", "a", "c"]);
    expect(next.map((it) => it.columnOffset)).toEqual([{ 4: 0 }, { 4: 2 }, { 4: 0 }]);
  });

  it("keeps offsets before the first changed index only", () => {
    const moved: GridLayout = {
      columns: 4,
      rows: 6,
      items: [
        { id: "a", x: 0, y: 0, width: 2, height: 2 },
        { id: "c", x: 0, y: 2, width: 4, height: 2 },
        { id: "b", x: 2, y: 4, width: 2, height: 2 },
      ],
    };
    const next = transformItems(WITH_OFFSETS, moved);
    expect(next.map((it) => it.id)).toEqual(["a", "c", "b"]);
    expect(next.map((it) => it.columnOffset)).toEqual([
      { 4: 0, 6: 0 },
      { 4: 0 },
      { 4: 2 },
    ]);
  });

  it("writes the resized item's spans and invalidates from it", () => {
    const resized: GridLayout = {
      columns: 4,
      rows: 5,
      items: [
        { id: "a", x: 0, y: 0, width: 2, height: 2 },
        { id: "b", x: 2, y: 0, width: 2, height: 2 },
        { id: "c", x: 0, y: 2, width: 4, height: 3 },
      ],
    };
    const next = transformItems(WITH_OFFSETS, resized, "c");
    expect(next.map((it) => it.columnOffset)).toEqual([
      { 4: 0, 6: 0 },
      { 4: 2, 6: 2 },
      { 4: 0 },
    ]);
    expect(next[2]).toMatchObject({ id: "c", columnSpan: 4, rowSpan: 3 });
    expect(next[0]).toMatchObject({ columnSpan: 2, rowSpan: 2 });
  });

  it("round-trips: a transformed layout interprets back to itself", () => {
    const layout = interpretItems(THREE, 4);
    const next = transformItems(THREE, layout);
    expect(interpretItems(next, 4)).toEqual(layout);
  });
});

describe("engine", () => {
  const base = interpretItems(THREE, 4);

  it("swaps a neighbour into the vacated space when it fits", () => {
    expect(positions(moveItem(base, "a", 2, 0))).toEqual([
      "b:0,0 2x2",
      "a:2,0 2x2",
      "c:0,2 4x2",
    ]);
  });

  it("pushes down what the active item covers and floats the rest up", () => {
    // A over C: C cannot take A's old place (B is beside it), so it drops.
    expect(positions(moveItem(base, "a", 0, 2))).toEqual([
      "b:2,0 2x2",
      "a:0,2 2x2",
      "c:0,4 4x2",
    ]);
  });

  it("cascades: a pushed item pushes what it lands on", () => {
    // A grown to the full width covers B; B drops onto C, C drops further.
    const layout = resizeItem(base, "a", 4, 2);
    expect(positions(layout)).toEqual(["a:0,0 4x2", "b:2,2 2x2", "c:0,4 4x2"]);
    expect(layout.rows).toBe(6);
  });

  it("leaves the active item where it was put, even over a gap", () => {
    const layout = moveItem(base, "b", 2, 4);
    expect(positions(layout)).toEqual(["a:0,0 2x2", "c:0,2 4x2", "b:2,4 2x2"]);
  });

  it("floats the rest up into a removed item's place", () => {
    expect(positions(removeItem(base, "c"))).toEqual(["a:0,0 2x2", "b:2,0 2x2"]);
    const tall = interpretItems(
      [
        item("a", { rowSpan: 2, columnSpan: 4 }),
        item("b", { rowSpan: 2, columnSpan: 4 }),
        item("c", { rowSpan: 2, columnSpan: 4 }),
      ],
      4,
    );
    expect(positions(removeItem(tall, "a"))).toEqual(["b:0,0 4x2", "c:0,2 4x2"]);
  });

  it("does not mutate the layout it was given", () => {
    moveItem(base, "a", 2, 0);
    expect(positions(base)).toEqual(["a:0,0 2x2", "b:2,0 2x2", "c:0,2 4x2"]);
  });
});
