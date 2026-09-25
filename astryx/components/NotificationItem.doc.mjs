/**
 * `astryx component NotificationItem` (and `ui-common component NotificationItem`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "NotificationItem",
  displayName: "NotificationItem",
  import: "@lablup/ui-common",
  category: "Feedback",
  keywords: ["notification", "notice", "toast body", "footer", "timestamp"],
  description:
    "The body of one notice: a title, a description, actions and a footer, stacked, with the actions and the footer at the end. A string or number in a slot renders as body Text; a node renders as is. The title leaves room for the notice's close button.",
  props: [
    {
      name: "title",
      type: "ReactNode",
      description: "The title.",
    },
    {
      name: "description",
      type: "ReactNode",
      description: "The description.",
    },
    {
      name: "action",
      type: "ReactNode",
      description: "Actions, at the end of their own row.",
    },
    {
      name: "footer",
      type: "ReactNode",
      description: "A quiet note at the end, such as when the notice arrived.",
    },
    {
      name: "className",
      type: "string",
      description: "Class names on the root.",
    },
  ],
  usage: {
    description:
      "As the description of a NotificationStack notice whose body has more structure than a line of text.",
  },
  examples: [
    {
      label: "A finished upload",
      code: '<NotificationItem\n  title="Upload finished"\n  description="report.csv"\n  action={<Button label="Open" />}\n  footer="2 minutes ago"\n/>',
    },
  ],
};
