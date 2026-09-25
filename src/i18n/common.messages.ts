import { defineMessages } from "./catalog";

/**
 * Words whose translation does not depend on the component that shows them:
 * the generic action labels. Components use these instead of a key of their
 * own, so "Cancel" is translated once. See CONTRIBUTING.md, "Strings".
 */
export const commonMessages = defineMessages({
  "uic.common.ok": {
    defaultMessage: "OK",
    description: "Generic label of a primary action button that accepts",
  },
  "uic.common.cancel": {
    defaultMessage: "Cancel",
    description:
      "Generic label of a button that backs out of an action or stops a task",
  },
  "uic.common.confirm": {
    defaultMessage: "Confirm",
    description: "Generic label of a button that confirms an action",
  },
  "uic.common.retry": {
    defaultMessage: "Retry",
    description: "Generic label of a button that retries a failed action or load",
  },
});
