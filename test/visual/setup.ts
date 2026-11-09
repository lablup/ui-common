import { afterEach, expect, vi } from "vitest";
import { page } from "vitest/browser";

// Stories that show "now" (DateTimeRangeInput's presets) must not change the
// picture from one day to the next. Only Date is faked: timers keep running so
// components can settle.
vi.useFakeTimers({ now: new Date("2026-01-15T12:00:00Z"), toFake: ["Date"] });

afterEach(async (context) => {
  if (context.task.result?.state === "fail") return;
  await document.fonts.ready;
  // The tester page pins body to the viewport, which would cut off tall
  // stories. Overlays still need the full-height minimum to have a backdrop.
  document.body.style.height = "auto";
  document.body.style.minHeight = "100vh";
  await expect(page.elementLocator(document.body)).toMatchScreenshot();
});
