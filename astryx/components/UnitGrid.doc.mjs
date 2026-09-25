/**
 * `astryx component UnitGrid` (and `ui-common component UnitGrid`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "UnitGrid",
  displayName: "UnitGrid",
  import: "@lablup/ui-common",
  category: "Data Display",
  keywords: [
    "unit grid",
    "waffle chart",
    "allocation",
    "capacity",
    "squares",
    "heatmap",
  ],
  description:
    "Groups of unit squares packed onto one shared lattice, serpentine or word-wrap. Each group is a tinted rounded plate with its initial on one cell; hovering it opens a hover card with the caller's content and, with onHueOverrideChange, a palette picker. Unit colours may be var() or color-mix() strings: the component resolves them to pick the initial's ink by WCAG contrast. The seven default hues and the two inks are --uic-unit-grid-group-1..7 and --uic-unit-grid-ink-dark/-light on the root; --uic-unit-grid-popover-z sets the hover card's z-index.",
  props: [
    {
      name: "groups",
      type: "Array<{ key: string; label?: string; units: Array<{ color: string; fraction?: number }>; plateVariant?: 'solid' | 'dashed' }>",
      description:
        "The groups, in flow order. A unit's fraction (0..1) fills its cell bottom-up; a dashed plate marks a tentative group.",
      required: true,
    },
    {
      name: "layout",
      type: "'serpentine' | 'wordwrap'",
      description: "How groups flow along the lattice.",
      default: "'serpentine'",
    },
    {
      name: "columns",
      type: "number",
      description:
        "Fixed lattice column count. Without it the count follows the measured width; pass it in fixed layouts and in jsdom.",
    },
    {
      name: "maxUnitsPerGroup",
      type: "number",
      description: "Units drawn per group at most.",
      default: "256",
    },
    {
      name: "groupPalette",
      type: "string[]",
      description: "Group hues, cycled in flow order.",
      default: "the seven --uic-unit-grid-group-N hues",
    },
    {
      name: "hueOverrides",
      type: "Record<string, number>",
      description: "Palette-index overrides, keyed by group key.",
    },
    {
      name: "onHueOverrideChange",
      type: "(key: string, paletteIndex: number) => void",
      description: "Shows the palette picker in the hover card and reports a pick.",
    },
    {
      name: "legendItems",
      type: "Array<{ color: string; label: string }>",
      description: "A legend row above the grid.",
    },
    {
      name: "renderGroupPopover",
      type: "(group, { hue, closePopover }) => ReactNode",
      description: "The hover card body for a group.",
    },
    {
      name: "onClickGroup",
      type: "(key: string) => void",
      description: "Makes cells clickable and reports the group.",
    },
    {
      name: "emptyFallback",
      type: "ReactNode",
      description: "Rendered instead of the grid when no group has a unit.",
    },
    {
      name: "changeGroupColorLabel",
      type: "string",
      description: "Name of the button that opens the palette.",
      default: 'the catalog\'s uic.UnitGrid.changeGroupColor ("Change group color")',
    },
    {
      name: "colorSwatchLabel",
      type: "(index: number) => string",
      description: "Name of a palette swatch, given its 1-based position.",
      default: 'the catalog\'s uic.UnitGrid.useColor ("Use color {index}")',
    },
  ],
  usage: {
    description:
      "An N-units-out-of-a-pool picture with many groups, such as allocations on a node. Give the root an aria-label that says what the grid shows (the grid is one image to assistive technology; the group names are listed alongside it). Other div attributes reach the root. UnitGridSkeleton, from the same import, is its Suspense fallback (rows, default 3).",
  },
  examples: [
    {
      label: "Two groups with a hover card",
      code: '<UnitGrid aria-label="Allocation" groups={[{ key: "a", label: "Alpha", units: [{ color: "var(--color-icon-blue)" }, { color: "var(--color-icon-blue)", fraction: 0.5 }] }, { key: "b", label: "Beta", units: [{ color: "var(--color-icon-red)" }] }]} renderGroupPopover={(group) => group.label} />',
    },
  ],
};
