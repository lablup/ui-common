import { afterEach, describe, expect, it } from "vitest";

import {
  AUTO_SCROLL_EDGE_PX,
  AUTO_SCROLL_MAX_STEP_PX,
  autoScrollStep,
  compensateForScroll,
  findScrollParent,
  scrollBounds,
} from "./scroll";

describe("compensateForScroll", () => {
  it("is the pointer's travel while nothing scrolled", () => {
    expect(
      compensateForScroll(
        { x: 130, y: 250 },
        { x: 100, y: 200 },
        { x: 10, y: 20 },
        { x: 10, y: 20 },
      ),
    ).toEqual({ x: 30, y: 50 });
  });

  it("adds the grid's travel when an ancestor scrolled under a still pointer", () => {
    // The container scrolled down 120px: the grid's top moved from 300 to 180.
    expect(
      compensateForScroll(
        { x: 100, y: 200 },
        { x: 100, y: 200 },
        { x: 0, y: 300 },
        { x: 0, y: 180 },
      ),
    ).toEqual({ x: 0, y: 120 });
  });

  it("combines both", () => {
    expect(
      compensateForScroll(
        { x: 90, y: 230 },
        { x: 100, y: 200 },
        { x: 40, y: 300 },
        { x: 60, y: 180 },
      ),
    ).toEqual({ x: -30, y: 150 });
  });
});

describe("findScrollParent", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns the nearest ancestor with overflow auto or scroll on either axis", () => {
    document.body.innerHTML = `
      <div id="outer" style="overflow-y: auto">
        <div id="inner" style="overflow-x: scroll">
          <div id="plain" style="overflow: visible"><div id="grid"></div></div>
        </div>
      </div>`;
    const grid = document.getElementById("grid") as Element;
    expect(findScrollParent(grid)).toBe(document.getElementById("inner"));
    const inner = document.getElementById("inner") as Element;
    expect(findScrollParent(inner)).toBe(document.getElementById("outer"));
  });

  it("falls back to the document's scrolling element", () => {
    document.body.innerHTML = `<div style="overflow: hidden"><div id="grid"></div></div>`;
    const grid = document.getElementById("grid") as Element;
    expect(findScrollParent(grid)).toBe(
      document.scrollingElement ?? document.documentElement,
    );
  });
});

describe("scrollBounds", () => {
  it("is the viewport for the document and the box for a container", () => {
    const doc = document.scrollingElement ?? document.documentElement;
    expect(scrollBounds(doc)).toEqual({
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    });
    const el = document.createElement("div");
    el.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        right: 310,
        bottom: 420,
        width: 300,
        height: 400,
      }) as DOMRect;
    expect(scrollBounds(el)).toEqual({ left: 10, top: 20, right: 310, bottom: 420 });
  });
});

describe("autoScrollStep", () => {
  const bounds = { left: 0, top: 100, right: 800, bottom: 700 };

  it("does nothing away from the edges", () => {
    expect(autoScrollStep({ x: 400, y: 400 }, bounds)).toEqual({ x: 0, y: 0 });
    expect(autoScrollStep({ x: 400, y: 100 + AUTO_SCROLL_EDGE_PX }, bounds)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("scrolls toward the edge, faster the closer the pointer is", () => {
    const far = autoScrollStep({ x: 400, y: 700 - 40 }, bounds);
    const near = autoScrollStep({ x: 400, y: 700 - 4 }, bounds);
    expect(far.y).toBeGreaterThan(0);
    expect(near.y).toBeGreaterThan(far.y);
    expect(near.y).toBeLessThanOrEqual(AUTO_SCROLL_MAX_STEP_PX);
    expect(autoScrollStep({ x: 400, y: 700 }, bounds).y).toBe(AUTO_SCROLL_MAX_STEP_PX);
    expect(autoScrollStep({ x: 400, y: 760 }, bounds).y).toBe(AUTO_SCROLL_MAX_STEP_PX);
  });

  it("scrolls up and left with negative steps", () => {
    expect(autoScrollStep({ x: 10, y: 110 }, bounds)).toEqual({
      x: -Math.ceil(
        ((AUTO_SCROLL_EDGE_PX - 10) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_STEP_PX,
      ),
      y: -Math.ceil(
        ((AUTO_SCROLL_EDGE_PX - 10) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_STEP_PX,
      ),
    });
  });

  it("takes its own edge and step", () => {
    expect(autoScrollStep({ x: 400, y: 690 }, bounds, 20, 10)).toEqual({ x: 0, y: 5 });
  });
});
