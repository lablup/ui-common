/**
 * `astryx component ImageWithFallback` (and `ui-common component ImageWithFallback`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "ImageWithFallback",
  displayName: "ImageWithFallback",
  import: "@lablup/ui-common",
  category: "Media",
  keywords: ["image", "img", "fallback", "broken image", "logo"],
  description:
    "An img that renders a fallback node, typically an icon, once the image fails to load. The failure is remembered per src. Astryx Avatar and Thumbnail fall back to another image; this falls back to any node.",
  props: [
    { name: "src", type: "string", description: "Image source.", required: true },
    { name: "alt", type: "string", description: "Alternative text.", required: true },
    {
      name: "fallbackIcon",
      type: "ReactNode",
      description: "Rendered once the image fails.",
      required: true,
    },
  ],
  usage: {
    description:
      "For small remote images, such as vendor logos, that may be missing. Every other img attribute passes through.",
    bestPractices: [
      {
        guidance: true,
        description: "Size the fallback like the image, so the row does not shift.",
      },
    ],
  },
  examples: [
    {
      label: "Vendor logo",
      code: '<ImageWithFallback src={logoUrl} alt="Vendor" width={16} fallbackIcon={<Cpu size={16} />} />',
    },
  ],
};
