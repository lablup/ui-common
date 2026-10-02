/**
 * DeleteConfirmModal
 *
 * Confirms a deletion on `Modal`: a title with a warning glyph, a question,
 * the items about to go, and a destructive action. For an irreversible
 * deletion of several items, or when `isConfirmInputRequired` is set, the
 * user types `confirmText` before the action enables.
 *
 * `isReversible` keeps the same layout for an action the user can undo
 * (revoking an assignment): no typed confirmation and no "cannot be undone"
 * warning.
 *
 * @example
 * <DeleteConfirmModal
 *   isOpen={target != null}
 *   onOpenChange={(open) => !open && setTarget(null)}
 *   items={target ? [{ key: target.id, label: target.name }] : []}
 *   target="Preset"
 *   confirmText={target?.name}
 *   isConfirmInputRequired
 *   onAction={async () => {
 *     await remove(target.id);
 *     setTarget(null);
 *   }}
 * />
 */
import { isValidElement, useState, type ReactNode } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Icon } from "@astryxdesign/core/Icon";
import { VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";

import { translateWithNodes } from "../../i18n/translateWithNodes";
import { useUicTranslator } from "../../i18n/useUicTranslator";
import { Modal, type ModalProps } from "../Modal/Modal";
import "./DeleteConfirmModal.css";

export interface DeleteConfirmModalItem {
  /** Unique key of the item. */
  key: string;
  /** What the list shows for it. */
  label: ReactNode;
}

export interface DeleteConfirmModalProps extends Omit<
  ModalProps,
  | "children"
  | "title"
  | "footer"
  | "actionLabel"
  | "actionVariant"
  | "hasCancelButton"
  | "isLoading"
> {
  /** The items about to be deleted. */
  items: DeleteConfirmModalItem[];
  /**
   * Title. Default: the catalog's `uic.DeleteConfirmModal.title` ("Delete"),
   * or `uic.DeleteConfirmModal.titleMany` ("Delete 3 items") for several.
   */
  title?: ReactNode;
  /** Glyph before the title. Default: the theme's `warning` icon */
  titleIcon?: ReactNode;
  /**
   * The question above the list. Default: the catalog's
   * `uic.DeleteConfirmModal.targetDescription` when `target` is set, else
   * `uic.DeleteConfirmModal.description`.
   */
  description?: ReactNode;
  /** What kind of thing is deleted ("Project"), named in the default question. */
  target?: ReactNode;
  /**
   * The action can be undone: no typed confirmation, no "cannot be undone"
   * warning. Default: false
   */
  isReversible?: boolean;
  /** Asks for the typed confirmation for a single item too. Default: false */
  isConfirmInputRequired?: boolean;
  /**
   * What the user types. Default: the item's label when there is one item and
   * it is plain text, else the catalog's `uic.DeleteConfirmModal.confirmText`
   * ("Delete"). Pass it when a single item's label is a node. An empty string
   * keeps the action disabled and shows no field.
   */
  confirmText?: string;
  /**
   * Label above the field. A function receives the confirm text, drawn as a
   * token, and places it. Default: the catalog's
   * `uic.DeleteConfirmModal.typeToConfirm` ("Type {confirmText} to confirm.")
   */
  inputLabel?: ReactNode | ((confirmText: ReactNode) => ReactNode);
  /** Placeholder of the field. */
  inputPlaceholder?: string;
  /** Disables the field, e.g. while the deletion runs. */
  isInputDisabled?: boolean;
  /** Content after the field, e.g. options that change what is deleted. */
  extraContent?: ReactNode;
  /**
   * The irreversibility warning. Default: the catalog's
   * `uic.DeleteConfirmModal.cannotBeUndone` ("This action cannot be undone.")
   */
  warningText?: string;
  /** Maximum height of the item list, in pixels; 0 for none. Default: 200 */
  itemListMaxHeight?: number;
  /** Lists the items without the boxed, scrolling surface. Default: false */
  hasPlainItems?: boolean;
  /**
   * The deletion. Returning a promise shows the action pending until it
   * settles. It does not close the modal.
   */
  onAction: () => unknown;
  /** Action label. Default: the catalog's `uic.common.delete` ("Delete") */
  actionLabel?: string;
  /**
   * Disables the action. It only adds to the typed-confirmation gate, which it
   * cannot open.
   */
  isActionDisabled?: boolean;
}

/** The text of a node, for the field's accessible name. */
function toText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (isValidElement(node)) {
    return toText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function plainText(node: ReactNode): string | undefined {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  return undefined;
}

export function DeleteConfirmModal({
  items,
  title,
  titleIcon,
  description,
  target,
  isReversible = false,
  isConfirmInputRequired = false,
  confirmText: confirmTextProp,
  inputLabel,
  inputPlaceholder,
  isInputDisabled,
  extraContent,
  warningText,
  itemListMaxHeight = 200,
  hasPlainItems = false,
  actionLabel,
  isActionDisabled,
  isOpen,
  ...rest
}: DeleteConfirmModalProps) {
  const t = useUicTranslator();
  const [typedText, setTypedText] = useState("");

  // The gate resets on every open.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setTypedText("");
  }

  const resolvedTitle =
    title ??
    (items.length > 1
      ? t("uic.DeleteConfirmModal.titleMany", { count: items.length })
      : t("uic.DeleteConfirmModal.title"));

  const confirmText =
    confirmTextProp ??
    (items.length === 1 ? plainText(items[0]?.label) : undefined) ??
    t("uic.DeleteConfirmModal.confirmText");

  // An empty confirm text (the target is not resolved yet) must neither arm
  // an already satisfied gate nor drop the gate: no field, action disabled.
  const wantsInput = !isReversible && (items.length > 1 || isConfirmInputRequired);
  const needsInput = wantsInput && confirmText !== "";
  const isGateOpen = wantsInput
    ? confirmText !== "" && typedText === confirmText
    : items.length > 0;

  const warning = warningText ?? t("uic.DeleteConfirmModal.cannotBeUndone");

  const question =
    description ??
    (target != null
      ? translateWithNodes(t, "uic.DeleteConfirmModal.targetDescription", { target })
      : t("uic.DeleteConfirmModal.description"));

  const token = <Token label={confirmText} size="sm" />;
  const label =
    typeof inputLabel === "function"
      ? inputLabel(token)
      : (inputLabel ??
        translateWithNodes(t, "uic.DeleteConfirmModal.typeToConfirm", {
          confirmText: token,
        }));
  const accessibleLabel =
    inputLabel === undefined
      ? t("uic.DeleteConfirmModal.typeToConfirm", { confirmText })
      : toText(typeof inputLabel === "function" ? inputLabel(confirmText) : inputLabel);

  const itemList =
    items.length > 0 ? (
      <div
        role="list"
        className={
          hasPlainItems
            ? undefined
            : [
                "uic-delete-confirm-modal__items",
                itemListMaxHeight ? "uic-delete-confirm-modal__items--scroll" : null,
              ]
                .filter(Boolean)
                .join(" ")
        }
        style={
          !hasPlainItems && itemListMaxHeight
            ? { maxHeight: itemListMaxHeight }
            : undefined
        }
      >
        <VStack align="stretch" gap={1}>
          {items.map((item) => (
            <div key={item.key} role="listitem">
              {item.label}
            </div>
          ))}
        </VStack>
      </div>
    ) : null;

  return (
    <Modal
      {...rest}
      isOpen={isOpen}
      title={
        <span className="uic-delete-confirm-modal__title">
          <span className="uic-delete-confirm-modal__title-icon">
            {titleIcon ?? <Icon icon="warning" size="sm" color="inherit" />}
          </span>
          {resolvedTitle}
        </span>
      }
      actionLabel={actionLabel ?? t("uic.common.delete")}
      actionVariant="destructive"
      isActionDisabled={!isGateOpen || isActionDisabled === true}
    >
      <VStack align="stretch" gap={2}>
        {question ? <Text>{question}</Text> : null}
        {!needsInput || items.length > 1 ? itemList : null}
        {needsInput ? (
          <VStack align="stretch" gap={1}>
            <Text type="label">{label}</Text>
            <TextInput
              label={accessibleLabel}
              isLabelHidden
              value={typedText}
              onChange={(value) => setTypedText(value ?? "")}
              placeholder={inputPlaceholder}
              isDisabled={isInputDisabled}
              hasAutoFocus
              hasClear
              htmlName="confirmText"
            />
            <Text className="uic-delete-confirm-modal__warning">{warning}</Text>
          </VStack>
        ) : null}
        {extraContent}
        {/* With a field, the warning sits under it; without one, a banner. */}
        {!needsInput && !isReversible ? (
          <Banner status="error" title={warning} />
        ) : null}
      </VStack>
    </Modal>
  );
}

DeleteConfirmModal.displayName = "DeleteConfirmModal";
