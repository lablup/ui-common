// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.7, src/Drawer/Drawer.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * Drawer, ui-common's copy of Astryx's (core since 0.7.2, lab before), with
 * three changes (not upstream):
 *
 * - **A scrimless drawer stays out of the top layer.** lab 0.6.5 opens it as
 *   a manual popover; this copy keeps the `show()` + z-index it had before
 *   (base 1000, later drawers above), because ui-common's `Modal` and
 *   notification stack are z-index surfaces: a top-layer drawer painted over
 *   a confirm or a notification opened while it was up, and the modal stack
 *   then inerted the drawer it could not cover.
 * - **`aria-modal` passes through.** A scrimless drawer is non-modal, but a
 *   consumer that restores modality by hand (its own mask and focus trap) can
 *   now say so; the default is unchanged.
 * - **ui-common's `Modal` opens above a scrimmed drawer.** That drawer is a
 *   modal `<dialog>`, top layer and inerting everything outside it, so a
 *   `Modal` portalled to the body sat behind it, unreachable. The drawer
 *   provides its dialog through `ModalPortalContext` while it is open and
 *   modal, and a `Modal` inside renders there and enters the top layer
 *   after it (modalStack.ts).
 *
 * Escape routing is upstream's since lab 0.6.5: the drawer registers with
 * core's layer-dismissal stack, so a popover, selector or modal opened inside
 * it closes first and nested drawers close top-first. Everything else is
 * upstream's too, with two differences in form only: its style namespaces,
 * `layerStructureReset` included, are Astryx's compiled output
 * (src/forks/compiled.ts), and the content is not wrapped in core's private
 * `LayerContentBoundary`, which resets the contexts core registers in its
 * own module (SizeContext, TabList's and others), as lab's Drawer never did.
 * Since 0.7.7 two more of core's private, module-scoped parts are left out:
 * `useModalOutlet` (an open modal drawer hosts Astryx's toast viewport) and
 * `ModalAnnounceProvider` (`useAnnounce` inside a modal drawer speaks from a
 * region inside it). ui-common's notification stack is not Astryx's toast
 * viewport. The stateless internals 0.7.7 added (`useIsHydrating`,
 * `useSettledOpen`, `useBackdropPress`, `chainEventHandlers`,
 * `layerClickBoundary`) are inlined below the styles.
 *
 * Delete this fork, and its exports.exclude.json entry, once ui-common's
 * `Modal` and notification stack are top layer themselves and Astryx passes
 * `aria-modal` through (CONTRIBUTING, "Forks of Astryx components").
 */

/*
 * Upstream's file notes, kept:
 *
 * Overlay panel for inspectors and detail views — the "click a table row,
 * see its details" pattern. Slides in from the inline start or end edge and
 * floats above the page content: unlike a docked panel it never reflows the
 * layout underneath, it overlays it (with or without a scrim).
 *
 * Inline axis only (start/end). Block-axis sheets are BottomSheet's job;
 * a drawer is always a full-height side panel.
 *
 * Sizing is viewport-aware: `width` is the desktop budget, and below
 * the mobile breakpoint it preserves a 56px reveal of the page behind, capped
 * by the requested width (or fills the viewport with the experimental
 * `experimental.isFullWidthOnMobile` option).
 *
 * Uses the native `<dialog>` element (same precedent as Dialog/MobileNav):
 * - `showModal()` when `hasScrim` (default) — top-layer rendering, focus
 *   trapping, `::backdrop`, no z-index management.
 * - `showPopover()` when `hasScrim={false}` — non-modal top-layer overlay;
 *   the page behind stays interactive (e.g. master-detail inspectors).
 *   (ui-common: `show()` and a z-index instead; see the header above.)
 *
 * Entry animation uses `@starting-style`; exit slides out before the active
 * modal-dialog or manual-popover host releases the top layer and focus returns
 * to the element that opened the drawer. React owns `display` for both legs
 * rather than a discrete `display` transition, so the panel stops painting in
 * the same commit as the host closes — see the `rendered` style for why.
 *
 * Sibling drawers use the shared layer dismissal stack for topmost-only Escape
 * handling and the browser top layer's chronological paint order.
 *
 * Dismissal follows Dialog: `purpose` decides whether Escape and a scrim click
 * request close, and Drawer renders no close button of its own. Compose
 * `DrawerHeader` with `onOpenChange` for a visible close action, as with
 * `DialogHeader`.
 *
 * The scrolling content area is the drawer's container, like Dialog's inner
 * box: the `padding` prop, else the theme's `padding` on `drawer`, insets it
 * through container tokens, defaulting to `--spacing-4` like Dialog, and the
 * applied inset is published so a lone Section child escapes it and a Layout
 * redistributes it to its regions. Compose `DrawerHeader` inside a `Layout`, as
 * `DialogHeader` is composed in Dialog, so the header is not padded twice. The
 * root dialog stays the overlay boundary (`overlayPaddingReset`).
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/Drawer/Drawer.doc.mjs (props table, features, usage)
 * - /packages/core/src/Drawer/Drawer.test.tsx (tests for new/changed behavior)
 * - /packages/core/src/Drawer/__tests__/DrawerNonModalPageScroll.a11y.chromium.spec.ts (the page beside a non-modal drawer scrolls)
 * - /docs/specs/components/Drawer/Drawer.spec.md (component contract)
 * - /packages/core/src/Drawer/index.ts (exports if types change)
 * - /packages/cli/assets/templates/blocks/components/Drawer/ (showcase blocks)
 * - /apps/storybook/stories/Drawer.stories.tsx (examples and visual coverage)
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { BaseProps } from "@astryxdesign/core";
import type { DialogPurpose } from "@astryxdesign/core/Dialog";
import { useFocusTrap, useMergedRefs, useScrollLock } from "@astryxdesign/core/hooks";
import { LayerDepthProvider, useLayerDismissal } from "@astryxdesign/core/Layer";
import { composeEventHandlers, mergeProps, themeProps } from "@astryxdesign/core/utils";
import { container, overlayPaddingReset } from "@astryxdesign/core/Layout";
import { layerTextReset } from "@astryxdesign/core/Layer/layerTextReset.stylex";
import {
  containerPaddingBlockEndVarStyles,
  containerPaddingBlockStartVarStyles,
  containerPaddingInlineVarStyles,
  paddingStyles,
  spacingStepToToken,
} from "@astryxdesign/core/Layout/padding.stylex";
import type { SpacingStep, SpacingToken } from "@astryxdesign/core/Layout";

import { compiledStyles } from "../compiled";
import * as compiled from "./Drawer.styles";
import { NoFormItemContext } from "../../components/Form/context";
import { ModalPortalContext, modalZIndexBase } from "../../components/Modal/modalStack";
import { useDrawerDialogPresence } from "./useDrawerDialogPresence";

type PointerHandler = (event: React.PointerEvent<HTMLDialogElement>) => void;

// =============================================================================
// Styles
// =============================================================================

// Material's established mobile drawer pattern leaves a 56dp reveal. Using
// the same value in CSS pixels gives the overlay a stable visual relationship
// to the page behind while the requested width remains an upper bound.
const MOBILE_PAGE_REVEAL = 56;
const MOBILE_WIDTH_FULL = "100dvw";

// @astryxdesign/core dist/Drawer/Drawer.js `styles` and `dynamicStyles`, and
// dist/Layer/layerStructureReset.stylex.js, which core does not export.
const styles = compiledStyles(compiled.styles);
const layerStructureReset = compiledStyles(compiled.layerStructureReset);
const dynamicStyles = compiled.dynamicStyles as {
  inlineSize: (desktopWidth: string, mobileWidth: string) => StyleXStyles;
};

// ui-common: stacking for scrimless drawers, which open with `show()` and so
// need a z-index; modal drawers rely on the top layer's chronological order.
// Module-level; only mutated inside effects (SSR-safe). 1000 is the app-level
// drawer convention lab used before 0.6.5. A new drawer goes one above the
// highest OPEN one, so the value is bounded by how many are open at once, and
// it stays below the modal band so a Modal always paints over a drawer.
const NON_MODAL_BASE_Z = 1000;
const openNonModalDrawers = new Map<string, number>();

function registerNonModalDrawer(id: string): number {
  const highest = Math.max(NON_MODAL_BASE_Z - 1, ...openNonModalDrawers.values());
  const z = Math.min(highest + 1, modalZIndexBase() - 1);
  openNonModalDrawers.set(id, z);
  return z;
}

function unregisterNonModalDrawer(id: string): void {
  openNonModalDrawers.delete(id);
}
// @astryxdesign/core 0.7.7 src/hooks/useIsHydrating.ts, which core does not
// export: true during server render and the hydrating client render.
const subscribeNever = () => () => {};
function useIsHydrating(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => false,
    () => true,
  );
}

// @astryxdesign/core 0.7.7 src/hooks/useSettledOpen.ts, which core does not
// export: the open state as the server rendered it, until it first changes.
function useSettledOpen<T>(
  requested: T,
  current: T,
  none: T,
): [settled: T, release: () => void] {
  const isHydrating = useIsHydrating();
  const [settled, setSettled] = useState<T>(() => (isHydrating ? requested : none));
  if (settled !== none && !isHydrating && current !== settled) {
    setSettled(none);
  }
  const release = useCallback(() => setSettled(none), [none]);
  return [settled, release];
}

// @astryxdesign/core 0.7.7 src/Layer/useBackdropPress.ts, which core does not
// export: a backdrop press dismisses only when it starts and ends there.
function useBackdropPress(onBackdropPress: () => void, isEnabled: boolean) {
  const startedOnBackdropRef = useRef(false);
  const endedOnBackdropRef = useRef(false);
  const onPointerDownCapture = useCallback((event: React.PointerEvent<HTMLElement>) => {
    startedOnBackdropRef.current = event.target === event.currentTarget;
    endedOnBackdropRef.current = false;
  }, []);
  const onPointerUpCapture = useCallback((event: React.PointerEvent<HTMLElement>) => {
    endedOnBackdropRef.current =
      startedOnBackdropRef.current && event.target === event.currentTarget;
    startedOnBackdropRef.current = false;
  }, []);
  const onPointerCancelCapture = useCallback(() => {
    startedOnBackdropRef.current = false;
    endedOnBackdropRef.current = false;
  }, []);
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const pressWasOnBackdrop = endedOnBackdropRef.current;
      startedOnBackdropRef.current = false;
      endedOnBackdropRef.current = false;
      if (isEnabled && pressWasOnBackdrop && event.target === event.currentTarget) {
        onBackdropPress();
      }
    },
    [isEnabled, onBackdropPress],
  );
  return { onPointerDownCapture, onPointerUpCapture, onPointerCancelCapture, onClick };
}

// @astryxdesign/core 0.7.7 src/utils/chainEventHandlers.ts, which core does
// not export: every handler runs, in argument order.
function chainEventHandlers<E extends React.SyntheticEvent>(
  ...handlers: (((event: E) => void) | undefined)[]
): (event: E) => void {
  return (event: E) => {
    for (const handler of handlers) {
      handler?.(event);
    }
  };
}

// @astryxdesign/core 0.7.7 src/Layer/layerClickBoundary.ts and
// src/privateAttributes/layerRoot.stylex.ts, which core does not export: a
// press inside the drawer runs the drawer's handlers, then stops in the React
// tree (never natively), and the root carries the layer-root mark.
const BOUNDARY_EVENTS = [
  "onClick",
  "onAuxClick",
  "onDoubleClick",
  "onContextMenu",
  "onMouseDown",
  "onMouseUp",
  "onMouseMove",
  "onMouseOver",
  "onMouseOut",
  "onPointerDown",
  "onPointerUp",
  "onPointerMove",
  "onPointerOver",
  "onPointerOut",
  "onPointerCancel",
  "onGotPointerCapture",
  "onLostPointerCapture",
  "onTouchStart",
  "onTouchMove",
  "onTouchEnd",
  "onTouchCancel",
] as const;
type BoundaryEvent = (typeof BOUNDARY_EVENTS)[number];
type BoundaryHandler = (event: React.SyntheticEvent) => void;
const returnTrue = () => true;
function stopInReactTree(event: React.SyntheticEvent): void {
  event.isPropagationStopped = returnTrue;
}
function layerClickBoundary(
  own: Readonly<Record<string, unknown>> = {},
): Record<BoundaryEvent, BoundaryHandler> & Readonly<Record<`data-${string}`, string>> {
  const props: Partial<Record<BoundaryEvent, BoundaryHandler>> = {};
  for (const name of BOUNDARY_EVENTS) {
    const handler = own[name];
    props[name] =
      typeof handler === "function"
        ? (event) => {
            (handler as BoundaryHandler)(event);
            stopInReactTree(event);
          }
        : stopInReactTree;
  }
  return {
    ...(props as Record<BoundaryEvent, BoundaryHandler>),
    "data-astryx-layer-root": "",
  };
}

// =============================================================================
// Types
// =============================================================================

export interface DrawerProps extends BaseProps<HTMLDialogElement> {
  /** Ref forwarded to the root <dialog> element */
  ref?: React.Ref<HTMLDialogElement>;

  /**
   * Whether the drawer is open. Fully controlled — pair with `onOpenChange`.
   */
  isOpen: boolean;

  /**
   * Called when the drawer requests an open-state change. Escape and a scrim
   * click call it with `false` as `purpose` allows; a `DrawerHeader` close
   * button calls it when you pass the same callback to the header. The caller
   * owns the open state. When sibling drawers are open, Escape only closes the
   * top (last-opened) drawer.
   */
  onOpenChange: (isOpen: boolean) => void;

  /**
   * Which edge the drawer slides from.
   * - `'end'` — inline-end edge (right in LTR) — the inspector convention
   * - `'start'` — inline-start edge (left in LTR)
   * @default 'end'
   */
  side?: "start" | "end";

  /**
   * Desktop width budget. A number is pixels; a string is any CSS length
   * (`'50%'`, `'32rem'`). Below the mobile breakpoint (640px), this
   * remains the maximum while the drawer preserves a 56px reveal of the page
   * behind — see `experimental.isFullWidthOnMobile`.
   * @default 400
   */
  width?: number | string;

  /**
   * Experimental options, outside the stable compatibility promise: anything
   * in this object may change or be removed in a patch release. Omit it for
   * the stable behavior.
   * @experimental
   */
  experimental?: {
    /**
     * Cover the full viewport width on mobile (below 640px) instead of
     * preserving the default 56px reveal of the page behind. The reveal makes
     * the drawer read as an overlay rather than a navigation.
     * @experimental
     * @default false
     */
    isFullWidthOnMobile?: boolean;
  };

  /**
   * Accessible label for the drawer (required — the drawer has no
   * built-in heading to derive a name from).
   */
  label: string;

  /**
   * Whether to render a modal scrim behind the drawer.
   * - `true` (default) — `showModal()`: top layer, focus trap, body scroll
   *   lock, click-outside-to-close.
   * - `false` — `showPopover()`: non-modal top-layer overlay; the page behind
   *   stays interactive. Escape still closes through the shared layer stack.
   * @default true
   */
  hasScrim?: boolean;

  /**
   * Configures how the drawer enables dismissals, matching Dialog.
   * - required: Disables Escape and scrim click (for mandatory flows); a
   *   modal required drawer is exposed as an `alertdialog`
   * - form: Prevents scrim click, allows the Escape key
   * - info: Allows Escape and scrim click
   *
   * A non-modal drawer has no scrim, so `form` and `info` behave the same.
   * @default 'info'
   */
  purpose?: DialogPurpose;

  /**
   * Internal padding of the drawer content using the spacing scale, matching
   * Dialog. Accepts numeric spacing steps: 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8,
   * 10. When omitted, uses the theme default for drawers (`--spacing-4`, 16px,
   * unless the theme sets `padding` on `drawer`), as Dialog does. Pass `0` for
   * a full-bleed content area. The content area is a container: a Section that
   * is its only child escapes the padding, bleed children such as Table and
   * Divider compensate against it, and a Layout picks it up for its regions.
   */
  padding?: SpacingStep;

  /**
   * Drawer content. Rendered inside a full-height scrollable area.
   * Focus the element with `data-autofocus` on open, if present.
   */
  children: ReactNode;

  /**
   * Test ID for the root element.
   */
  "data-testid"?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * An overlay panel for inspectors and detail views.
 *
 * Slides in from the logical start or end edge and floats above the page
 * using the native `<dialog>` element: modal with a scrim by default, or a
 * non-modal overlay with `hasScrim={false}` that leaves the page behind
 * interactive. `width` is the desktop budget; below 640px the panel preserves
 * a 56px page reveal without exceeding that budget (or fills the viewport
 * with the experimental `experimental.isFullWidthOnMobile`). Escape
 * closes the top-most open drawer; focus returns to the element that
 * opened it.
 *
 * Dismissal matches Dialog: `purpose` decides whether Escape and a scrim click
 * close the drawer, and `DrawerHeader` renders a close button when given
 * `onOpenChange`.
 *
 * Like Dialog, the drawer is a container: `padding` (or a theme's `padding`
 * on `drawer`) insets the content area, a lone Section child escapes that
 * inset, and a Layout inside picks it up for its header, content, and footer
 * regions. The default inset is `--spacing-4`, matching Dialog.
 *
 * @example
 * ```
 * const [selected, setSelected] = useState(null);
 * const handleOpenChange = isOpen => !isOpen && setSelected(null);
 * <Drawer
 *   isOpen={selected != null}
 *   onOpenChange={handleOpenChange}
 *   label={`Details: ${selected?.name}`}>
 *   <Layout
 *     header={<DrawerHeader title={selected?.name} onOpenChange={handleOpenChange} />}
 *     content={<LayoutContent><HostDetails host={selected} /></LayoutContent>}
 *   />
 * </Drawer>
 * ```
 */
export function Drawer({
  isOpen: isOpenProp,
  onOpenChange,
  side = "end",
  width = 400,
  experimental,
  label,
  hasScrim = true,
  purpose = "info",
  padding,
  children,
  xstyle,
  className,
  style,
  onClick: onClickProp,
  onKeyDown: onKeyDownProp,
  ref,
  ...props
}: DrawerProps) {
  // A drawer open on the server renders closed until hydration, and opens in
  // the render after it, the first one that can enter its native host: a
  // <dialog> painted open with aria-modal before it is modal claims a state it
  // does not have (FR17).
  const isHydrating = useIsHydrating();
  const isOpen = isOpenProp && !isHydrating;
  // A drawer open on the server was present on page load, so it opens settled,
  // with no slide-in; its later opens and closes animate as usual
  // (spec:AST-013 FR13).
  const [settledOpen] = useSettledOpen(isOpenProp, isOpen, false);
  const opensSettled = settledOpen && isOpen;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { containerRef: focusTrapRef } = useFocusTrap<HTMLDialogElement>({
    isActive: isOpen && hasScrim,
  });
  const mergedDialogRef = useMergedRefs(ref, dialogRef, focusTrapRef);
  // Derive dismissal behavior from purpose, as Dialog does.
  const allowEscape = purpose !== "required";
  const allowScrimClick = purpose === "info";
  // Same lowering as Dialog: with no padding prop the content area reads the
  // theme's --astryx-drawer-padding chain (--spacing-4 when unset), else the
  // explicit step.
  const usesThemePadding = padding == null;
  const effectivePadding = padding ?? 4;
  const paddingToken = spacingStepToToken[effectivePadding] as SpacingToken;
  // Whether the panel paints: true while open and for the whole slide-out.
  const [isRendered, setIsRendered] = useState(isOpen);

  // Adjusted during render, not in an effect: the panel has to be rendered in
  // the same commit that targets the open transform, or @starting-style has
  // nothing to animate from.
  if (isOpen && !isRendered) {
    setIsRendered(true);
  }

  useDrawerDialogPresence({
    dialogRef,
    isOpen,
    isModal: hasScrim,
    setIsRendered,
  });

  // ui-common: the dialog a Modal inside renders into, set only once
  // showModal() has run (the effect above), so the Modal's popover enters the
  // top layer after the dialog and paints above it. A scrimless drawer is not
  // top layer (`show()`), so a body-portalled Modal already stacks above it.
  const [modalHost, setModalHost] = useState<HTMLDialogElement | null>(null);
  useEffect(() => {
    setModalHost(isOpen && hasScrim ? dialogRef.current : null);
  }, [isOpen, hasScrim]);

  // ui-common: a scrimless drawer's z-index, last opened on top.
  const drawerId = useId();
  const [stackZ, setStackZ] = useState(NON_MODAL_BASE_Z);
  // Held while the panel paints, slide-out included, so a drawer opened during
  // another's exit goes above it rather than taking the same value.
  useEffect(() => {
    if (!isRendered || hasScrim) return;
    setStackZ(registerNonModalDrawer(drawerId));
    return () => unregisterNonModalDrawer(drawerId);
  }, [isRendered, hasScrim, drawerId]);

  const handleDismiss = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // The shared stack owns Escape delivery across every overlay family. The
  // provider below gives layers opened from Drawer content a greater logical
  // depth even when they render elsewhere in the DOM or browser top layer.
  const { shouldDismissOnCloseRequest } = useLayerDismissal({
    // The native host stays present through the slide-out. Keep this entry on
    // the stack until the same commit that hides the host, so a second Escape
    // cannot fall through to a lower layer during the exit animation.
    isActive: isRendered,
    // A `required` drawer consumes Escape without closing, so the press cannot
    // fall through and dismiss a layer behind it either.
    escapeBehavior: allowEscape ? "close" : "block",
    onDismiss: handleDismiss,
    getContainer: () => dialogRef.current,
  });

  // Lock body scroll while a modal drawer is open (iOS Safari workaround).
  useScrollLock(isOpen && hasScrim);

  // A modal dialog's native cancel event is a platform close request (for
  // example Android Back). Keep controlled state authoritative and apply the
  // same top-most/IME rules as the shared Escape listener.
  const handleCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      // A cancel that bubbles up from inside (a dismissed file picker) is not
      // a close request; the platform's is fired at the dialog itself.
      if (event.target !== event.currentTarget) {
        return;
      }
      event.preventDefault();
      if (shouldDismissOnCloseRequest() && allowEscape) {
        handleDismiss();
      }
    },
    [allowEscape, handleDismiss, shouldDismissOnCloseRequest],
  );

  // A press on the ::backdrop targets the <dialog> itself (the content area
  // fills the panel). The press must start and end there.
  const handleScrimPress = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);
  const scrimPress = useBackdropPress(handleScrimPress, hasScrim && allowScrimClick);

  const widthValue = typeof width === "number" ? `${width}px` : width;
  const isFullWidthOnMobile = experimental?.isFullWidthOnMobile ?? false;
  const mobileWidth = isFullWidthOnMobile
    ? MOBILE_WIDTH_FULL
    : `min(${widthValue}, calc(100dvw - ${MOBILE_PAGE_REVEAL}px))`;

  // The side the panel is ANCHORED to, which is the side it must slide back
  // out to. Latched at open, because a consumer commonly derives `side` from
  // the same state that drives `isOpen` (`side={selected?.side ?? 'end'}`):
  // that state clears on close, so the live prop flips mid-exit and the panel
  // teleports to the other edge and slides out the wrong way. Children stay
  // mounted for the exit for the same reason; so does the anchor.
  const exitSideRef = useRef(side);
  if (isOpen) {
    exitSideRef.current = side;
  }
  const anchoredSide = isOpen ? side : exitSideRef.current;

  const sideStyle = anchoredSide === "start" ? styles.start : styles.end;
  const sideOpenStyle = anchoredSide === "start" ? styles.startOpen : styles.endOpen;

  // Filter out native `open` to prevent InvalidStateError when passed
  const { open: _open, ...safeProps } = props as Record<string, unknown>;

  return (
    <dialog
      ref={mergedDialogRef}
      {...mergeProps(
        themeProps("drawer", { side: anchoredSide }),
        stylex.props(
          layerTextReset.reset,
          layerStructureReset.reset,
          styles.dialog,
          overlayPaddingReset.reset,
          sideStyle,
          dynamicStyles.inlineSize(widthValue, mobileWidth),
          isRendered && styles.rendered,
          isOpen && sideOpenStyle,
          hasScrim && styles.scrim,
          hasScrim && isOpen && styles.scrimOpen,
          opensSettled && styles.openSettled,
          xstyle,
        ),
        className,
        // ui-common: the consumer's style may still override the stack.
        hasScrim ? style : { zIndex: stackZ, ...style },
      )}
      {...safeProps}
      aria-label={label}
      // ui-common: scrimless by itself is non-modal, but a consumer that
      // restores the modality by hand (a portal supplying its own mask and
      // focus trap) must be able to say so.
      aria-modal={
        (safeProps["aria-modal"] as React.AriaAttributes["aria-modal"]) ??
        (hasScrim && !isHydrating ? "true" : undefined)
      }
      {...(purpose === "required" && hasScrim ? { role: "alertdialog" } : undefined)}
      // Presses inside the drawer do not reach handlers around where it is
      // written.
      {...layerClickBoundary({
        ...safeProps,
        onClick: composeEventHandlers(onClickProp, scrimPress.onClick),
      })}
      // The hook records where the press started first. The caller's capture
      // handler then runs, also when a child prevented default.
      onPointerDownCapture={chainEventHandlers(
        scrimPress.onPointerDownCapture,
        safeProps.onPointerDownCapture as PointerHandler | undefined,
      )}
      onPointerUpCapture={chainEventHandlers(
        scrimPress.onPointerUpCapture,
        safeProps.onPointerUpCapture as PointerHandler | undefined,
      )}
      onPointerCancelCapture={chainEventHandlers(
        scrimPress.onPointerCancelCapture,
        safeProps.onPointerCancelCapture as PointerHandler | undefined,
      )}
      onKeyDown={onKeyDownProp}
      onCancel={handleCancel}
    >
      <LayerDepthProvider>
        {/* Scrollable content area — tabIndex so the dialog's focusing steps
            land on the panel body rather than the first button inside. */}
        <div
          tabIndex={-1}
          {...stylex.props(
            styles.content,
            ...container(
              usesThemePadding
                ? { useThemeDefault: "drawer" }
                : {
                    paddingInnerX: paddingToken,
                    paddingInnerY: paddingToken,
                    paddingOuterX: paddingToken,
                    paddingOuterY: paddingToken,
                  },
            ),
            !usesThemePadding &&
              effectivePadding !== 4 &&
              paddingStyles[effectivePadding],
            !usesThemePadding &&
              effectivePadding !== 4 &&
              containerPaddingInlineVarStyles[effectivePadding],
            !usesThemePadding &&
              effectivePadding !== 4 &&
              containerPaddingBlockStartVarStyles[effectivePadding],
            !usesThemePadding &&
              effectivePadding !== 4 &&
              containerPaddingBlockEndVarStyles[effectivePadding],
            styles.contentSafeArea,
          )}
        >
          <ModalPortalContext value={modalHost}>
            {/* ui-common: not part of a Form.Item it opens from. */}
            <NoFormItemContext>{children}</NoFormItemContext>
          </ModalPortalContext>
        </div>
      </LayerDepthProvider>
    </dialog>
  );
}

Drawer.displayName = "Drawer";
