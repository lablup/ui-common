/**
 * `astryx component PageHeader` (and `ui-common component PageHeader`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "PageHeader",
  displayName: "PageHeader",
  import: "@lablup/ui-common",
  category: "Layout",
  keywords: ["page header", "title", "heading", "page title", "error banner", "retry"],
  description:
    "The top of a page: its h1 title, a description, trailing actions, and an optional error banner with Retry and dismiss. Built on Astryx Heading, Text, Banner, Button and IconButton.",
  props: [
    {
      name: "title",
      type: "string",
      description: "Page title, rendered as the page's h1.",
      required: true,
    },
    {
      name: "description",
      type: "string",
      description: "Page description, below the title.",
    },
    {
      name: "actions",
      type: "ReactNode",
      description:
        "Actions on the trailing side; they wrap below the title when crowded.",
    },
    {
      name: "error",
      type: "string | null",
      description: "Error message shown in a banner below the header.",
    },
    {
      name: "errorDetail",
      type: "string | null",
      description:
        "Secondary line under the message, for the raw detail a server returned.",
    },
    {
      name: "onRetry",
      type: "() => void",
      description:
        "Renders a Retry button in the error banner. Separate from dismissal, which never retries.",
    },
    {
      name: "retryLabel",
      type: "string",
      description: "Retry button label.",
      default: "the catalog's uic.PageHeader.retry",
    },
    {
      name: "onErrorDismiss",
      type: "() => void",
      description: "Called when the error is dismissed; renders the dismiss button.",
    },
    {
      name: "dismissErrorLabel",
      type: "string",
      description: "Accessible label for the dismiss button.",
      default: 'the catalog\'s uic.PageHeader.dismissError ("Dismiss error")',
    },
    {
      name: "className",
      type: "string",
      description: "Extra class names on the header element.",
    },
  ],
  usage: {
    description:
      "One PageHeader per page, first inside PageLayout. Put page-level actions in `actions`; show a load or save failure in `error` rather than a separate banner.",
    bestPractices: [
      { guidance: true, description: "Keep the title short: it is the page's h1." },
      {
        guidance: true,
        description: "Pass onRetry only when retrying is safe and idempotent.",
      },
      {
        guidance: false,
        description: "Use it inside cards or dialogs: it is the page's heading.",
      },
    ],
  },
  examples: [
    {
      label: "With actions and an error",
      code: '<PageHeader\n  title="Sessions"\n  description="Running and recent compute sessions."\n  actions={<Button variant="primary" label="Start session" onClick={start} />}\n  error={error?.message}\n  onRetry={refetch}\n  onErrorDismiss={() => setError(null)}\n/>',
    },
  ],
};
