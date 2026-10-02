import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MAX_MODAL_LEVEL,
  MODAL_LIVE_ATTRIBUTE,
  claimModalLevel,
  configureModalZIndex,
  refreshModalBackground,
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

describe("modalStack: the page behind an open modal", () => {
  const added: Element[] = [];
  /** Append `html` to document.body and return its first element. */
  function mount(html: string) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const el = template.content.firstElementChild as HTMLElement;
    document.body.append(el);
    added.push(el);
    return el;
  }
  /** Claim a level for a root portalled straight into document.body. */
  function open(parent: Element = document.body) {
    const root = document.createElement("div");
    parent.append(root);
    added.push(root);
    const entry = claimModalLevel(root, vi.fn());
    claimed.push(entry);
    return { root, entry };
  }
  afterEach(() => {
    for (const entry of claimed.splice(0)) releaseModalLevel(entry);
    for (const el of added.splice(0)) el.remove();
  });

  it("inerts every other child of document.body, and restores them on close", () => {
    const app = mount(`<div id="app"><button>behind</button></div>`);
    const toast = mount(`<div id="toast"></div>`);
    const { root, entry } = open();
    expect(app).toHaveAttribute("inert");
    expect(toast).toHaveAttribute("inert");
    expect(root).not.toHaveAttribute("inert");
    releaseModalLevel(entry);
    expect(app).not.toHaveAttribute("inert");
    expect(toast).not.toHaveAttribute("inert");
  });

  it("keeps the background inert until the last modal closes", () => {
    const app = mount(`<div id="app"></div>`);
    const outer = open();
    const inner = open();
    expect(app).toHaveAttribute("inert");
    expect(outer.root).toHaveAttribute("inert");
    expect(inner.root).not.toHaveAttribute("inert");
    releaseModalLevel(inner.entry);
    expect(app).toHaveAttribute("inert");
    expect(outer.root).not.toHaveAttribute("inert");
    releaseModalLevel(outer.entry);
    expect(app).not.toHaveAttribute("inert");
  });

  it("never clears an inert it did not set", () => {
    const frozen = mount(`<div id="frozen" inert></div>`);
    const { entry } = open();
    releaseModalLevel(entry);
    expect(frozen).toHaveAttribute("inert");
  });

  it(`leaves an element marked ${MODAL_LIVE_ATTRIBUTE} reachable, wherever it is`, () => {
    const app = mount(
      `<div id="app"><main id="page"></main><div id="notices" ${MODAL_LIVE_ATTRIBUTE}></div></div>`,
    );
    const page = app.querySelector("#page");
    const notices = app.querySelector("#notices");
    const { entry } = open();
    expect(app).not.toHaveAttribute("inert");
    expect(notices).not.toHaveAttribute("inert");
    expect(page).toHaveAttribute("inert");
    releaseModalLevel(entry);
    expect(page).not.toHaveAttribute("inert");
  });

  it("treats a root that is not a direct child of body as a modal root", () => {
    // A drawer portal, say, that claims its level through useModalLevel.
    const host = mount(`<div id="host"><div id="sibling"></div></div>`);
    const { root } = open(host);
    expect(host).not.toHaveAttribute("inert");
    expect(root).not.toHaveAttribute("inert");
    expect(host.querySelector("#sibling")).toHaveAttribute("inert");
  });

  it("picks up a live region that mounts while a modal is open", () => {
    const app = mount(`<div id="app"><main id="page"></main></div>`);
    open();
    expect(app).toHaveAttribute("inert");
    const notices = document.createElement("div");
    notices.setAttribute(MODAL_LIVE_ATTRIBUTE, "");
    app.append(notices);
    refreshModalBackground();
    expect(app).not.toHaveAttribute("inert");
    expect(app.querySelector("#page")).toHaveAttribute("inert");
    notices.remove();
    refreshModalBackground();
    expect(app).toHaveAttribute("inert");
  });
});
