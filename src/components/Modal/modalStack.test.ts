import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MAX_MODAL_LEVEL,
  claimModalLevel,
  configureModalZIndex,
  releaseModalLevel,
  type ModalLevelEntry,
} from "./modalStack";

const claimed: ModalLevelEntry[] = [];

function claim(zIndex?: number) {
  const root = document.createElement("div");
  const setIsTopmost = vi.fn();
  const entry = claimModalLevel(root, setIsTopmost, zIndex);
  claimed.push(entry);
  return { root, entry, setIsTopmost };
}

afterEach(() => {
  for (const entry of claimed.splice(0)) releaseModalLevel(entry);
  configureModalZIndex();
  vi.restoreAllMocks();
});

describe("modalStack", () => {
  it("inerts every root but the top one", () => {
    const a = claim();
    const b = claim();
    const c = claim();
    expect(a.root).toHaveAttribute("inert");
    expect(b.root).toHaveAttribute("inert");
    expect(c.root).not.toHaveAttribute("inert");
  });

  it("un-inerts the new top when the top is released", () => {
    const a = claim();
    const b = claim();
    releaseModalLevel(b.entry);
    expect(a.root).not.toHaveAttribute("inert");
  });

  it("clears the inert a covered entry carried when it is released", () => {
    const a = claim();
    claim();
    releaseModalLevel(a.entry);
    expect(a.root).not.toHaveAttribute("inert");
  });

  it("tells each entry whether it is the topmost one, on a flip only", () => {
    const a = claim();
    const b = claim();
    expect(a.setIsTopmost).toHaveBeenCalledWith(false);
    expect(b.setIsTopmost).not.toHaveBeenCalled();
    releaseModalLevel(b.entry);
    expect(a.setIsTopmost).toHaveBeenLastCalledWith(true);
  });

  it("resolves every claim above the current top, override or not", () => {
    const a = claim(5000);
    const b = claim();
    expect(a.entry.zIndex).toBe(5000);
    expect(b.entry.zIndex).toBe(5010);
  });

  it("ignores an override outside the band", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(claim(10).entry.zIndex).toBe(1100);
    expect(claim(20000).entry.zIndex).toBe(1110);
  });

  it("never paints above the band's max", () => {
    configureModalZIndex({ base: 100, step: 50, max: 180 });
    expect([claim(), claim(), claim()].map((c) => c.entry.zIndex)).toEqual([
      100, 150, 180,
    ]);
  });

  it("clamps the level and releases by identity when two share it", () => {
    const entries = Array.from({ length: MAX_MODAL_LEVEL + 2 }, () => claim());
    const [secondLast, last] = entries.slice(-2);
    expect(secondLast?.entry.level).toBe(MAX_MODAL_LEVEL);
    expect(last?.entry.level).toBe(MAX_MODAL_LEVEL);
    if (last) releaseModalLevel(last.entry);
    expect(secondLast?.root).not.toHaveAttribute("inert");
  });
});
