import { defineMessages } from "../../i18n/catalog";

export const bulkErrorModalMessages = defineMessages({
  "uic.BulkErrorModal.title": {
    defaultMessage: "Action execution failed",
    description:
      "Default title of the dialog that lists the failed items of a bulk operation",
  },
  "uic.BulkErrorModal.errorOccurred": {
    defaultMessage: "Error Occurred",
    description:
      "Title of the error banner above the failed items, over the caller's guidance",
  },
});
