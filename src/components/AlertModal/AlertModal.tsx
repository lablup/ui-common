/**
 * AlertModal
 *
 * The WAI-ARIA alert-dialog pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) on `Modal`'s
 * portalled surface. Astryx `AlertDialog` renders in the browser's top
 * layer, above everything `Modal` leaves reachable (a notification stack);
 * its own off-top-layer path, `isInline`, renders `role="group"`. This one
 * keeps `role="alertdialog"` and joins `Modal`'s level stack, so it nests
 * with every other modal surface.
 *
 * Escape cancels and the backdrop does not. Cancel takes focus first, as the
 * pattern asks. The action does not close the modal; the caller does.
 *
 * SYNC: the anatomy is a copy of `@astryxdesign/core/AlertDialog`. On an
 * Astryx bump, diff its footer order, button variants and id wiring.
 *
 * @example
 * <AlertModal
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete session?"
 *   description="This cannot be undone."
 *   actionLabel="Delete"
 *   onAction={async () => {
 *     await remove();
 *     setIsOpen(false);
 *   }}
 * />
 */
import { useId } from "react";
import type { AlertDialogProps } from "@astryxdesign/core/AlertDialog";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { Modal, type ModalProps } from "../Modal/Modal";

export interface AlertModalProps
  extends
    Omit<
      ModalProps,
      | "children"
      | "purpose"
      | "role"
      | "aria-labelledby"
      | "aria-describedby"
      // Modal's generated header and footer: AlertModal draws its own.
      | "title"
      | "subtitle"
      | "headerStartContent"
      | "headerEndContent"
      | "hasCloseButton"
      | "footer"
      | "onAction"
      | "actionLabel"
      | "actionVariant"
      | "isActionLoading"
      | "isActionDisabled"
      | "actionButtonProps"
      | "cancelLabel"
      | "hasCancelButton"
      | "isLoading"
    >,
    Pick<
      AlertDialogProps,
      | "title"
      | "description"
      | "actionLabel"
      | "actionVariant"
      | "isActionLoading"
      | "onAction"
    > {
  /** Cancel label. Default: the catalog's `uic.common.cancel` ("Cancel") */
  cancelLabel?: string;
  /** Disables the Cancel button. Escape still cancels. */
  isCancelDisabled?: boolean;
  /** Disables the action button. */
  isActionDisabled?: boolean;
}

export function AlertModal({
  title,
  description,
  cancelLabel,
  actionLabel,
  actionVariant = "destructive",
  isActionLoading,
  isActionDisabled,
  isCancelDisabled,
  onAction,
  onOpenChange,
  ...rest
}: AlertModalProps) {
  const t = useUicTranslator();
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <Modal
      {...rest}
      onOpenChange={onOpenChange}
      // Escape cancels, the backdrop does not. `purpose="required"` would
      // give the role by disabling Escape too.
      purpose="form"
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <Layout
        content={
          <LayoutContent>
            <Heading level={2} id={titleId}>
              {title}
            </Heading>
            <Text type="body" color="secondary" id={descriptionId}>
              {description}
            </Text>
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <HStack justify="end" gap={2} align="center">
              <Button
                label={cancelLabel ?? t("uic.common.cancel")}
                variant="ghost"
                isDisabled={isCancelDisabled}
                onClick={() => onOpenChange(false)}
                // The least destructive choice; Modal focuses it on open.
                data-autofocus=""
              />
              <Button
                label={actionLabel}
                variant={actionVariant}
                isLoading={isActionLoading}
                isDisabled={isActionDisabled}
                onClick={onAction}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Modal>
  );
}

AlertModal.displayName = "AlertModal";
