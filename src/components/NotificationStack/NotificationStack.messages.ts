import { defineMessages } from "../../i18n/catalog";

export const notificationStackMessages = defineMessages({
  "uic.NotificationStack.cancel": {
    defaultMessage: "Cancel",
    description: "Default label of the button that cancels a notice's background task",
  },
  "uic.NotificationStack.retry": {
    defaultMessage: "Retry",
    description: "Default label of the button that retries a notice's failed task",
  },
  "uic.NotificationStack.progress": {
    defaultMessage: "Task progress",
    description:
      "Accessible name of a notice's progress bar when the notice title is not plain text",
  },
});
