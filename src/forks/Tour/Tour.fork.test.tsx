/**
 * ui-common's tests for its Tour fork: the fix it carries (a step's highlight
 * is promoted into the top layer once and never hidden and re-shown), and that
 * everything else renders exactly as lab's does.
 */
import { StrictMode, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tour as UpstreamTour, TourStep as UpstreamTourStep } from "@astryxdesign/lab";

import { comparableMarkup } from "../../test/forkParity";
import { Tour } from "./Tour";
import { TourStep } from "./TourStep";

const originalMatches = Element.prototype.matches;
let showPopover: ReturnType<typeof vi.fn>;
let hidePopover: ReturnType<typeof vi.fn>;

// jsdom has neither the popover API nor top-layer state; model both.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
  showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute("data-popover-open", "");
  });
  hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute("data-popover-open");
  });
  HTMLElement.prototype.showPopover = showPopover as () => void;
  HTMLElement.prototype.hidePopover = hidePopover as () => void;
  Element.prototype.matches = function (this: Element, selector: string) {
    if (selector === ":popover-open") return this.hasAttribute("data-popover-open");
    return originalMatches.call(this, selector);
  };
});

afterEach(() => {
  Element.prototype.matches = originalMatches;
  // @ts-expect-error: restore jsdom's absence of the popover API
  delete HTMLElement.prototype.showPopover;
  // @ts-expect-error: as above
  delete HTMLElement.prototype.hidePopover;
});

function OneStepTour({
  TourImpl,
  StepImpl,
  hasBackdrop = false,
}: {
  TourImpl: typeof Tour;
  StepImpl: typeof TourStep;
  hasBackdrop?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button type="button" ref={ref}>
        Target
      </button>
      <TourImpl isActive hasBackdrop={hasBackdrop} onDismiss={() => {}}>
        <StepImpl targetRef={ref} heading="Save your work">
          Changes save automatically.
        </StepImpl>
      </TourImpl>
    </>
  );
}

const highlightOverlay = () => screen.getByTestId("tour-highlight").parentElement!;
const overlayPromotions = () =>
  showPopover.mock.contexts.filter((el) => el === highlightOverlay()).length;
const overlayDemotions = () =>
  hidePopover.mock.contexts.filter((el) => el === highlightOverlay()).length;

describe("Tour fork: highlight promotion", () => {
  it("promotes the highlight once under StrictMode, and never hides it", () => {
    render(
      <StrictMode>
        <OneStepTour TourImpl={Tour} StepImpl={TourStep} hasBackdrop />
      </StrictMode>,
    );
    expect(highlightOverlay()).toHaveAttribute("data-popover-open");
    expect(overlayPromotions()).toBe(1);
    expect(overlayDemotions()).toBe(0);
  });

  // When this fails, lab has shipped the fix: delete the fork and its
  // exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from lab's, which hides and re-promotes it", () => {
    render(
      <StrictMode>
        <OneStepTour
          TourImpl={UpstreamTour}
          StepImpl={UpstreamTourStep as typeof TourStep}
          hasBackdrop
        />
      </StrictMode>,
    );
    expect(overlayDemotions()).toBeGreaterThan(0);
    expect(overlayPromotions()).toBeGreaterThan(1);
  });
});

describe("Tour fork: parity with lab", () => {
  it.each([false, true])("renders lab's markup (backdrop: %s)", (hasBackdrop) => {
    const fork = render(
      <OneStepTour TourImpl={Tour} StepImpl={TourStep} hasBackdrop={hasBackdrop} />,
    );
    const upstream = render(
      <OneStepTour
        TourImpl={UpstreamTour}
        StepImpl={UpstreamTourStep as typeof TourStep}
        hasBackdrop={hasBackdrop}
      />,
    );
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
    // The callout renders in a portal, outside the render containers.
    const callouts = screen.getAllByText("Changes save automatically.");
    expect(callouts).toHaveLength(2);
    const [forkCallout, upstreamCallout] = callouts.map(
      (el) => el.closest('[role="dialog"]') ?? el.parentElement!,
    );
    expect(comparableMarkup(forkCallout!)).toBe(comparableMarkup(upstreamCallout!));
  });
});
