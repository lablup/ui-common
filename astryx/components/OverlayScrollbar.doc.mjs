/**
 * `astryx component OverlayScrollbar` (and `ui-common component OverlayScrollbar`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "OverlayScrollbar",
  displayName: "OverlayScrollbar",
  import: "@lablup/ui-common",
  category: "Layout",
  keywords: ["scrollbar", "overlay scrollbar", "scroll thumb", "scrollbar gutter"],
  description:
    "A persistent, draggable scroll thumb painted over a scroll container instead of beside it, so becoming scrollable never changes the content width. It hides the target's native bar (data-uic-overlay-scrollbar) on pointer-driven platforms and renders nothing on touch-primary ones. Updates write to the DOM, outside React's render loop.",
  props: [
    {
      name: "targetRef",
      type: "RefObject<HTMLElement | null>",
      description: "The scroll container the thumb tracks.",
      required: true,
    },
    {
      name: "className",
      type: "string",
      description: "Extra class names on the track.",
    },
  ],
  usage: {
    description:
      "Render it inside the target's positioned ancestor. Raise --uic-overlay-scrollbar-z (default 1) to clear sticky chrome inside the column.",
    bestPractices: [
      {
        guidance: true,
        description:
          "Use it on a page's main scroll column, where a shifting width is noticed.",
      },
      {
        guidance: false,
        description: "Put it on every small scroll area; ScrollableArea covers those.",
      },
    ],
  },
  examples: [
    {
      label: "A scroll column",
      code: '<div style={{ position: "relative", height: "100%" }}>\n  <div ref={scrollRef} style={{ overflow: "auto", height: "100%" }}>{content}</div>\n  <OverlayScrollbar targetRef={scrollRef} />\n</div>',
    },
  ],
};
