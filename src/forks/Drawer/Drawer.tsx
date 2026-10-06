// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/lab 0.6.5-canary.8701623, src/Drawer/Drawer.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * Drawer, ui-common's copy of Astryx lab's, with two changes (not upstream):
 *
 * - **`aria-modal` passes through.** A scrimless drawer is non-modal, but a
 *   consumer that restores modality by hand (its own mask and focus trap) can
 *   now say so; the default is unchanged.
 * - **ui-common's `Modal` opens above it.** A scrimmed drawer is a modal
 *   `<dialog>`, which makes everything outside it inert, so a `Modal`
 *   portalled to the body sat behind the drawer, unreachable. The drawer
 *   provides its dialog through `ModalPortalContext` while it is open and
 *   modal, and a `Modal` inside renders there, in the top layer
 *   (modalStack.ts). Core's `Dialog` needs none of this: it is top layer
 *   itself, and ui-common's `Modal` is not.
 *
 * Escape routing is upstream's since lab 0.6.5: the drawer registers with
 * core's layer-dismissal stack, so a popover, selector or modal opened inside
 * it closes first and nested drawers close top-first. Everything else is
 * upstream's too. Its style namespaces are Astryx's compiled output
 * (src/forks/compiled.ts).
 *
 * Delete this fork, and its exports.exclude.json entry, once lab passes
 * `aria-modal` through and `Modal` no longer needs the portal host
 * (CONTRIBUTING, "Forks of Astryx components").
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
 * by the requested width (or fills the viewport with `isFullWidthOnMobile`).
 *
 * Uses the native `<dialog>` element (same precedent as Dialog/MobileNav):
 * - `showModal()` when `hasScrim` (default) — top-layer rendering, focus
 *   trapping, `::backdrop`, no z-index management.
 * - `showPopover()` when `hasScrim={false}` — non-modal top-layer overlay;
 *   the page behind stays interactive (e.g. master-detail inspectors).
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
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { BaseProps } from "@astryxdesign/core";
import type { DialogPurpose } from "@astryxdesign/core/Dialog";
import { useFocusTrap, useMergedRefs, useScrollLock } from "@astryxdesign/core/hooks";
import { LayerDepthProvider, useLayerDismissal } from "@astryxdesign/core/Layer";
import { composeEventHandlers, mergeProps, themeProps } from "@astryxdesign/core/utils";
import { overlayPaddingReset } from "@astryxdesign/core/Layout";

import { compiledStyles } from "../compiled";
import * as compiled from "./Drawer.styles";
import { ModalPortalContext } from "../../components/Modal/modalStack";
import { useDrawerDialogPresence } from "./useDrawerDialogPresence";

// =============================================================================
// Styles
// =============================================================================

// Material's established mobile drawer pattern leaves a 56dp reveal. Using
// the same value in CSS pixels gives the overlay a stable visual relationship
// to the page behind while the requested width remains an upper bound.
const MOBILE_PAGE_REVEAL = 56;
const MOBILE_WIDTH_FULL = "100dvw";

// @astryxdesign/lab dist/Drawer/Drawer.js `styles` and `dynamicStyles`.
const styles = compiledStyles(compiled.styles);
const dynamicStyles = compiled.dynamicStyles as {
  inlineSize: (desktopWidth: string, mobileWidth: string) => StyleXStyles;
};

// Upstream's `content` style, which its compiler folded into this class list
// (dist/Drawer/Drawer.js).
const CONTENT_CLASS_NAME =
  "x1iyjqo2 x2lwn1j xh8yej3 x1odjw0f x6ikm8r xish69e xx69xxh x1a148e8 x1a2a7pz";

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
   * behind — see `isFullWidthOnMobile`.
   * @default 400
   */
  width?: number | string;

  /**
   * Whether the drawer covers the full viewport width on mobile
   * (below 640px) instead of preserving the default 56px reveal of the page
   * behind. The reveal makes the drawer read as an overlay rather than a
   * navigation.
   * @default false
   */
  isFullWidthOnMobile?: boolean;

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
 * with `isFullWidthOnMobile`). Escape
 * closes the top-most open drawer; focus returns to the element that
 * opened it.
 *
 * Dismissal matches Dialog: `purpose` decides whether Escape and a scrim click
 * close the drawer, and `DrawerHeader` renders a close button when given
 * `onOpenChange`.
 *
 * @example
 * ```
 * const [selected, setSelected] = useState(null);
 * const handleOpenChange = isOpen => !isOpen && setSelected(null);
 * <Drawer
 *   isOpen={selected != null}
 *   onOpenChange={handleOpenChange}
 *   label={`Details: ${selected?.name}`}>
 *   <DrawerHeader title={selected?.name} onOpenChange={handleOpenChange} />
 *   <HostDetails host={selected} />
 * </Drawer>
 * ```
 */
export function Drawer({
  isOpen,
  onOpenChange,
  side = "end",
  width = 400,
  isFullWidthOnMobile = false,
  label,
  hasScrim = true,
  purpose = "info",
  children,
  xstyle,
  className,
  style,
  onClick: onClickProp,
  onKeyDown: onKeyDownProp,
  ref,
  ...props
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { containerRef: focusTrapRef } = useFocusTrap<HTMLDialogElement>({
    isActive: isOpen && hasScrim,
  });
  const mergedDialogRef = useMergedRefs(ref, dialogRef, focusTrapRef);
  // Derive dismissal behavior from purpose, as Dialog does.
  const allowEscape = purpose !== "required";
  const allowScrimClick = purpose === "info";
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
  // top layer after the dialog and paints above it.
  const [modalHost, setModalHost] = useState<HTMLDialogElement | null>(null);
  useEffect(() => {
    setModalHost(isOpen && hasScrim ? dialogRef.current : null);
  }, [isOpen, hasScrim]);

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
      event.preventDefault();
      if (shouldDismissOnCloseRequest() && allowEscape) {
        handleDismiss();
      }
    },
    [allowEscape, handleDismiss, shouldDismissOnCloseRequest],
  );

  // Clicks on the ::backdrop target the <dialog> element itself; clicks on
  // drawer content always target a child (the content area fills the panel).
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget && hasScrim && allowScrimClick) {
        onOpenChange(false);
      }
    },
    [allowScrimClick, hasScrim, onOpenChange],
  );

  const widthValue = typeof width === "number" ? `${width}px` : width;
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
          styles.dialog,
          overlayPaddingReset.reset,
          sideStyle,
          dynamicStyles.inlineSize(widthValue, mobileWidth),
          isRendered && styles.rendered,
          isOpen && sideOpenStyle,
          hasScrim && styles.scrim,
          hasScrim && isOpen && styles.scrimOpen,
          xstyle,
        ),
        className,
        style,
      )}
      {...safeProps}
      popover={hasScrim ? undefined : "manual"}
      aria-label={label}
      // ui-common: scrimless by itself is non-modal, but a consumer that
      // restores the modality by hand (a portal supplying its own mask and
      // focus trap) must be able to say so.
      aria-modal={
        (safeProps["aria-modal"] as React.AriaAttributes["aria-modal"]) ??
        (hasScrim ? "true" : undefined)
      }
      {...(purpose === "required" && hasScrim ? { role: "alertdialog" } : undefined)}
      onClick={composeEventHandlers(onClickProp, handleClick)}
      onKeyDown={onKeyDownProp}
      onCancel={handleCancel}
    >
      <LayerDepthProvider>
        {/* Scrollable content area — tabIndex so the dialog's focusing steps
            land on the panel body rather than the first button inside. */}
        <div tabIndex={-1} className={CONTENT_CLASS_NAME}>
          <ModalPortalContext value={modalHost}>{children}</ModalPortalContext>
        </div>
      </LayerDepthProvider>
    </dialog>
  );
}

Drawer.displayName = "Drawer";
