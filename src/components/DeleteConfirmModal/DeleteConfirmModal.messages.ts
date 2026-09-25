import { defineMessages } from "../../i18n/catalog";

export const deleteConfirmModalMessages = defineMessages({
  "uic.DeleteConfirmModal.title": {
    defaultMessage: "Delete",
    description: "Title of the dialog that confirms deleting one item",
  },
  "uic.DeleteConfirmModal.titleMany": {
    defaultMessage: "{count, plural, one {Delete # item} other {Delete # items}}",
    description:
      "Title of the dialog that confirms deleting several items; {count} is how many",
  },
  "uic.DeleteConfirmModal.description": {
    defaultMessage: "Are you sure you want to delete?",
    description: "Question above the list of items about to be deleted",
  },
  "uic.DeleteConfirmModal.targetDescription": {
    defaultMessage: "Are you sure you want to permanently delete {target}?",
    description:
      "Question above the list of items about to be deleted; {target} names the kind of item, e.g. Project",
  },
  "uic.DeleteConfirmModal.typeToConfirm": {
    defaultMessage: "Type {confirmText} to confirm.",
    description:
      "Instruction above the confirmation field; {confirmText} is the text to type, shown as a token",
  },
  "uic.DeleteConfirmModal.confirmText": {
    defaultMessage: "Delete",
    description: "The word the user types to confirm deleting several items at once",
  },
  "uic.DeleteConfirmModal.cannotBeUndone": {
    defaultMessage: "This action cannot be undone.",
    description: "Warning that the deletion is permanent",
  },
});
