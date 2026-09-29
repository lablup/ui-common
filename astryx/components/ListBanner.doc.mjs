/**
 * `astryx component ListBanner` (and `ui-common component ListBanner`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "ListBanner",
  displayName: "ListBanner",
  import: "@lablup/ui-common",
  category: "Feedback",
  keywords: ["banner", "list", "affected items", "warning list", "alert"],
  description:
    "An Astryx Banner whose description is a list of items, for notices such as the items a dialog will change. The list scrolls past maxHeight and is reachable by keyboard. Without a title the list takes the title slot; without items there is no list. The other Banner props pass through.",
  props: [
    {
      name: "items",
      type: "ReadonlyArray<{ key?: Key; content: ReactNode }>",
      description: "The items.",
      required: true,
    },
    {
      name: "title",
      type: "ReactNode",
      description: "Say how many items there are here.",
    },
    {
      name: "maxHeight",
      type: "number | string",
      description: "Height at which the list scrolls.",
      default: "165",
    },
    {
      name: "status",
      type: "'info' | 'warning' | 'error' | 'success'",
      description: "Banner status.",
      required: true,
    },
  ],
  usage: {
    description:
      "Inside a dialog that acts on a selection. Name the count in the title rather than in each item.",
  },
  examples: [
    {
      label: "Users about to change",
      code: '<ListBanner\n  status="warning"\n  title={`${users.length} users will be updated`}\n  items={users.map((u) => ({ key: u.id, content: u.email }))}\n/>',
    },
  ],
};
