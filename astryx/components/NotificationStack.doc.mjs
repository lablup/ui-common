/**
 * `astryx component NotificationStack` (and `ui-common component NotificationStack`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "NotificationStack",
  displayName: "NotificationStack",
  import: "@lablup/ui-common",
  category: "Feedback",
  keywords: [
    "notification",
    "notices",
    "toast",
    "background task",
    "progress",
    "retry",
  ],
  description:
    "Floating notices stacked in the bottom-end corner, each an Astryx Banner that can carry background-task progress, Cancel/Retry and a navigation action, and a collapsible detail. Presentational: the caller owns the list and updates a notice in place under its key. Auto-close pauses on hover and focus; notices slide in and out.",
  props: [
    {
      name: "notifications",
      type: "Array<NotificationStackItem>",
      description:
        "Oldest first. An item takes key, title, description, status, percent, isProgressIndeterminate, progressLabel, actionText/onAction, retryText/onRetry, cancelText/onCancel, duration (seconds; null or 0 stays open), isClosable, icon, content (replaces the header) and children (collapsible detail).",
      required: true,
    },
    {
      name: "onClose",
      type: "(key: Key) => void",
      description: "Fired by the close button and by auto-close.",
    },
    {
      name: "maxVisible",
      type: "number",
      description: "Cap on visible notices; the newest win.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra class names on the stack.",
    },
  ],
  usage: {
    description:
      "Mount one per app. Set --uic-notification-stack-z to fit your layer ladder (default 11000, above Modal's band) and --uic-notification-stack-inset-top to keep a header clear.",
    bestPractices: [
      {
        guidance: true,
        description: "Update a running task's notice in place under the same key.",
      },
      {
        guidance: false,
        description: "Use it for a one-line confirmation; that is Astryx Toast.",
      },
    ],
  },
  examples: [
    {
      label: "An upload in progress",
      code: '<NotificationStack\n  notifications={[{ key: "upload", title: "Uploading", percent: 40, onCancel: cancel }]}\n  onClose={remove}\n/>',
    },
  ],
};
