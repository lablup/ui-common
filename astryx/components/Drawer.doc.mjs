/**
 * `astryx component Drawer` (and `ui-common component Drawer`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "Drawer",
  displayName: "Drawer",
  import: "@lablup/ui-common/lab",
  category: "Overlay",
  keywords: [
    "drawer",
    "side panel",
    "slide over",
    "inspector",
    "detail panel",
    "sheet",
  ],
  description:
    "An overlay panel for inspectors and detail views, on a native dialog that slides in from the start or end edge: modal with a scrim by default, or non-modal with hasScrim={false} so the page behind stays interactive. ui-common's copy of Astryx lab's Drawer: Escape goes through core's layer-dismissal stack, so a popover, selector or Modal inside it closes first, and aria-modal passes through. Import it from @lablup/ui-common/lab; DrawerHeader is exported from the same path.",
  props: [
    {
      name: "isOpen",
      type: "boolean",
      description: "Whether the drawer is open. Controlled.",
      required: true,
    },
    {
      name: "onOpenChange",
      type: "(isOpen: boolean) => void",
      description:
        "Called on Escape or a scrim click, as purpose allows, and by a DrawerHeader close button.",
      required: true,
    },
    {
      name: "label",
      type: "string",
      description: "Accessible name; the drawer derives none from its content.",
      required: true,
    },
    {
      name: "children",
      type: "ReactNode",
      description:
        "Content, in a scrollable area. The element with data-autofocus takes focus on open.",
      required: true,
    },
    {
      name: "side",
      type: "'start' | 'end'",
      description: "Edge it slides from.",
      default: "'end'",
    },
    {
      name: "width",
      type: "number | string",
      description:
        "Desktop width: pixels, or any CSS length. Below 640px it stays the maximum and keeps a 56px reveal of the page.",
      default: "400",
    },
    {
      name: "isFullWidthOnMobile",
      type: "boolean",
      description: "Fills the viewport below 640px instead of keeping the reveal.",
      default: "false",
    },
    {
      name: "hasScrim",
      type: "boolean",
      description:
        "true: modal with focus trap and scroll lock. false: non-modal overlay.",
      default: "true",
    },
    {
      name: "purpose",
      type: "'required' | 'form' | 'info'",
      description:
        "Which dismissals work: required blocks Escape and the scrim, form blocks the scrim, info allows both.",
      default: "'info'",
    },
    {
      name: "padding",
      type: "SpacingStep",
      description: "Content inset on the spacing scale; 0 is full-bleed.",
      default: "the theme's drawer padding (--spacing-4)",
    },
    {
      name: "xstyle, className, style, data-testid, ref",
      type: "BaseProps<HTMLDialogElement>",
      description: "Base props, applied to the dialog.",
    },
  ],
  usage: {
    description:
      "Own the open state and clear the selection when it closes. Put a DrawerHeader with the same onOpenChange in a Layout header for the title and close button.",
  },
  examples: [
    {
      label: "Details drawer",
      code: 'import { Drawer, DrawerHeader } from "@lablup/ui-common/lab";\n\nconst [selected, setSelected] = useState<Host | null>(null);\nconst handleOpenChange = (isOpen: boolean) => !isOpen && setSelected(null);\n\n<Drawer isOpen={selected != null} onOpenChange={handleOpenChange} label={`Details: ${selected?.name}`}>\n  <Layout\n    header={<DrawerHeader title={selected?.name} onOpenChange={handleOpenChange} />}\n    content={<LayoutContent><HostDetails host={selected} /></LayoutContent>}\n  />\n</Drawer>',
    },
  ],
};
