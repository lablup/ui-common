// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/lab 0.6.2-canary.c9fb1ad, src/Tour/TourStep.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * TourStep, ui-common's copy of Astryx lab's, with one fix applied (not yet
 * upstream): the highlight overlay is promoted into the top layer exactly
 * once and never hidden and re-shown. Top-layer order is promotion order, so
 * the re-promotion React StrictMode's double-invoked effect caused moved the
 * overlay ABOVE the callout and painted the spotlight dim over it. Detaching
 * the node takes it out of the top layer, so no cleanup is needed.
 *
 * `Tour`, `TourContext` and `useTour` are forked unchanged with it, since the
 * step reads the controller's context. Everything else is upstream's. Its
 * style namespace is Astryx's compiled output (src/forks/compiled.ts).
 *
 * Delete this fork, and its exports.exclude.json entry, once lab ships the
 * fix (CONTRIBUTING, "Forks of Astryx components").
 */

/*
 * Upstream's file notes, kept:
 *
 * A TourStep highlights a target element and renders a callout anchored to it,
 * with a heading, body, optional step progress ("2 of 5"), and back / next /
 * close controls. It registers with the parent `<Tour>` on mount (so step
 * order follows the children) and only renders its callout while it is the
 * active step. Anchoring + the callout surface reuse the core `Popover`
 * (`anchorRef` → the step's target), so positioning, top-layer rendering, and
 * dismiss semantics come from the existing layer system rather than a bespoke
 * implementation.
 *
 * The highlight is drawn as a separate overlay tracking the target's box — the
 * consumer's element is never restyled, so there is no cascade fight with the
 * target's own styles. That overlay is promoted into the browser TOP LAYER
 * (via the popover API, like the rest of the layer system) so it sits above
 * page content without any hardcoded z-index; the callout is promoted after
 * it, so the callout stays above the highlight. Because it is promoted in
 * place (not portaled out of the tree), it stays inside the consumer's Theme
 * subtree and inherits theme tokens — including a scoped/nested theme's accent
 * for the ring. Dimming is an opt-in spotlight cutout (dims around the target,
 * not over it) rather than a flat scrim.
 */

import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Popover } from "@astryxdesign/core/Popover";
import type { LayerAlignment, LayerPlacement } from "@astryxdesign/core/Layer";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack, HStack } from "@astryxdesign/core/Layout";

import { compiledStyles } from "../compiled";
import * as compiled from "./TourStep.styles";
import { TourContext } from "./TourContext";

// Client-only layout effect (SSR renders no overlay, so this only runs on the
// client). Kept local since core does not export its isomorphic variant.
const useClientLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Gap between the target's edge and the highlight ring, in px.
const HIGHLIGHT_PADDING = 4;

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: string;
}

// @astryxdesign/lab dist/Tour/TourStep.js `styles`.
const styles = compiledStyles(compiled.styles);

// Upstream's `overlayRoot`/`overlayInteractive`, `highlight`/`cutout`/`hidden`
// and `content` styles, which its compiler folded into these class lists
// (dist/Tour/TourStep.js).
const OVERLAY_CLASS_NAME = {
  coachmark:
    "xixxii4 x10a8y8t x1ghz6dp x1717udv xc342km xng3xce xjbqb8w x1rea2x4 x47corl",
  backdrop:
    "xixxii4 x10a8y8t x1ghz6dp x1717udv xc342km xng3xce xjbqb8w x1rea2x4 x67bb7w",
};
function highlightClassName(hasBackdrop: boolean, isHidden: boolean): string {
  if (hasBackdrop) {
    return isHidden
      ? "x10l6tqk x47corl x1gfj591 xuedmi6 xlr8y92 xefcaua xg01cxk"
      : "x10l6tqk x47corl x1gfj591 xuedmi6 xlr8y92 xefcaua";
  }
  return isHidden
    ? "x10l6tqk x47corl xr5mita x1gfj591 xuedmi6 xlr8y92 xg01cxk"
    : "x10l6tqk x47corl xr5mita x1gfj591 xuedmi6 xlr8y92";
}
const CONTENT_CLASS_NAME = "x78zum5 xdt5ytf xjcht0a x1va8c73";

const calloutGapStyles = {
  below: styles.calloutGapBelow,
  above: styles.calloutGapAbove,
  start: styles.calloutGapStart,
  end: styles.calloutGapEnd,
} as const;

/**
 * The highlight overlay: a top-layer box sized to the target, plus an optional
 * spotlight-cutout dim. Rendered inline (not portaled) so it stays inside the
 * consumer's Theme subtree and inherits theme tokens — the popover API promotes
 * it into the top layer in place. Rendered before the callout so the callout
 * promotes on top of it; promoted once (never re-promoted) so that ordering
 * holds across re-measures.
 */
function TourHighlight({
  rect,
  hasBackdrop,
  onBackdropClick,
}: {
  rect: TargetRect | null;
  hasBackdrop: boolean;
  onBackdropClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useClientLayoutEffect(() => {
    const el = ref.current;
    if (el == null || typeof el.showPopover !== "function") {
      return;
    }
    // ui-common: promote exactly once, and never hide-then-reshow: top-layer
    // order is promotion order, so a re-promotion (React StrictMode's dev
    // double-invoke of this effect) would move the overlay ABOVE the callout
    // and paint the spotlight dim over it. Detaching the node drops it from
    // the top layer.
    if (!el.matches(":popover-open")) {
      el.showPopover();
    }
  }, []);

  return (
    <div
      ref={ref}
      popover="manual"
      data-testid={hasBackdrop ? "tour-backdrop" : undefined}
      aria-hidden="true"
      onClick={hasBackdrop ? onBackdropClick : undefined}
      className={
        hasBackdrop ? OVERLAY_CLASS_NAME.backdrop : OVERLAY_CLASS_NAME.coachmark
      }
    >
      <div
        data-testid="tour-highlight"
        className={highlightClassName(hasBackdrop, rect == null)}
        style={
          rect != null
            ? {
                top: rect.top - HIGHLIGHT_PADDING,
                left: rect.left - HIGHLIGHT_PADDING,
                width: rect.width + HIGHLIGHT_PADDING * 2,
                height: rect.height + HIGHLIGHT_PADDING * 2,
                borderRadius: rect.radius,
              }
            : undefined
        }
      />
    </div>
  );
}

export interface TourStepProps {
  /**
   * Ref to the element this step points at. The callout anchors to it (like a
   * Popover trigger); it must be a `<button>` or `[role="button"]` element,
   * matching Popover's `anchorRef` contract. Accepts a ref to any HTMLElement
   * subtype (e.g. `useRef<HTMLButtonElement>(null)`).
   */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Step heading. */
  heading: ReactNode;
  /** Step body content. */
  children?: ReactNode;
  /**
   * Which side of the target the callout sits on.
   * @default 'below'
   */
  placement?: LayerPlacement;
  /**
   * How the callout aligns along the placement side — e.g. with `placement="below"`,
   * `start` left-aligns it under the target, `center` centers it, `end` right-aligns it.
   * @default 'start'
   */
  alignment?: LayerAlignment;
  /** Test id applied to the callout content. */
  "data-testid"?: string;
}

/**
 * A single spotlight step within a `<Tour>`. Renders its callout only while
 * active.
 *
 * @example
 * ```
 * <TourStep targetRef={saveRef} heading="Save your work">
 *   Changes save automatically.
 * </TourStep>
 * ```
 */
export function TourStep({
  targetRef,
  heading,
  children,
  placement = "below",
  alignment = "start",
  "data-testid": testId,
}: TourStepProps) {
  const tour = useContext(TourContext);
  const id = useId();
  const isActiveStep = tour != null && tour.activeStepId === id;

  // The active target's viewport box, tracked so the highlight overlay can sit
  // exactly over it. null until measured (or when inactive).
  const [rect, setRect] = useState<TargetRect | null>(null);

  // Register with the controller on mount so the tour learns this step (and
  // its position among siblings). Unregister on unmount.
  useEffect(() => {
    if (tour == null) {
      return;
    }
    return tour.registerStep(id);
  }, [tour, id]);

  // Track the target's box while this step is active. Re-measure on
  // scroll/resize so the highlight stays glued to the target.
  useEffect(() => {
    const el = targetRef.current;
    if (el == null || !isActiveStep) {
      setRect(null);
      return;
    }
    const measure = () => {
      const box = el.getBoundingClientRect();
      setRect({
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        radius: getComputedStyle(el).borderRadius || "0px",
      });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      setRect(null);
    };
  }, [targetRef, isActiveStep]);

  // Outside a <Tour>, or when this isn't the active step, render nothing.
  if (tour == null || !isActiveStep) {
    return null;
  }

  const {
    activeStepIndex,
    stepCount,
    isStepCountShown,
    hasBackdrop,
    onNext,
    onPrevious,
    onDismiss,
  } = tour;

  const isFirstStep = activeStepIndex <= 0;
  const isLastStep = stepCount > 0 && activeStepIndex === stepCount - 1;

  const content = (
    <div className={CONTENT_CLASS_NAME} data-testid={testId}>
      <VStack gap={1}>
        <Heading level={4}>{heading}</Heading>
        {children != null && <Text type="body">{children}</Text>}
      </VStack>
      <HStack gap={2} xstyle={styles.footer}>
        {isStepCountShown && stepCount > 0 ? (
          <Text type="supporting" color="secondary">
            {`${activeStepIndex + 1} of ${stepCount}`}
          </Text>
        ) : (
          <span />
        )}
        <HStack gap={2}>
          {!isFirstStep && (
            <Button variant="ghost" size="sm" label="Back" onClick={onPrevious} />
          )}
          <Button
            variant="primary"
            size="sm"
            label={isLastStep ? "Done" : "Next"}
            onClick={onNext}
          />
        </HStack>
      </HStack>
    </div>
  );

  return (
    <>
      {/* Rendered before the callout so the callout promotes above it in the
          top layer (callout > highlight > page). */}
      <TourHighlight
        rect={rect}
        hasBackdrop={hasBackdrop}
        onBackdropClick={() => onDismiss("backdrop")}
      />
      <Popover
        // Popover types anchorRef as RefObject<HTMLElement>; TourStep accepts a
        // nullable ref for ergonomics (useRef<HTMLButtonElement>(null)). Popover
        // guards a null `.current` internally, so this widening is safe.
        anchorRef={targetRef as React.RefObject<HTMLElement>}
        isOpen
        onOpenChange={(open) => {
          // Popover reports close from light-dismiss (backdrop) or Escape.
          // Route it to the tour as a dismissal so the whole tour ends, not
          // just this step's popover. Escape and outside-click both surface
          // here.
          if (!open) {
            onDismiss("close");
          }
        }}
        placement={placement}
        alignment={alignment}
        // Size the callout to its content instead of matching the target's
        // width (Popover's default minWidth: anchor-size(width) makes it span a
        // wide target); the content's own maxWidth caps it.
        width="fit-content"
        // Push the callout clear of the highlight ring so the ring is never
        // covered (placement-aware; adds to Popover's own anchor gap).
        xstyle={calloutGapStyles[placement]}
        label={typeof heading === "string" ? heading : "Tour step"}
        hasCloseButton
        closeButtonLabel="Close tour"
        content={content}
      />
    </>
  );
}

TourStep.displayName = "TourStep";
