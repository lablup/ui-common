/**
 * Modal
 *
 * ui-common's dialog. It replaces Astryx `Dialog`, which ui-common does not
 * re-export (exports.exclude.json), and takes every `Dialog` prop, so a
 * `Dialog` call site moves over by renaming the import.
 *
 * What it changes about `Dialog`:
 *
 * - **Portalled, not top layer.** The surface renders into a `document.body`
 *   portal instead of a native `<dialog>` promoted with `showModal()`. While
 *   it is open the page behind it is inert and the topmost surface is
 *   `aria-modal`, as `showModal()` would make them, but an element marked
 *   `MODAL_LIVE_ATTRIBUTE` (`NotificationStack` is) stays reachable, so
 *   notices stay visible and clickable over an open modal. Covered modal
 *   roots are inert too; see modalStack.ts.
 * - **Nesting.** A modal opened from inside another paints above it, and
 *   only the topmost one traps focus and answers Escape.
 * - **Content lifecycle.** Children mount on first open and stay mounted
 *   while closed, as a native `<dialog>`'s do. `unmountOnClose` drops them,
 *   and their state, on close. `afterOpenChange` reports each open and close.
 * - **Structure, when asked for.** With `title`, `onAction` or `footer`, the
 *   modal lays out a header (`ModalHeader`), the body, and a footer with a
 *   primary action and a Cancel button. Without them it renders `children`
 *   as they are, exactly like `Dialog`.
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Rename folder"
 *   actionLabel="Rename"
 *   onAction={async () => {
 *     await rename();
 *     setIsOpen(false);
 *   }}
 * >
 *   <TextInput label="Name" value={name} onChange={setName} />
 * </Modal>
 */
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import {
  Button,
  type ButtonProps,
  type ButtonVariant,
} from "@astryxdesign/core/Button";
import { Dialog, DialogHeader, type DialogProps } from "@astryxdesign/core/Dialog";
import type { DialogPosition } from "@astryxdesign/core/Dialog";
import { useFocusTrap, useScrollLock } from "@astryxdesign/core/hooks";
import { useLayerDismissal } from "@astryxdesign/core/Layer";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { dataAttr } from "@astryxdesign/core/naming";
import { HStack } from "@astryxdesign/core/Stack";
import { useThemeName } from "@astryxdesign/core/theme";
import { devWarn, isFocusDetached, mergeRefs } from "@astryxdesign/core/utils";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { SkeletonText } from "../Skeleton/SkeletonText";
import { MODAL_OPEN_ATTRIBUTE, useModalLevel } from "./modalStack";
import "./Modal.css";

const HEADING_SELECTOR = '[role="heading"], h1, h2, h3, h4, h5, h6';
const DIALOG_SELECTOR = 'dialog, [role="dialog"], [role="alertdialog"]';

/** Props for the primary action button, beyond what `Modal` sets itself. */
export type ModalActionButtonProps = Partial<
  Omit<ButtonProps, "label" | "variant" | "clickAction" | "onClick" | "ref">
>;

export interface ModalProps extends Omit<DialogProps, "ref" | "children"> {
  /** Ref to the element carrying `role="dialog"`: a `div`, not a `<dialog>`. */
  ref?: Ref<HTMLDivElement>;
  /** The body. Without `title`, `onAction` or `footer`, the whole surface. */
  children?: ReactNode;
  /**
   * Asks for a z-index inside the modal band. The stack still places a modal
   * opened later above this one, and a value outside the band is ignored.
   */
  zIndex?: number;
  /**
   * Called with the new visibility right after `isOpen` changes, never on
   * mount. There is no exit animation, so a close edge is the end of the
   * close.
   */
  afterOpenChange?: (isOpen: boolean) => void;
  /** Unmount the content, and drop its state, when the modal closes. */
  unmountOnClose?: boolean;

  /** Header title. Names the dialog. A node is rendered as given. */
  title?: ReactNode;
  /** Secondary line under the title. */
  subtitle?: string;
  /** Content before the title, e.g. a back button. */
  headerStartContent?: ReactNode;
  /** Content after the title, before the close button. */
  headerEndContent?: ReactNode;
  /** Whether the header shows a close button. Default: true */
  hasCloseButton?: boolean;
  /** Class name on the generated header, for a product's own header geometry. */
  headerClassName?: string;

  /**
   * Replaces the generated footer. `null` removes the footer. Left
   * `undefined`, a footer is generated when `onAction` is set.
   */
  footer?: ReactNode | null;
  /** Primary action. Returning a promise shows the button pending until it settles. It does not close the modal. */
  onAction?: () => unknown;
  /** Primary action label. Default: the catalog's `uic.common.ok` ("OK") */
  actionLabel?: string;
  /** Primary action variant. Default: "primary" */
  actionVariant?: ButtonVariant;
  /** Shows the primary action as pending, for work the modal does not await. */
  isActionLoading?: boolean;
  /** Disables the primary action. */
  isActionDisabled?: boolean;
  /** More props for the primary action button (`type`, `form`, `icon`, ...). */
  actionButtonProps?: ModalActionButtonProps;
  /** Cancel label. Default: the catalog's `uic.common.cancel` ("Cancel") */
  cancelLabel?: string;
  /** Whether the generated footer has a Cancel button. Default: true */
  hasCancelButton?: boolean;
  /** Class name on the generated footer. */
  footerClassName?: string;
  /** Shows a text skeleton in place of the body. */
  isLoading?: boolean;
}

/** Restores focus to the opener if focus was lost with the dialog. */
function restoreTriggerFocus(trigger: HTMLElement | null, root: HTMLElement | null) {
  const focusWasLost =
    isFocusDetached() || root?.contains(document.activeElement) === true;
  if (focusWasLost && trigger?.isConnected) trigger.focus();
}

/** The dialog's own title, never a heading of a dialog nested inside it. */
function findDialogTitle(node: HTMLElement): HTMLElement | null {
  for (const heading of node.querySelectorAll<HTMLElement>(HEADING_SELECTOR)) {
    if (heading.closest(DIALOG_SELECTOR) === node) return heading;
  }
  return null;
}

/**
 * Trigger → viewport-centre direction, for the entry motion.
 * SYNC: mirrors `getDialogDirection` in `@astryxdesign/core/Dialog/Dialog`,
 * which is not exported; diff it on an Astryx bump.
 */
function getDialogDirection(triggerEl: HTMLElement, distance = 16) {
  const rect = triggerEl.getBoundingClientRect();
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: Math.round((dx / dist) * distance),
    y: Math.round((dy / dist) * distance),
  };
}

function toCssLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Logical `start`/`end` become `inset-inline-*`; unset offsets are `auto`.
 * SYNC: mirrors `resolveDialogPositionOffsets` in `@astryxdesign/core/Dialog`.
 */
function resolvePosition(position: Readonly<DialogPosition>): CSSProperties {
  const { top, bottom, start, end } = position;
  return {
    top: top !== undefined ? toCssLength(top) : "auto",
    bottom: bottom !== undefined ? toCssLength(bottom) : "auto",
    insetInlineStart: start !== undefined ? toCssLength(start) : "auto",
    insetInlineEnd: end !== undefined ? toCssLength(end) : "auto",
  };
}

export function Modal({
  isOpen,
  onOpenChange,
  isInline = false,
  width = 400,
  maxHeight,
  position,
  variant = "standard",
  purpose = "info",
  padding,
  zIndex,
  afterOpenChange,
  unmountOnClose = false,
  title,
  subtitle,
  headerStartContent,
  headerEndContent,
  hasCloseButton = true,
  headerClassName,
  footer,
  onAction,
  actionLabel,
  actionVariant = "primary",
  isActionLoading,
  isActionDisabled,
  actionButtonProps,
  cancelLabel,
  hasCancelButton = true,
  footerClassName,
  isLoading = false,
  role,
  children,
  xstyle,
  className,
  style,
  ref,
  ...rest
}: ModalProps) {
  const t = useUicTranslator();

  // Content mounts on the first open and then follows `unmountOnClose`.
  const [hasOpened, setHasOpened] = useState(isOpen);
  if (isOpen && !hasOpened) setHasOpened(true);
  const isMounted = isOpen || (hasOpened && !unmountOnClose);

  const wasOpenRef = useRef(isOpen);
  const notifyOpenChange = useEffectEvent((open: boolean) => afterOpenChange?.(open));
  useEffect(() => {
    if (wasOpenRef.current === isOpen) return;
    wasOpenRef.current = isOpen;
    notifyOpenChange(isOpen);
    // An effect event is not a dependency; this plugin version predates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Theme CSS is scoped to `[data-astryx-theme]`, and the portal leaves the
  // themed subtree, so the root re-emits the nearest theme's name.
  const themeName = useThemeName();

  const allowEscape = purpose !== "required";
  const allowBackdropClick = purpose === "info";
  const hasConsumerName = rest["aria-label"] != null || rest["aria-labelledby"] != null;
  const titleId = useId();

  const close = () => onOpenChange(false);

  const rootRef = useRef<HTMLDivElement>(null);
  // Captured before the level stack inerts the covering root, which blurs
  // whatever that subtree held.
  const triggerRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (isOpen && !isInline) {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
  }, [isOpen, isInline]);

  const isActive = isOpen && !isInline;
  const isTopmost = useModalLevel(rootRef, isActive, zIndex);

  const { containerRef, focusFirst } = useFocusTrap<HTMLDivElement>({
    isActive: isActive && isTopmost,
  });

  // Escape goes through Astryx's shared layer stack, which routes one press
  // to the top-most layer: a popover inside the modal closes alone.
  useLayerDismissal({
    isActive,
    escapeBehavior: allowEscape ? "close" : "block",
    onDismiss: close,
    getContainer: () => containerRef.current,
  });

  // Passive, not layout: React restores the selection it captured before the
  // commit at the end of the mutation phase, undoing an earlier focus move.
  useEffect(() => {
    if (!isActive) return;
    const root = rootRef.current;
    return () => {
      restoreTriggerFocus(triggerRef.current, root);
      triggerRef.current = null;
    };
  }, [isActive]);

  useScrollLock(isActive);

  // `Dialog isInline` provides the context `ModalHeader` renders its title id
  // from, but nothing points the surface at it. This does.
  useEffect(() => {
    const node = containerRef.current;
    if (!isActive || !node || hasConsumerName) return;
    const heading = findDialogTitle(node);
    if (!heading) {
      node.removeAttribute("aria-labelledby");
      return;
    }
    if (!heading.id) heading.id = titleId;
    node.setAttribute("aria-labelledby", heading.id);
  });

  // Entry motion from the trigger's direction, set before first paint.
  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!isActive || !node) return;
    const trigger = triggerRef.current;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && trigger instanceof HTMLElement && trigger !== document.body) {
      const { x, y } = getDialogDirection(trigger);
      node.style.setProperty("--uic-modal-dir-x", `${x}px`);
      node.style.setProperty("--uic-modal-dir-y", `${y}px`);
    }
    return () => {
      node.style.removeProperty("--uic-modal-dir-x");
      node.style.removeProperty("--uic-modal-dir-y");
    };
  }, [isActive, containerRef]);

  // `[data-autofocus]` wins, then the title, then the first focusable.
  useEffect(() => {
    const node = containerRef.current;
    if (!isActive || !node) return;
    const target =
      node.querySelector<HTMLElement>("[data-autofocus]") ?? findDialogTitle(node);
    target?.focus();
    if (document.activeElement !== target) focusFirst();
  }, [isActive, containerRef, focusFirst]);

  const hasWarnedRef = useRef(false);
  useEffect(() => {
    const node = containerRef.current;
    if (!isActive || hasConsumerName || hasWarnedRef.current || !node) return;
    if (findDialogTitle(node) != null) return;
    hasWarnedRef.current = true;
    devWarn(
      "Modal",
      "open modal has no accessible name. Pass `title`, render a ModalHeader, " +
        "or pass `aria-label`/`aria-labelledby`.",
    );
  }, [isActive, hasConsumerName, containerRef]);

  const maskRef = useRef<HTMLDivElement>(null);
  const pointerDownOnMaskRef = useRef(false);
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    pointerDownOnMaskRef.current = event.target === maskRef.current;
  };
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    // A drag that started inside the surface must not dismiss it.
    const isBackdropClick =
      pointerDownOnMaskRef.current && event.target === maskRef.current;
    pointerDownOnMaskRef.current = false;
    if (isBackdropClick && allowBackdropClick) close();
  };

  // ------------------------------------------------------------------ body
  const isStructured =
    title !== undefined || onAction !== undefined || footer !== undefined;

  const generatedFooter =
    onAction !== undefined ? (
      <HStack justify="end" align="center" gap={2}>
        {hasCancelButton && (
          <Button
            variant="secondary"
            label={cancelLabel ?? t("uic.common.cancel")}
            onClick={close}
          />
        )}
        <Button
          {...actionButtonProps}
          variant={actionVariant}
          label={actionLabel ?? t("uic.common.ok")}
          isLoading={isActionLoading ?? actionButtonProps?.isLoading}
          isDisabled={isActionDisabled ?? actionButtonProps?.isDisabled}
          clickAction={async () => {
            await onAction();
          }}
        />
      </HStack>
    ) : null;
  const resolvedFooter = footer === undefined ? generatedFooter : footer;

  const body = isLoading ? <SkeletonText lines={4} /> : children;

  const content = isStructured ? (
    <Layout
      header={
        title !== undefined || headerStartContent || headerEndContent ? (
          <DialogHeader
            hasDivider
            // `title` is typed string but renders through `Heading`, whose
            // children are a node; the cast keeps DialogHeader's a11y wiring.
            title={(title ?? "") as unknown as string}
            subtitle={subtitle}
            startContent={headerStartContent}
            endContent={headerEndContent}
            onOpenChange={hasCloseButton ? (next) => !next && close() : undefined}
            className={headerClassName}
          />
        ) : undefined
      }
      content={<LayoutContent>{body}</LayoutContent>}
      footer={
        resolvedFooter ? (
          <LayoutFooter hasDivider className={footerClassName}>
            {resolvedFooter}
          </LayoutFooter>
        ) : undefined
      }
    />
  ) : (
    body
  );

  if (isInline) {
    return (
      <Dialog
        {...rest}
        isInline
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        width={width}
        maxHeight={maxHeight}
        variant={variant}
        purpose={purpose}
        padding={padding}
        xstyle={xstyle}
        className={className}
        style={style}
      >
        {content}
      </Dialog>
    );
  }

  if (!isMounted || typeof document === "undefined") return null;

  const isFullscreen = variant === "fullscreen";
  const hasPosition = position != null && !isFullscreen;

  return createPortal(
    <div
      ref={rootRef}
      className={["uic-modal", !isOpen && "uic-modal--closed"]
        .filter(Boolean)
        .join(" ")}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      {...{
        [MODAL_OPEN_ATTRIBUTE]: isOpen ? "" : undefined,
        [dataAttr("theme")]: themeName ?? undefined,
      }}
    >
      <div ref={maskRef} className="uic-modal__mask" />
      <div
        {...(rest as HTMLAttributes<HTMLDivElement>)}
        ref={mergeRefs<HTMLDivElement>(ref, containerRef)}
        className={["uic-modal__wrap", hasPosition && "uic-modal__wrap--positioned"]
          .filter(Boolean)
          .join(" ")}
        // `width` sizes the wrap so a percentage resolves against the
        // viewport, not the surface. `maxHeight` stays on the surface, which
        // also feeds it to its scroll container.
        style={{
          ...(hasPosition ? resolvePosition(position) : null),
          width: isFullscreen ? undefined : toCssLength(width),
        }}
        role={
          isOpen
            ? (role ?? (purpose === "required" ? "alertdialog" : "dialog"))
            : undefined
        }
        // True: modalStack makes everything outside inert, except what is
        // marked MODAL_LIVE_ATTRIBUTE (a notification stack).
        aria-modal={isOpen && isTopmost ? true : undefined}
      >
        <Dialog
          isInline
          isOpen
          onOpenChange={onOpenChange}
          width="100%"
          maxHeight={maxHeight}
          variant={variant}
          padding={padding}
          xstyle={xstyle}
          className={className}
          style={style}
        >
          {content}
        </Dialog>
      </div>
    </div>,
    document.body,
  );
}

Modal.displayName = "Modal";
