/**
 * `astryx component DigitPopIn` (and `ui-common component DigitPopIn`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "DigitPopIn",
  displayName: "DigitPopIn",
  import: "@lablup/ui-common",
  category: "Content",
  keywords: [
    "digit pop in",
    "number animation",
    "animated number",
    "count animation",
    "staggered characters",
  ],
  description:
    'Renders text, usually a formatted number, one element per character, each rising into place from a light blur after the one before it. A new text replays the animation. The characters are hidden from assistive tech and a plain copy is read instead, so a screen reader hears "1,234". Under prefers-reduced-motion it renders the plain text. StatCard uses it for animate="digits".',
  props: [
    {
      name: "text",
      type: "string",
      description: 'The text to animate, already formatted ("1,234", "98.5%").',
      required: true,
    },
    {
      name: "className",
      type: "string",
      description: "Extra class on the root.",
    },
  ],
  usage: {
    description:
      "For a number outside a card that should animate when it changes. Format the value before passing it.",
  },
  examples: [
    {
      label: "An animated total",
      code: '<Text type="heading">\n  <DigitPopIn text={total.toLocaleString()} />\n</Text>',
    },
  ],
};
