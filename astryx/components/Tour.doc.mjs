/**
 * `astryx component Tour` (and `ui-common component Tour`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "Tour",
  displayName: "Tour",
  import: "@lablup/ui-common/lab",
  category: "Overlay",
  keywords: [
    "tour",
    "product tour",
    "onboarding",
    "walkthrough",
    "coachmark",
    "guided tour",
    "spotlight",
  ],
  description:
    "A guided product tour: Tour coordinates its TourStep children and shows one step's callout at a time, anchored to a target element, optionally with a backdrop that spotlights the target. ui-common's copy of Astryx lab's Tour: a step's spotlight stays under its callout in StrictMode. Import Tour, TourStep and useTour from @lablup/ui-common/lab.",
  props: [
    {
      name: "isActive",
      type: "boolean",
      description:
        "Whether the tour runs. When false nothing renders and the next run starts at the first step. The consumer owns whether the user has seen it.",
      required: true,
    },
    {
      name: "onDismiss",
      type: "(source: TourDismissSource) => void",
      description:
        "Called on every exit, including finishing the last step (source 'complete'). Set isActive to false here.",
      required: true,
    },
    {
      name: "children",
      type: "ReactNode",
      description: "TourStep elements; their order is the step order.",
    },
    {
      name: "hasBackdrop",
      type: "boolean",
      description: "Dims the page around the target with a spotlight cutout.",
      default: "false",
    },
    {
      name: "isStepCountShown",
      type: "boolean",
      description: 'Shows "2 of 5" in each step.',
      default: "false",
    },
    {
      name: "TourStep: targetRef, heading, children, placement, alignment",
      type: "RefObject<HTMLElement | null>, ReactNode, ReactNode, LayerPlacement, LayerAlignment",
      description:
        "One step. targetRef must point at a button or [role=button] element. placement defaults to 'below', alignment to 'start'.",
    },
    {
      name: "useTour()",
      type: "UseTourReturn | null",
      description:
        "Inside a Tour: activeStepIndex, stepCount, isFirstStep, isLastStep, next, previous, dismiss. null outside one.",
    },
  ],
  usage: {
    description:
      "Mount the tour once and flip isActive from your own seen-it state. Branch on the dismiss source to tell a finish from an early skip.",
  },
  examples: [
    {
      label: "Two-step tour",
      code: 'import { Tour, TourStep } from "@lablup/ui-common/lab";\n\nconst [isActive, setIsActive] = useState(true);\nconst saveRef = useRef<HTMLButtonElement>(null);\nconst shareRef = useRef<HTMLButtonElement>(null);\n\n<Tour isActive={isActive} hasBackdrop isStepCountShown onDismiss={() => setIsActive(false)}>\n  <TourStep targetRef={saveRef} heading="Save your work">\n    Changes save automatically.\n  </TourStep>\n  <TourStep targetRef={shareRef} heading="Share it">\n    Invite teammates from here.\n  </TourStep>\n</Tour>',
    },
  ],
};
