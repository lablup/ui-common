/**
 * NotificationStack
 *
 * Floating notices stacked in the bottom-end corner, newest nearest the
 * corner. Each notice is an Astryx `Banner` that can carry what a toast
 * cannot: background-task progress (determinate or not), Cancel / Retry and a
 * navigation action, a collapsible detail, and a body of the caller's own.
 *
 * It is presentational. The caller owns the list: it adds notices, removes
 * them in `onClose`, and updates a notice in place under the same `key`.
 *
 * - `duration` closes a notice after that many seconds; the countdown pauses
 *   while the notice is hovered or holds focus. `null` or `0` keeps it open.
 * - An error notice opens its detail (`children`) up front; the reader's own
 *   toggle wins after that.
 * - `maxVisible` caps how many render; the newest win, and the rest render as
 *   room frees up.
 * - Removed notices slide out before they unmount, unless the reader asked
 *   for reduced motion.
 * - A long description scrolls inside its notice, so the dismiss button stays
 *   on screen; the stack scrolls once it reaches the top inset.
 *
 * Layout hooks, set on the stack or an ancestor:
 * `--uic-notification-stack-z` (stacking order, default 11000, one above
 * `Modal`'s default band), `--uic-notification-stack-inset-top` (space kept
 * free above the stack, such as an app header, default 0) and
 * `--uic-notification-body-max-height` (one notice's scroll cap, default 30vh).
 *
 * e2e hooks: each notice carries `data-notification-key`, `data-status` and
 * `data-paused`; its title and description carry `data-testid`
 * `notification-title` and `notification-description`.
 *
 * @example
 * <NotificationStack
 *   notifications={[{ key: "upload", title: "Uploading", percent: 40 }]}
 *   onClose={(key) => remove(key)}
 * />
 */
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type Key,
  type ReactNode,
} from "react";
import { Banner, type BannerStatus } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { MODAL_LIVE_ATTRIBUTE, refreshModalBackground } from "../Modal/modalStack";
import "./NotificationStack.css";

/** Matches the exit animation's budget in NotificationStack.css. */
const EXIT_ANIMATION_MS = 200;

export interface NotificationStackItem {
  key: Key;
  /** Headline. */
  title: ReactNode;
  description?: ReactNode;
  /** Drives the Banner's icon and colour. @default 'info' */
  status?: BannerStatus;
  /** Background-task progress, 0-100. Omit for a notice with no task. */
  percent?: number;
  /** A task that is running with no measurable progress yet. */
  isProgressIndeterminate?: boolean;
  /**
   * Accessible name of the progress bar.
   * @default the title when it is a string, else the catalog's uic.NotificationStack.progress
   */
  progressLabel?: string;
  /** Label of the navigation action ("View folder"). Shown with `onAction`. */
  actionText?: string;
  onAction?: () => void;
  /** @default the catalog's uic.common.retry ("Retry") */
  retryText?: string;
  onRetry?: () => void;
  /** @default the catalog's uic.common.cancel ("Cancel") */
  cancelText?: string;
  onCancel?: () => void;
  /**
   * Seconds until the notice closes itself; `null` or `0` keeps it open until
   * dismissed. The countdown pauses while the notice is hovered or focused.
   */
  duration?: number | null;
  /** @default true */
  isClosable?: boolean;
  /** Overrides the status icon. */
  icon?: ReactNode;
  /** A complete notice body that replaces the title, description and progress. */
  content?: ReactNode;
  /** Collapsible detail below the header. */
  children?: ReactNode;
}

export interface NotificationStackProps {
  /** Oldest first; the last entry renders nearest the corner. */
  notifications: Array<NotificationStackItem>;
  /** Fired by the close button and by the auto-close timer. */
  onClose?: (key: Key) => void;
  /** Cap on simultaneously visible notices; the newest win. Unlimited when unset. */
  maxVisible?: number;
  /** Extra class names on the stack. */
  className?: string;
  "data-testid"?: string;
}

function NotificationStackItemView({
  item,
  isExiting,
  onClose,
}: {
  item: NotificationStackItem;
  isExiting: boolean;
  onClose?: (key: Key) => void;
}) {
  const t = useUicTranslator();
  const { key, duration } = item;

  // The timer must not restart when the parent re-creates `onClose`, but
  // firing must still see the latest one.
  const fireClose = useEffectEvent(() => onClose?.(key));

  // A notice that closes under the pointer the reader moved there to read it
  // is lost; focus counts too, so keyboard users get the same reprieve.
  const [isPaused, setIsPaused] = useState(false);

  // Derived, not a default: a task is updated in place under the same key
  // (pending, then failed), so the item never remounts. `null` means the
  // reader has not touched the disclosure, so it follows the status.
  const isError = (item.status ?? "info") === "error";
  const [detailOpenByUser, setDetailOpenByUser] = useState<boolean | null>(null);
  const isDetailOpen = detailOpenByUser ?? isError;

  // `0` means "stay open", not "close immediately".
  const autoCloseMs =
    typeof duration === "number" && duration > 0 ? duration * 1000 : null;
  // What is left of the countdown, banked by the timer effect's cleanup so a
  // pause and resume continues rather than restarts.
  const remainingMsRef = useRef<number | null>(autoCloseMs);

  // A new duration is a new budget. Cleanups run before effects, so this
  // lands after the timer's cleanup banked the old value and before the timer
  // below reads it.
  useEffect(() => {
    remainingMsRef.current = autoCloseMs;
  }, [autoCloseMs]);

  useEffect(() => {
    if (autoCloseMs === null || isExiting || isPaused) return;
    const budget = remainingMsRef.current ?? autoCloseMs;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => fireClose(), budget);
    return () => {
      window.clearTimeout(timer);
      remainingMsRef.current = Math.max(0, budget - (Date.now() - startedAt));
    };
    // An effect event is not a dependency; this plugin version predates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCloseMs, isExiting, isPaused]);

  const hasProgress =
    item.percent !== undefined || item.isProgressIndeterminate === true;
  const hasActions = !!(item.onCancel || item.onRetry || item.onAction);
  const hasOwnContent = item.content != null;

  // `wrap` lets the buttons stack inside the end area of a narrow notice
  // instead of pushing the header wider.
  const actions = (
    <HStack gap={2} align="center" justify="end" wrap="wrap">
      {item.onCancel ? (
        <Button
          size="sm"
          variant="ghost"
          label={item.cancelText ?? t("uic.common.cancel")}
          onClick={item.onCancel}
        />
      ) : null}
      {item.onRetry ? (
        <Button
          size="sm"
          variant="secondary"
          label={item.retryText ?? t("uic.common.retry")}
          onClick={item.onRetry}
        />
      ) : null}
      {item.onAction && item.actionText ? (
        <Button
          size="sm"
          variant="ghost"
          label={item.actionText}
          onClick={item.onAction}
        />
      ) : null}
    </HStack>
  );

  return (
    <div
      className="uic-notification-stack__item"
      data-exiting={isExiting ? "true" : "false"}
      data-notification-key={String(key)}
      data-status={item.status ?? "info"}
      data-paused={isPaused ? "true" : "false"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      // React's onFocus/onBlur are the delegated focusin/focusout pair, so
      // focus anywhere inside the notice counts.
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <Banner
        status={item.status ?? "info"}
        title={
          hasOwnContent ? (
            item.content
          ) : (
            <span data-testid="notification-title">{item.title}</span>
          )
        }
        icon={item.icon}
        // Banner is normally in flow; a floating notice needs a shadow.
        elevation="high"
        isDismissable={item.isClosable ?? true}
        onDismiss={() => onClose?.(key)}
        endContent={hasActions ? actions : undefined}
        collapsible={{
          isOpen: isDetailOpen,
          onOpenChange: setDetailOpenByUser,
        }}
        description={
          hasOwnContent ? undefined : item.description || hasProgress ? (
            <VStack gap={2} align="stretch">
              {/* The text scrolls; a progress bar outside it stays pinned. */}
              {item.description ? (
                <div className="uic-notification-stack__body">
                  {typeof item.description === "string" ? (
                    <Text type="supporting">
                      <span data-testid="notification-description">
                        {item.description}
                      </span>
                    </Text>
                  ) : (
                    item.description
                  )}
                </div>
              ) : null}
              {hasProgress ? (
                <ProgressBar
                  value={item.percent ?? 0}
                  max={100}
                  // Hidden: the Banner title already names the task on screen.
                  label={
                    item.progressLabel ??
                    (typeof item.title === "string"
                      ? item.title
                      : t("uic.NotificationStack.progress"))
                  }
                  isLabelHidden
                  hasValueLabel={!item.isProgressIndeterminate}
                  isIndeterminate={item.isProgressIndeterminate}
                />
              ) : null}
            </VStack>
          ) : undefined
        }
      >
        {/* A bare string would take Banner's base size and tower over the
            description, so it gets the description's treatment. */}
        {item.children ? (
          <div className="uic-notification-stack__body">
            {typeof item.children === "string" ? (
              <Text type="supporting">{item.children}</Text>
            ) : (
              item.children
            )}
          </div>
        ) : null}
      </Banner>
    </div>
  );
}

export function NotificationStack({
  notifications,
  onClose,
  maxVisible,
  className,
  "data-testid": testId,
}: NotificationStackProps) {
  // Notices that left `notifications` but are still playing their exit.
  const [exiting, setExiting] = useState<Array<NotificationStackItem>>([]);
  const previousVisibleRef = useRef<Array<NotificationStackItem>>([]);
  const stackRef = useRef<HTMLDivElement>(null);

  const visible = maxVisible ? notifications.slice(-maxVisible) : notifications;
  const newestKey = notifications.at(-1)?.key;

  // Once the stack is capped it scrolls, and the newest notice is at the
  // scrolled end. Keyed on the newest notice, not the array: a running task
  // rebuilds the array constantly and would yank a reader back down.
  useEffect(() => {
    const el = stackRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [newestKey]);

  useEffect(() => {
    const currentKeys = new Set(notifications.map((n) => n.key));
    // Only a notice that was on screen animates out; one closed while hidden
    // behind `maxVisible` would otherwise flash into the corner.
    const removed = previousVisibleRef.current.filter((n) => !currentKeys.has(n.key));
    previousVisibleRef.current = visible;
    if (removed.length === 0) return;
    setExiting((prev) => [...prev, ...removed]);
    const timer = window.setTimeout(() => {
      const removedKeys = new Set(removed.map((n) => n.key));
      setExiting((prev) => prev.filter((n) => !removedKeys.has(n.key)));
    }, EXIT_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [notifications, visible]);

  const visibleKeys = new Set(visible.map((n) => n.key));
  const stillExiting = exiting.filter((n) => !visibleKeys.has(n.key));

  const isRendered = visible.length > 0 || stillExiting.length > 0;
  // The stack is marked to stay reachable over an open Modal; the modal stack
  // re-reads the mark whenever the stack appears or goes.
  useLayoutEffect(() => {
    refreshModalBackground();
    return () => queueMicrotask(refreshModalBackground);
  }, [isRendered]);

  if (!isRendered) return null;

  return (
    <div
      ref={stackRef}
      className={["uic-notification-stack", className].filter(Boolean).join(" ")}
      data-testid={testId}
      {...{ [MODAL_LIVE_ATTRIBUTE]: "" }}
      // Each Banner announces itself; the container stays out of the tree.
      role="presentation"
    >
      {stillExiting.map((item) => (
        <NotificationStackItemView
          key={item.key}
          item={item}
          isExiting
          onClose={onClose}
        />
      ))}
      {visible.map((item) => (
        <NotificationStackItemView
          key={item.key}
          item={item}
          isExiting={false}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

NotificationStack.displayName = "NotificationStack";
