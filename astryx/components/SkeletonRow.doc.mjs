/**
 * `astryx component SkeletonRow` (and `ui-common component SkeletonRow`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "SkeletonRow",
  displayName: "SkeletonRow",
  import: "@lablup/ui-common",
  category: "Feedback",
  keywords: [
    "skeleton row",
    "loading list",
    "loading rows",
    "list placeholder",
    "loading placeholder",
    "skeleton",
  ],
  description:
    "Loading placeholder for list and table rows: an optional avatar, two lines, and optional action buttons. count renders that many rows as a fragment, so they stay direct children of the caller's list; each row is its own placeholder and its own live region (role=status).",
  props: [
    {
      name: "count",
      type: "number",
      description: "Number of rows.",
      default: "1",
    },
    {
      name: "showAvatar",
      type: "boolean",
      description: "Avatar on the left.",
      default: "false",
    },
    {
      name: "showActions",
      type: "boolean",
      description: "Action buttons on the right.",
      default: "false",
    },
    {
      name: "loadingLabel",
      type: "string",
      description: "Accessible name for each row.",
      default: 'the catalog\'s uic.SkeletonRow.loading ("Loading")',
    },
    {
      name: "className / testId",
      type: "string",
      description: "Extra class; data-testid (each row gets testId-index).",
    },
  ],
  usage: {
    description:
      "Render it inside the list that will hold the real rows, with count near the page size.",
  },
  examples: [
    {
      label: "Loading list",
      code: "<VStack>\n  <SkeletonRow count={5} showAvatar showActions />\n</VStack>",
    },
  ],
};
