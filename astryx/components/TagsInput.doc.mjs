/**
 * `astryx component TagsInput` (and `ui-common component TagsInput`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "TagsInput",
  displayName: "TagsInput",
  import: "@lablup/ui-common",
  category: "Inputs",
  keywords: [
    "tags input",
    "tags",
    "free-form tags",
    "string list",
    "select tags mode",
    "token input",
    "labels input",
  ],
  description:
    "Free-form tags held as string[], antd's Select mode=\"tags\", built on ui-common's Tokenizer. Tags are deduplicated, tokenSeparators end a tag as it is typed and split a pasted entry, and text left in the input becomes tags when focus leaves. Like the other form controls it takes no label or status message: put it in a Form.Item, or name it with aria-label on its own.",
  props: [
    {
      name: "value",
      type: "string[]",
      description: "The tags. Without it the input is uncontrolled.",
    },
    {
      name: "defaultValue",
      type: "string[]",
      description: "The starting tags when value is not set.",
    },
    {
      name: "onChange",
      type: "(value: string[]) => void",
      description: "Called with the new tags.",
    },
    {
      name: "tokenSeparators",
      type: "string[]",
      description:
        'Characters that end a tag as they are typed, and split a pasted entry (",").',
    },
  ],
  usage: {
    description:
      "Use for a list of strings the user makes up (labels, hostnames, emails). To pick from known options, use MultiSelector.",
  },
  examples: [
    {
      label: "In a Form.Item",
      code: '<Form.Item name="labels" label="Labels">\n  <TagsInput tokenSeparators={[","]} />\n</Form.Item>',
    },
  ],
};
