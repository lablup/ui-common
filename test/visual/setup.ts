import { afterEach, expect, vi } from "vitest";
import { page } from "vitest/browser";

// Stories that show "now" (DateTimeRangeInput's presets) must not change the
// picture from one day to the next. Only Date is faked: timers keep running so
// components can settle.
vi.useFakeTimers({ now: new Date("2026-01-15T12:00:00Z"), toFake: ["Date"] });

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

afterEach(async (context) => {
  if (context.task.result?.state === "fail") return;
  await domSettled();
  await document.fonts.ready;
  // The tester page pins body to the viewport, which would cut off tall
  // stories. Overlays still need the full-height minimum to have a backdrop.
  document.body.style.height = "auto";
  document.body.style.minHeight = "100vh";
  await expect(page.elementLocator(document.body)).toMatchScreenshot();
});
