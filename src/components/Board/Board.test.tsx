import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import { Board, columnsForWidth, type BoardItemsChangeDetail } from "./Board";
import type { BoardItem } from "./layout";

/** jsdom has no layout: report the width a test chose, as soon as observed. */
let containerWidth = 1000;
class FakeResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, contentRect: { width: containerWidth } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  containerWidth = 1000;
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});
afterEach(() => vi.unstubAllGlobals());

type Data = { title: string };

const THREE: BoardItem<Data>[] = [
  { id: "a", rowSpan: 2, columnSpan: 2, data: { title: "Alpha" } },
  { id: "b", rowSpan: 2, columnSpan: 2, data: { title: "Beta" } },
  { id: "c", rowSpan: 2, columnSpan: 4, data: { title: "Gamma" } },
];

function renderBoard(props: Partial<ComponentProps<typeof Board<Data>>> = {}) {
  const onItemsChange = vi.fn<(detail: BoardItemsChangeDetail<Data>) => void>();
  const view = render(
    <Board<Data>
      items={THREE}
      renderItem={(item, { removeItem }) => (
        <div>
          <h5>{item.data.title}</h5>
          <button type="button" onClick={removeItem}>
            Remove {item.data.title}
          </button>
        </div>
      )}
      onItemsChange={onItemsChange}
      {...props}
    />,
  );
  return { ...view, onItemsChange };
}

const shell = (title: string) =>
  screen
    .getByRole("heading", { name: title })
    .closest(".uic-board-item") as HTMLElement;

const placement = (title: string) => {
  const el = shell(title);
  return `${el.style.gridColumn} | ${el.style.gridRow}`;
};

const liveText = () =>
  [...document.querySelectorAll("[aria-live]")].map((r) => r.textContent).join("");

describe("Board", () => {
  it("maps the container width to Cloudscape's column counts", () => {
    const bps = [
      { minWidth: 0, columns: 1 },
      { minWidth: 688, columns: 2 },
      { minWidth: 912, columns: 4 },
      { minWidth: 2100, columns: 6 },
    ];
    expect(columnsForWidth(600, bps)).toBe(1);
    expect(columnsForWidth(688, bps)).toBe(2);
    expect(columnsForWidth(911, bps)).toBe(2);
    expect(columnsForWidth(912, bps)).toBe(4);
    expect(columnsForWidth(2100, bps)).toBe(6);
    expect(columnsForWidth(100, [{ minWidth: 300, columns: 2 }])).toBe(0);
  });

  it("lays the items out on the grid for the measured width", () => {
    const { container } = renderBoard();
    const grid = container.querySelector(".uic-board__grid") as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
    expect(placement("Alpha")).toBe("1 / span 2 | 1 / span 2");
    expect(placement("Beta")).toBe("3 / span 2 | 1 / span 2");
    expect(placement("Gamma")).toBe("1 / span 4 | 3 / span 2");
    // Reading order in the DOM, as in the layout.
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("renders a persisted layout from its column offsets", () => {
    renderBoard({
      items: [
        {
          id: "a",
          rowSpan: 3,
          columnSpan: 1,
          columnOffset: { 4: 0 },
          data: { title: "Alpha" },
        },
        {
          id: "b",
          rowSpan: 3,
          columnSpan: 1,
          columnOffset: { 4: 1 },
          data: { title: "Beta" },
        },
        {
          id: "c",
          rowSpan: 3,
          columnSpan: 1,
          columnOffset: { 4: 3 },
          data: { title: "Gamma" },
        },
        {
          id: "d",
          rowSpan: 2,
          columnSpan: 2,
          columnOffset: { 4: 1 },
          data: { title: "Delta" },
        },
      ],
    });
    expect(placement("Alpha")).toBe("1 / span 1 | 1 / span 3");
    expect(placement("Beta")).toBe("2 / span 1 | 1 / span 3");
    expect(placement("Gamma")).toBe("4 / span 1 | 1 / span 3");
    expect(placement("Delta")).toBe("2 / span 2 | 4 / span 2");
  });

  it("stacks everything on one column when narrow", () => {
    containerWidth = 500;
    const { container } = renderBoard();
    const grid = container.querySelector(".uic-board__grid") as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(1, minmax(0, 1fr))");
    expect(placement("Alpha")).toBe("1 / span 1 | 1 / span 2");
    expect(placement("Beta")).toBe("1 / span 1 | 3 / span 2");
    expect(placement("Gamma")).toBe("1 / span 1 | 5 / span 2");
  });

  it("renders no grid until the width is known", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const { container } = renderBoard();
    expect(container.querySelector(".uic-board")).toBeInTheDocument();
    expect(container.querySelector(".uic-board__grid")).not.toBeInTheDocument();
  });

  it("renders emptyContent in place of the grid when there are no items", () => {
    const { container } = renderBoard({ items: [], emptyContent: <p>Nothing here</p> });
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(container.querySelector(".uic-board__grid")).not.toBeInTheDocument();
  });

  it("renders handles only when movable or resizable", () => {
    const { rerender } = renderBoard();
    expect(
      screen.queryByRole("button", { name: "Drag handle" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Resize handle" }),
    ).not.toBeInTheDocument();

    rerender(
      <Board<Data>
        items={THREE}
        isMovable
        renderItem={(item) => <h5>{item.data.title}</h5>}
        onItemsChange={() => {}}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Drag handle" })).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: "Resize handle" }),
    ).not.toBeInTheDocument();

    rerender(
      <Board<Data>
        items={THREE}
        isResizable
        dragHandleLabel="Move"
        resizeHandleLabel="Grow"
        renderItem={(item) => <h5>{item.data.title}</h5>}
        onItemsChange={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Move" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Grow" })).toHaveLength(3);
  });

  it("draws the border variant and the item class on each surface", () => {
    renderBoard({
      variant: "bordered",
      itemClassName: (item) => (item.id === "a" ? "first" : undefined),
    });
    expect(shell("Alpha")).toHaveClass("uic-board-item--bordered", "first");
    expect(shell("Beta")).toHaveClass("uic-board-item--bordered");
    expect(shell("Beta")).not.toHaveClass("first");
  });

  it("passes other div attributes to the root", () => {
    const { container } = render(
      <Board
        items={[]}
        renderItem={() => null}
        onItemsChange={() => {}}
        className="extra"
        data-testid="board"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("uic-board", "extra");
    expect(root).toHaveAttribute("data-testid", "board");
  });

  const dragHandleOf = (title: string) =>
    within(shell(title)).getByRole("button", { name: "Drag handle" });
  const resizeHandleOf = (title: string) =>
    within(shell(title)).getByRole("button", { name: "Resize handle" });
  const directionButtons = (title: string) =>
    [...shell(title).querySelectorAll(".uic-board__direction")].map((el) =>
      el.getAttribute("data-direction"),
    );
  /** The tinted placeholder cells, as "column,row" from 1. */
  const hoveredCells = () =>
    [...document.querySelectorAll<HTMLElement>(".uic-board__placeholder--hover")].map(
      (el) => `${el.style.gridColumn.split(" ")[0]},${el.style.gridRow.split(" ")[0]}`,
    );

  describe("keyboard move", () => {
    it("activates on Enter: direction buttons appear and arrows step one cell", async () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      dragHandleOf("Beta").focus();
      // Arrows do nothing until the handle is activated.
      await userEvent.keyboard("{ArrowLeft}");
      expect(liveText()).toBe("");
      expect(directionButtons("Beta")).toEqual([]);

      await userEvent.keyboard("{Enter}");
      expect(liveText()).toBe("Dragging.");
      expect(shell("Beta")).toHaveClass("uic-board-item--active");
      expect(directionButtons("Beta")).toEqual(["up", "down", "left", "right"]);

      // Half over Alpha, against the direction of the move: a conflict, so
      // Alpha stays put and the step cannot commit yet.
      await userEvent.keyboard("{ArrowLeft}");
      expect(liveText()).toBe("Item moved to column 2, row 1.");
      expect(document.querySelectorAll(".uic-board__placeholder--hover")).toHaveLength(
        4,
      );
      expect(shell("Alpha").style.transform).toBe("");

      // Fully over Alpha: the two swap.
      await userEvent.keyboard("{ArrowLeft}");
      expect(liveText()).toBe("Item moved to column 1, row 1.");
      expect(shell("Alpha").style.transform).not.toBe("");

      await userEvent.keyboard("{Enter}");
      expect(liveText()).toBe("Move committed.");
      expect(onItemsChange).toHaveBeenCalledTimes(1);
      const detail = onItemsChange.mock.calls[0]?.[0] as BoardItemsChangeDetail<Data>;
      expect(detail.items.map((it) => it.id)).toEqual(["b", "a", "c"]);
      expect(detail.items.map((it) => it.columnOffset)).toEqual([
        { 4: 0 },
        { 4: 2 },
        { 4: 0 },
      ]);
      expect(detail.movedItem?.id).toBe("b");
      expect(detail.resizedItem).toBeUndefined();
      expect(detail.items[0]?.data).toBe(THREE[1]?.data);
      expect(shell("Beta")).not.toHaveClass("uic-board-item--active");
      expect(directionButtons("Beta")).toEqual([]);
    });

    it("slides items only while an operation is on, and keeps the handle focused after a commit", async () => {
      renderBoard({ isMovable: true });
      const handle = dragHandleOf("Beta");
      handle.focus();
      expect(shell("Alpha")).not.toHaveClass("uic-board-item--sliding");
      await userEvent.keyboard("{Enter}");
      expect(shell("Alpha")).toHaveClass("uic-board-item--sliding");
      expect(shell("Beta")).toHaveClass("uic-board-item--sliding");
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{Enter}");
      expect(shell("Alpha")).not.toHaveClass("uic-board-item--sliding");
      expect(shell("Beta")).not.toHaveClass("uic-board-item--sliding");
      expect(dragHandleOf("Beta")).toHaveFocus();
    });

    it("steps from the direction buttons without taking focus", async () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      const handle = dragHandleOf("Beta");
      handle.focus();
      await userEvent.keyboard(" ");
      const left = shell("Beta").querySelector(
        '.uic-board__direction[data-direction="left"]',
      ) as HTMLElement;
      await userEvent.click(left);
      await userEvent.click(left);
      expect(liveText()).toBe("Item moved to column 1, row 1.");
      expect(handle).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      expect(onItemsChange.mock.calls[0]?.[0]?.movedItem?.id).toBe("b");
    });

    it("refuses a step off the grid, and reports no move that ends where it started", async () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      dragHandleOf("Beta").focus();
      await userEvent.keyboard("{Enter}");
      // Beta already sits against the right edge.
      await userEvent.keyboard("{ArrowRight}");
      expect(liveText()).toBe("Dragging.");
      await userEvent.keyboard("{ArrowLeft}{ArrowRight}");
      await userEvent.keyboard(" ");
      expect(liveText()).toBe("Move committed.");
      expect(onItemsChange).not.toHaveBeenCalled();
    });

    it("does not commit a conflict", async () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      dragHandleOf("Beta").focus();
      await userEvent.keyboard("{Enter}{ArrowLeft}{Enter}");
      expect(liveText()).toBe("Move discarded.");
      expect(onItemsChange).not.toHaveBeenCalled();
    });

    it("discards on Escape", async () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      dragHandleOf("Beta").focus();
      await userEvent.keyboard("{Enter}{ArrowLeft}{ArrowLeft}");
      expect(
        document.querySelectorAll(".uic-board__placeholder").length,
      ).toBeGreaterThan(0);
      await userEvent.keyboard("{Escape}");
      expect(liveText()).toBe("Move discarded.");
      expect(onItemsChange).not.toHaveBeenCalled();
      expect(shell("Beta")).not.toHaveClass("uic-board-item--active");
      expect(document.querySelectorAll(".uic-board__placeholder")).toHaveLength(0);
    });

    it("commits when the handle loses focus", async () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      dragHandleOf("Beta").focus();
      await userEvent.keyboard("{Enter}{ArrowLeft}{ArrowLeft}");
      await userEvent.tab();
      expect(liveText()).toBe("Move committed.");
      expect(onItemsChange.mock.calls[0]?.[0]?.movedItem?.id).toBe("b");
    });

    it("uses the consumer's announcement builders", async () => {
      renderBoard({
        isMovable: true,
        liveAnnouncementDndStarted: (op) => `start ${op}`,
        liveAnnouncementDndItemMoved: ({ item, placement }) =>
          `${item.data.title} at ${placement.x},${placement.y}`,
        liveAnnouncementDndCommitted: (op) => `done ${op}`,
      });
      dragHandleOf("Beta").focus();
      await userEvent.keyboard(" ");
      expect(liveText()).toBe("start move");
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(liveText()).toBe("Beta at 0,0");
      await userEvent.keyboard("{Enter}");
      expect(liveText()).toBe("done move");
    });
  });

  describe("pointer", () => {
    // jsdom has no layout: the grid is 800px wide (four 200px columns, no
    // gap), a 2x2 item measures 400x200 (100px rows), and the grid's top is
    // whatever the test says it is.
    let gridTop = 300;
    let restore: () => void;
    beforeEach(() => {
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function (this: Element) {
        if (this.classList.contains("uic-board__grid")) {
          return {
            left: 0,
            top: gridTop,
            right: 800,
            bottom: gridTop + 400,
            width: 800,
            height: 400,
          } as DOMRect;
        }
        if (this.classList.contains("uic-board-item")) {
          return {
            left: 0,
            top: gridTop,
            right: 400,
            bottom: gridTop + 200,
            width: 400,
            height: 200,
          } as DOMRect;
        }
        return original.call(this);
      };
      restore = () => {
        Element.prototype.getBoundingClientRect = original;
      };
    });
    afterEach(() => restore());

    const press = (handle: HTMLElement, pointerId: number, x: number, y: number) =>
      fireEvent.pointerDown(handle, { pointerId, button: 0, clientX: x, clientY: y });

    it("a click activates the handle like Enter does", () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      const handle = dragHandleOf("Alpha");
      press(handle, 1, 50, 350);
      expect(liveText()).toBe("");
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 52, clientY: 351 });
      fireEvent.pointerUp(handle, { pointerId: 1 });
      expect(liveText()).toBe("Dragging.");
      expect(directionButtons("Alpha")).toEqual(["up", "down", "left", "right"]);
      // A second click commits.
      press(handle, 2, 50, 350);
      fireEvent.pointerUp(handle, { pointerId: 2 });
      expect(liveText()).toBe("Move committed.");
      expect(onItemsChange).not.toHaveBeenCalled();
      expect(directionButtons("Alpha")).toEqual([]);
    });

    it("drags past the click threshold, snaps to whole cells and commits on release", () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      const handle = dragHandleOf("Alpha");
      press(handle, 1, 50, 350);
      expect(shell("Alpha")).not.toHaveClass("uic-board-item--dragging");

      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 140, clientY: 350 });
      // Pointer steps are not announced; the cells under the item are tinted.
      expect(liveText()).toBe("Dragging.");
      expect(shell("Alpha")).toHaveClass("uic-board-item--dragging");
      expect(shell("Alpha").style.transform).toBe("translate(90px, 0px)");
      expect(hoveredCells()).toEqual(["1,1", "2,1", "1,2", "2,2"]);
      expect(directionButtons("Alpha")).toEqual([]);

      // Half over Beta: a conflict, nothing else moves.
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 260, clientY: 350 });
      expect(liveText()).toBe("Dragging.");
      expect(shell("Alpha").style.transform).toBe("translate(210px, 0px)");
      expect(hoveredCells()).toEqual(["2,1", "3,1", "2,2", "3,2"]);
      expect(shell("Beta").style.transform).toBe("");

      // Over Beta: Beta slides into Alpha's place.
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 450, clientY: 350 });
      expect(hoveredCells()).toEqual(["3,1", "4,1", "3,2", "4,2"]);
      expect(shell("Beta").style.transform).toBe("translate(-400px, 0px)");

      fireEvent.pointerUp(handle, { pointerId: 1 });
      expect(liveText()).toBe("Move committed.");
      const detail = onItemsChange.mock.calls[0]?.[0] as BoardItemsChangeDetail<Data>;
      expect(detail.movedItem?.id).toBe("a");
      expect(detail.items.map((it) => `${it.id}:${it.columnOffset?.[4]}`)).toEqual([
        "b:0",
        "a:2",
        "c:0",
      ]);
      expect(shell("Alpha")).not.toHaveClass("uic-board-item--dragging");
    });

    it("compensates for an ancestor scrolling under a still pointer", () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      const handle = dragHandleOf("Alpha");
      press(handle, 1, 50, 350);
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 50, clientY: 355 });
      expect(shell("Alpha").style.transform).toBe("translate(0px, 5px)");

      // The container scrolls 120px: the grid rises, the pointer stays put.
      gridTop = 180;
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 50, clientY: 355 });
      expect(hoveredCells()).toEqual(["1,2", "2,2", "1,3", "2,3"]);
      // The item stays under the pointer: it moves with the scroll.
      expect(shell("Alpha").style.transform).toBe("translate(0px, 125px)");

      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 250, clientY: 355 });
      expect(hoveredCells()).toEqual(["2,2", "3,2", "2,3", "3,3"]);

      // A scroll with no pointer event re-applies the last pointer position.
      gridTop = 80;
      fireEvent.scroll(document.body);
      expect(hoveredCells()).toEqual(["2,3", "3,3", "2,4", "3,4"]);
      expect(shell("Alpha").style.transform).toBe("translate(200px, 225px)");

      fireEvent.pointerUp(handle, { pointerId: 1 });
      const detail = onItemsChange.mock.calls[0]?.[0] as BoardItemsChangeDetail<Data>;
      expect(detail.items.map((it) => `${it.id}:${it.columnOffset?.[4]}`)).toEqual([
        "b:2",
        "a:1",
        "c:0",
      ]);
    });

    it("discards on pointer cancel and on Escape", () => {
      const { onItemsChange } = renderBoard({ isMovable: true });
      const handle = dragHandleOf("Alpha");
      press(handle, 1, 50, 350);
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 260, clientY: 350 });
      fireEvent.pointerCancel(handle, { pointerId: 1 });
      expect(liveText()).toBe("Move discarded.");

      press(handle, 2, 50, 350);
      fireEvent.pointerMove(handle, { pointerId: 2, clientX: 260, clientY: 350 });
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(liveText()).toBe("Move discarded.");
      expect(shell("Alpha").style.transform).toBe("");
      expect(onItemsChange).not.toHaveBeenCalled();
    });

    it("resizes to the pointer's size while held and snaps to cells on release", () => {
      const { onItemsChange } = renderBoard({ isResizable: true });
      const handle = resizeHandleOf("Alpha");
      press(handle, 1, 395, 495);

      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 455, clientY: 525 });
      expect(liveText()).toBe("Resizing.");
      expect(shell("Alpha")).toHaveClass("uic-board-item--resizing");
      // The box follows the pointer, not the grid...
      expect(shell("Alpha").style.width).toBe("460px");
      expect(shell("Alpha").style.height).toBe("230px");
      // ...and still spans its original cells.
      expect(placement("Alpha")).toBe("1 / span 2 | 1 / span 2");

      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 545, clientY: 595 });
      expect(shell("Alpha").style.width).toBe("550px");
      expect(shell("Alpha").style.height).toBe("300px");
      expect(hoveredCells()).toHaveLength(9);
      expect(hoveredCells()[8]).toBe("3,3");

      // Never under the minimum spans.
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 100 });
      expect(shell("Alpha").style.width).toBe("200px");
      expect(shell("Alpha").style.height).toBe("200px");

      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 545, clientY: 595 });
      fireEvent.pointerUp(handle, { pointerId: 1 });
      expect(liveText()).toBe("Resize committed.");
      expect(shell("Alpha").style.width).toBe("");
      const detail = onItemsChange.mock.calls[0]?.[0] as BoardItemsChangeDetail<Data>;
      expect(detail.resizedItem).toMatchObject({ id: "a", columnSpan: 3, rowSpan: 3 });
      expect(shell("Alpha")).not.toHaveClass("uic-board-item--resizing");
    });
  });

  describe("keyboard resize", () => {
    it("grows one cell per arrow once activated and reports the new spans", async () => {
      const { onItemsChange } = renderBoard({ isResizable: true });
      resizeHandleOf("Alpha").focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(liveText()).toBe("");
      await userEvent.keyboard("{Enter}");
      expect(liveText()).toBe("Resizing.");
      expect(directionButtons("Alpha")).toEqual(["up", "down", "left", "right"]);

      await userEvent.keyboard("{ArrowRight}");
      expect(liveText()).toBe("Item resized to 3 columns by 2 rows.");
      expect(placement("Alpha")).toBe("1 / span 3 | 1 / span 2");
      await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");
      // A step past the board's edge is refused.
      expect(liveText()).toBe("Item resized to 4 columns by 3 rows.");

      await userEvent.keyboard("{Enter}");
      expect(liveText()).toBe("Resize committed.");
      const detail = onItemsChange.mock.calls[0]?.[0] as BoardItemsChangeDetail<Data>;
      expect(detail.resizedItem).toMatchObject({ id: "a", columnSpan: 4, rowSpan: 3 });
      expect(detail.movedItem).toBeUndefined();
      expect(detail.items.map((it) => it.id)).toEqual(["a", "b", "c"]);
      expect(detail.items[1]).toMatchObject({ columnSpan: 2, rowSpan: 2 });
    });

    it("does not shrink under the minimum spans", async () => {
      const { onItemsChange } = renderBoard({
        isResizable: true,
        items: [
          {
            id: "a",
            rowSpan: 3,
            columnSpan: 2,
            definition: { minColumnSpan: 2 },
            data: { title: "Alpha" },
          },
        ],
      });
      resizeHandleOf("Alpha").focus();
      await userEvent.keyboard("{Enter}{ArrowLeft}{ArrowUp}");
      expect(liveText()).toBe("Item resized to 2 columns by 2 rows.");
      await userEvent.keyboard("{ArrowUp}{Enter}");
      expect(onItemsChange.mock.calls[0]?.[0]?.resizedItem).toMatchObject({
        columnSpan: 2,
        rowSpan: 2,
      });
    });
  });

  it("removes an item through the render actions and re-lays the rest out", async () => {
    const { onItemsChange } = renderBoard();
    await userEvent.click(screen.getByRole("button", { name: "Remove Alpha" }));
    expect(onItemsChange).toHaveBeenCalledTimes(1);
    const detail = onItemsChange.mock.calls[0]?.[0] as BoardItemsChangeDetail<Data>;
    expect(detail.removedItem?.id).toBe("a");
    expect(detail.items.map((it) => it.id)).toEqual(["b", "c"]);
    expect(detail.items.map((it) => it.columnOffset)).toEqual([{ 4: 2 }, { 4: 0 }]);
    expect(liveText()).toBe("Item removed.");
  });

  it("is controlled: renders what the parent passes after a change", async () => {
    const { onItemsChange, rerender } = renderBoard({ isMovable: true });
    dragHandleOf("Beta").focus();
    await userEvent.keyboard("{Enter}{ArrowLeft}{ArrowLeft}{Enter}");
    const detail = onItemsChange.mock.calls[0]?.[0] as BoardItemsChangeDetail<Data>;
    rerender(
      <Board<Data>
        items={detail.items}
        isMovable
        renderItem={(item) => <h5>{item.data.title}</h5>}
        onItemsChange={onItemsChange}
      />,
    );
    expect(placement("Beta")).toBe("1 / span 2 | 1 / span 2");
    expect(placement("Alpha")).toBe("3 / span 2 | 1 / span 2");
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Beta",
      "Alpha",
      "Gamma",
    ]);
  });
});
