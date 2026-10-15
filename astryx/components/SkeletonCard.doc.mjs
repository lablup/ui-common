/**
 * `astryx component SkeletonCard` (and `ui-common component SkeletonCard`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "SkeletonCard",
  displayName: "SkeletonCard",
  import: "@lablup/ui-common",
  category: "Feedback",
  keywords: [
    "skeleton card",
    "loading card",
    "card placeholder",
    "loading placeholder",
    "skeleton",
  ],
  description:
    "Loading placeholder shaped like a card: a header line, three body lines and two footer buttons. compact drops the footer; stat is an avatar beside two lines, the shape of a StatCard. One live region: the container is role=status with a name, and the shapes inside are Astryx's decorative Skeleton.",
  props: [
    {
      name: "variant",
      type: "'default' | 'compact' | 'stat'",
      description: "Card shape.",
      default: "'default'",
    },
    {
      name: "loadingLabel",
      type: "string",
      description: "Accessible name for the placeholder as a whole.",
      default: 'the catalog\'s uic.SkeletonCard.loading ("Loading")',
    },
    {
      name: "className / testId",
      type: "string",
      description: "Extra class; data-testid.",
    },
  ],
  usage: {
    description:
      "Show it in the place the card will land while its data loads. For a single decorative shape use Astryx Skeleton.",
  },
  examples: [
    {
      label: "Loading stat cards",
      code: '<HStack gap={4}>\n  <SkeletonCard variant="stat" />\n  <SkeletonCard variant="stat" />\n</HStack>',
    },
  ],
};
