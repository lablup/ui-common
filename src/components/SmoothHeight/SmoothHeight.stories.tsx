import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { SmoothHeight, type SmoothHeightProps } from "./SmoothHeight";

const SENTENCE =
  "Each new line pushes the content down, and the wrapper grows to follow it.";

/** Buttons that add and remove lines, so the height change is visible. */
function GrowingContent(args: SmoothHeightProps) {
  const [lines, setLines] = useState(2);
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button label="Add line" onClick={() => setLines((n) => n + 1)} />
        <Button
          label="Remove line"
          variant="secondary"
          onClick={() => setLines((n) => Math.max(n - 1, 0))}
        />
      </div>
      <SmoothHeight {...args}>
        {Array.from({ length: lines }, (_, index) => (
          <p key={index}>
            {index + 1}. {SENTENCE}
          </p>
        ))}
      </SmoothHeight>
    </div>
  );
}

const STREAMED_WORDS = (
  "Streaming text arrives a few words at a time. When it wraps onto a new " +
  "line, the container would normally jump by a full line height. While " +
  "active, SmoothHeight animates that growth instead, and once the stream " +
  "ends it releases the explicit height back to auto."
).split(" ");

/** Appends words on a timer, like a streamed reply, then turns `active` off. */
function StreamingContent(args: SmoothHeightProps) {
  const [count, setCount] = useState(0);
  const isStreaming = count < STREAMED_WORDS.length;

  useEffect(() => {
    if (!isStreaming) return;
    const timer = window.setTimeout(() => setCount((n) => n + 1), 120);
    return () => window.clearTimeout(timer);
  }, [count, isStreaming]);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
      <div>
        <Button label="Restart" onClick={() => setCount(0)} />
      </div>
      <SmoothHeight {...args} active={isStreaming}>
        <p>{STREAMED_WORDS.slice(0, count).join(" ")}</p>
      </SmoothHeight>
    </div>
  );
}

const meta = {
  title: "Components/SmoothHeight",
  component: SmoothHeight,
  args: {
    active: true,
    children: null,
  },
  render: (args) => <GrowingContent {...args} />,
} satisfies Meta<typeof SmoothHeight>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The same content with `active` off: the height snaps instead of animating. */
export const Inactive: Story = {
  args: { active: false },
};

export const Streaming: Story = {
  render: (args) => <StreamingContent {...args} />,
};
