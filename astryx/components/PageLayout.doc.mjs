/**
 * `astryx component PageLayout` (and `ui-common component PageLayout`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "PageLayout",
  displayName: "PageLayout",
  import: "@lablup/ui-common",
  category: "Layout",
  keywords: [
    "page layout",
    "page wrapper",
    "page width",
    "max width",
    "centered content",
    "page container",
  ],
  description:
    "The page layout wrapper every page sits in: a centred column with a max width and the page's spacing. variant picks the width, standard (900px), wide (1400px) or full (no max width; the mobile padding fallback is off, so the page's own padding controls the gutter). Other div attributes pass through. Put PageHeader first inside it.",
  props: [
    {
      name: "children",
      type: "ReactNode",
      description: "The page content.",
      required: true,
    },
    {
      name: "variant",
      type: "'standard' | 'wide' | 'full'",
      description: "Width of the column.",
      default: "'standard'",
    },
    {
      name: "className",
      type: "string",
      description: "Extra class on the wrapper.",
    },
  ],
  usage: {
    description:
      "Wrap each routed page once, at its root. Use wide for dashboards and tables, and full for a page that draws its own chrome, such as a left sidebar.",
  },
  examples: [
    {
      label: "A page with its header",
      code: '<PageLayout variant="wide">\n  <PageHeader title="Models" description="Manage your models" />\n  <ModelList />\n</PageLayout>',
    },
  ],
};
