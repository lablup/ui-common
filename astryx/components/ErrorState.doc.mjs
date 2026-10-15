/**
 * `astryx component ErrorState` (and `ui-common component ErrorState`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "ErrorState",
  displayName: "ErrorState",
  import: "@lablup/ui-common",
  category: "Feedback",
  keywords: [
    "error state",
    "error page",
    "failed to load",
    "connection error",
    "retry",
    "full area error",
  ],
  description:
    "A full-area error for a page or panel that could not load: an icon, a title as the region's heading, a message and up to two recovery actions (role=alert). tone sets how it reads (danger, warning or accent), not what it is about. Use Banner for an error that sits above content, and EmptyState when nothing is wrong.",
  props: [
    {
      name: "title",
      type: "string",
      description: "The region's heading.",
      required: true,
    },
    {
      name: "message",
      type: "string",
      description: "The detail under the title.",
      required: true,
    },
    {
      name: "tone",
      type: "'danger' | 'warning' | 'accent'",
      description: "How the error reads.",
      default: "'danger'",
    },
    {
      name: "icon",
      type: "ReactNode",
      description: "Replaces the default error icon.",
    },
    {
      name: "showIcon",
      type: "boolean",
      description: "Whether the icon shows.",
      default: "true",
    },
    {
      name: "primaryAction",
      type: "{ label: string; onClick: () => void }",
      description: "Primary button, such as Retry.",
    },
    {
      name: "secondaryAction",
      type: "{ label: string; onClick: () => void }",
      description: "Secondary button, such as View logs.",
    },
    {
      name: "className",
      type: "string",
      description: "Extra class on the root.",
    },
  ],
  usage: {
    description:
      "Render it in place of the content a failed query would have drawn. Map your own error categories onto tone.",
  },
  examples: [
    {
      label: "Failed query with retry",
      code: '<ErrorState\n  tone="warning"\n  title="Connection error"\n  message="Could not reach the server."\n  icon={<WifiOff />}\n  primaryAction={{ label: "Retry", onClick: refetch }}\n  secondaryAction={{ label: "View logs", onClick: openLogs }}\n/>',
    },
  ],
};
