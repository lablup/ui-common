import { afterEach, beforeAll, expect, vi } from "vitest";
import { page } from "vitest/browser";

// Stories that show "now" (DateTimeRangeInput's presets) must not change the
// picture from one day to the next. Only Date is faked: timers keep running so
// components can settle.
vi.useFakeTimers({ now: new Date("2026-01-15T12:00:00Z"), toFake: ["Date"] });

// The tester page pins body to the viewport, which would cut off tall stories.
// Set before any story renders, so every story lays out the same way.
beforeAll(() => {
  document.body.style.height = "auto";
  document.body.style.minHeight = "100vh";
});

/**
 * Resolves once the DOM has not changed for `quietMs`, so a story that loads
 * data on a timer is captured after it finished rather than part-way through.
 * Longer than the stories' fake server delays. A story that never settles is
 * captured at `maxMs` and shows up as a failing comparison; tag it `no-vrt`.
 */
function domSettled(quietMs = 600, maxMs = 5000) {
  return new Promise<void>((resolve) => {
    let quiet: ReturnType<typeof setTimeout>;
    const done = () => {
      observer.disconnect();
      clearTimeout(quiet);
      clearTimeout(limit);
      resolve();
    };
    const observer = new MutationObserver(() => {
      clearTimeout(quiet);
      quiet = setTimeout(done, quietMs);
    });
    observer.observe(document.body, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    quiet = setTimeout(done, quietMs);
    const limit = setTimeout(done, maxMs);
  });
}

const PAINTED_TAGS = new Set([
  "svg",
  "img",
  "canvas",
  "video",
  "input",
  "textarea",
  "select",
  "hr",
]);

/** Whether the element paints anything of its own, beyond its children. */
function paintsItself(element: Element, style: CSSStyleDeclaration) {
  if (PAINTED_TAGS.has(element.localName)) return true;
  if (
    style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    style.backgroundImage !== "none"
  ) {
    return true;
  }
  if (style.boxShadow !== "none" || style.outlineStyle !== "none") return true;
  return ["Top", "Right", "Bottom", "Left"].some(
    (side) =>
      style.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none" &&
      parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0,
  );
}

const MARGIN = 8; // room for shadows and focus rings outside the boxes

/**
 * The area the story actually painted: text, and every element with a
 * background, border, shadow or image of its own, portals and popovers
 * included. A full-width block with a short line of text counts as that line,
 * so most screenshots are a fraction of the page.
 */
function paintedBounds() {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  const add = (rect: DOMRect) => {
    if (rect.width === 0 || rect.height === 0) return;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  };

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (node instanceof Element) {
          if (node.closest(".sb-wrapper, script, style"))
            return NodeFilter.FILTER_REJECT;
          // An svg paints as a whole; its shapes add nothing.
          if (node.parentElement?.closest("svg")) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text) {
      if (!node.data.trim()) continue;
      range.selectNodeContents(node);
      add(range.getBoundingClientRect());
    } else if (node instanceof Element) {
      const style = getComputedStyle(node);
      if (style.visibility === "hidden" || style.opacity === "0") continue;
      if (paintsItself(node, style)) add(node.getBoundingClientRect());
    }
  }

  const page = document.documentElement;
  if (left === Infinity) return { left: 0, top: 0, width: 1, height: 1 };
  left = Math.max(0, Math.floor(left - MARGIN));
  top = Math.max(0, Math.floor(top - MARGIN));
  right = Math.min(page.scrollWidth, Math.ceil(right + MARGIN));
  bottom = Math.min(page.scrollHeight, Math.ceil(bottom + MARGIN));
  return { left, top, width: right - left, height: bottom - top };
}

afterEach(async (context) => {
  if (context.task.result?.state === "fail") return;
  await domSettled();
  await document.fonts.ready;

  // A screenshot of an element is the page inside its box, so an invisible
  // box over the painted area captures exactly that area.
  const { left, top, width, height } = paintedBounds();
  const frame = document.createElement("div");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, {
    position: "absolute",
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    pointerEvents: "none",
  });
  document.body.append(frame);
  try {
    await expect(page.elementLocator(frame)).toMatchScreenshot();
  } finally {
    frame.remove();
  }
});
