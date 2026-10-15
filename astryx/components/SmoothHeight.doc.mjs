/**
 * `astryx component SmoothHeight` (and `ui-common component SmoothHeight`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "SmoothHeight",
  displayName: "SmoothHeight",
  import: "@lablup/ui-common",
  category: "Layout",
  keywords: [
    "smooth height",
    "animate height",
    "height transition",
    "streaming text",
    "auto height",
    "grow",
  ],
  description:
    "Animates a container's height toward its content's natural height, so content that grows in jumps (streaming text wrapping onto new lines) expands smoothly. While active it measures the content with a ResizeObserver and transitions an explicit pixel height; the first activation does not animate. When active turns off the height is released back to auto after the transition settles.",
  props: [
    {
      name: "active",
      type: "boolean",
      description: "Whether height changes are animated right now.",
      required: true,
    },
    {
      name: "children",
      type: "ReactNode",
      description: "The content whose height is tracked.",
      required: true,
    },
    {
      name: "className",
      type: "string",
      description: "Extra class on the outer wrapper.",
    },
  ],
  usage: {
    description:
      "Set active while content is growing, such as while a reply streams, and clear it when done so later reflows are not held to a pixel height.",
  },
  examples: [
    {
      label: "Streaming reply",
      code: '<SmoothHeight active={isStreaming}>\n  <Text as="p">{reply}</Text>\n</SmoothHeight>',
    },
  ],
};
