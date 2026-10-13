import { StrictMode, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { Tour, type TourProps } from "./Tour";
import type { TourDismissSource } from "./TourContext";
import { TourStep } from "./TourStep";

/** A start button and the `isActive` state, so the tour can be run again. */
function useTourDemo(args: TourProps) {
  const [isActive, setIsActive] = useState(false);
  const onDismiss = (source: TourDismissSource) => {
    setIsActive(false);
    args.onDismiss(source);
  };
  const startButton = (
    <Button variant="primary" label="Start tour" onClick={() => setIsActive(true)} />
  );
  return { tourProps: { ...args, isActive, onDismiss }, startButton };
}

/** A three-step tour over a small toolbar. */
function ToolbarTour(args: TourProps) {
  const { tourProps, startButton } = useTourDemo(args);
  const newRef = useRef<HTMLButtonElement>(null);
  const shareRef = useRef<HTMLButtonElement>(null);
  const exportRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ display: "grid", gap: 24, justifyItems: "start" }}>
      {startButton}
      <div style={{ display: "flex", gap: 8 }}>
        <Button ref={newRef} label="Create" />
        <Button ref={shareRef} label="Share" variant="secondary" />
        <Button ref={exportRef} label="Export" variant="secondary" />
      </div>
      <Tour {...tourProps}>
        <TourStep targetRef={newRef} heading="Create a document">
          Start a new document from a blank page or a template.
        </TourStep>
        <TourStep targetRef={shareRef} heading="Share it">
          Invite teammates to view or edit.
        </TourStep>
        <TourStep targetRef={exportRef} heading="Export">
          Download a copy as a PDF or a spreadsheet.
        </TourStep>
      </Tour>
    </div>
  );
}

/** One target, with a step per placement around it. */
function PlacementTour(args: TourProps) {
  const { tourProps, startButton } = useTourDemo(args);
  const targetRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ display: "grid", gap: 24, justifyItems: "start" }}>
      {startButton}
      <div
        style={{ display: "grid", placeItems: "center", width: "100%", height: 320 }}
      >
        <Button ref={targetRef} label="Settings" variant="secondary" />
      </div>
      <Tour {...tourProps}>
        {(["below", "end", "above", "start"] as const).map((placement) => (
          <TourStep
            key={placement}
            targetRef={targetRef}
            heading={`Placement: ${placement}`}
            placement={placement}
            alignment="center"
          >
            The callout sits on this side of its target.
          </TourStep>
        ))}
      </Tour>
    </div>
  );
}

const meta = {
  title: "Forks/Tour",
  component: Tour,
  subcomponents: { TourStep },
  args: {
    isActive: false,
    onDismiss: fn(),
  },
  argTypes: {
    isActive: { control: false },
  },
  render: (args) => <ToolbarTour {...args} />,
} satisfies Meta<typeof Tour>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A coachmark tour: each step rings its target, the page is not dimmed. */
export const Default: Story = {};

/**
 * The fork's fix: under StrictMode, lab's step re-promoted its highlight
 * above the callout, so the spotlight dim painted over the callout. Here the
 * callout stays above the dim.
 */
export const WithBackdrop: Story = {
  args: { hasBackdrop: true, isStepCountShown: true },
  render: (args) => (
    <StrictMode>
      <ToolbarTour {...args} />
    </StrictMode>
  ),
};

export const Step: Story = {
  args: { isStepCountShown: true },
  render: (args) => <PlacementTour {...args} />,
};
