/**
 * ConfirmPopover
 *
 * A one-click confirmation anchored to its trigger: a question, an optional
 * supporting line, Cancel and a confirm action. For reversible actions
 * (deactivate, restore, reset a form). An action that cannot be undone
 * belongs in a Modal that asks the user to type what they are deleting.
 *
 * - `onAction` may return a promise. The action button shows its pending
 *   state (Astryx `clickAction`) and the popover closes once it resolves. A
 *   rejection does not close it; the error propagates as `clickAction`'s
 *   does.
 * - Cancel comes first and takes focus on open, so an accidental Enter backs
 *   out. Focus returns to the trigger on close.
 * - `children` is the trigger, as on `Popover`. Its render-prop form keeps
 *   the trigger a direct child of its parent (a `ButtonGroup` needs that).
 *
 * @example
 * <ConfirmPopover
 *   title="Deactivate this key?"
 *   actionLabel="Deactivate"
 *   actionVariant="destructive"
 *   onAction={() => deactivate(key.id)}
 * >
 *   <Button label="Deactivate" />
 * </ConfirmPopover>
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "@astryxdesign/core/Button";
import { Popover, type PopoverProps } from "@astryxdesign/core/Popover";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

import { useUicTranslator } from "../../i18n/useUicTranslator";

export interface ConfirmPopoverProps extends Omit<PopoverProps, "content" | "label"> {
  /** The question. A string renders as the heading line. */
  title: ReactNode;
  /** Supporting line under the title. */
  description?: ReactNode;
  /** Leading glyph beside the title. */
  icon?: ReactNode;
  /**
   * Runs on confirm, with the click event. A returned promise keeps the
   * popover open, and the button pending, until it settles.
   */
  onAction?: (event: React.MouseEvent<HTMLButtonElement>) => unknown;
  /** Confirm button label. @default the catalog's uic.common.confirm ("Confirm") */
  actionLabel?: string;
  /** Confirm button variant; `destructive` for a harmful action. @default "primary" */
  actionVariant?: ButtonVariant;
  /** Disable the confirm button. @default false */
  isActionDisabled?: boolean;
  /** Runs on Cancel. The popover closes either way. */
  onCancel?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Cancel button label. @default the catalog's uic.common.cancel ("Cancel") */
  cancelLabel?: string;
  /**
   * Accessible name of the popover. @default `title` when it is a string,
   * else the action label
   */
  label?: string;
}

export function ConfirmPopover({
  title,
  description,
  icon,
  onAction,
  actionLabel,
  actionVariant = "primary",
  isActionDisabled = false,
  onCancel,
  cancelLabel,
  label,
  isOpen: controlledIsOpen,
  onOpenChange,
  children,
  width = 260,
  ...popoverProps
}: ConfirmPopoverProps) {
  const t = useUicTranslator();
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const cancelRef = useRef<HTMLButtonElement>(null);
  // Popover traps focus but does not hand it back on close.
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const setIsOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledIsOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      cancelRef.current?.focus();
      return;
    }
    const toRestore = restoreFocusRef.current;
    restoreFocusRef.current = null;
    // Only when focus fell back to the body; never steal it from elsewhere.
    if (toRestore && document.activeElement === document.body) {
      toRestore.focus();
    }
  }, [isOpen]);

  const actionText = actionLabel ?? t("uic.common.confirm");
  const accessibleLabel = label ?? (typeof title === "string" ? title : actionText);

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      label={accessibleLabel}
      width={width}
      content={
        <VStack gap={3} align="stretch">
          <HStack gap={2} align="start">
            {icon}
            <VStack gap={1} align="stretch">
              {typeof title === "string" ? (
                <Text weight="semibold">{title}</Text>
              ) : (
                title
              )}
              {description ? (
                typeof description === "string" ? (
                  <Text type="supporting" color="secondary">
                    {description}
                  </Text>
                ) : (
                  description
                )
              ) : null}
            </VStack>
          </HStack>
          <HStack gap={2} justify="end">
            {/* First in DOM order: the safe action takes the initial focus. */}
            <Button
              ref={cancelRef}
              size="sm"
              variant="secondary"
              label={cancelLabel ?? t("uic.common.cancel")}
              onClick={(event) => {
                onCancel?.(event);
                setIsOpen(false);
              }}
            />
            <Button
              size="sm"
              variant={actionVariant}
              isDisabled={isActionDisabled}
              label={actionText}
              clickAction={async (event) => {
                await onAction?.(event);
                setIsOpen(false);
              }}
            />
          </HStack>
        </VStack>
      }
      {...popoverProps}
    >
      {children}
    </Popover>
  );
}

ConfirmPopover.displayName = "ConfirmPopover";
