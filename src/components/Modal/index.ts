/**
 * `@lablup/ui-common/Modal`: ui-common's dialog, in place of Astryx `Dialog`.
 *
 * `ModalHeader`, `ModalPosition`, `ModalPurpose` and `ModalVariant` are
 * Astryx's `DialogHeader`, `DialogPosition`, `DialogPurpose` and
 * `DialogVariant` under Modal names. The Dialog names are re-exported too,
 * unchanged, so moving a `@astryxdesign/core/Dialog` import here takes only
 * `Dialog` → `Modal` and `DialogProps` → `ModalProps`.
 */
export { Modal } from "./Modal";
export type { ModalActionButtonProps, ModalProps } from "./Modal";

export { DialogHeader, DialogHeader as ModalHeader } from "@astryxdesign/core/Dialog";
export type {
  DialogHeaderProps,
  DialogHeaderProps as ModalHeaderProps,
  DialogPosition,
  DialogPosition as ModalPosition,
  DialogPurpose,
  DialogPurpose as ModalPurpose,
  DialogVariant,
  DialogVariant as ModalVariant,
} from "@astryxdesign/core/Dialog";

export {
  MAX_MODAL_LEVEL,
  MODAL_OPEN_ATTRIBUTE,
  configureModalZIndex,
  useModalLevel,
} from "./modalStack";
export type { ModalZIndexBand } from "./modalStack";
