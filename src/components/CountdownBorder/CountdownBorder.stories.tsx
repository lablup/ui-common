import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RotateCw } from "lucide-react";

import { Button } from "../../astryx/Button";
import { IconButton } from "../../astryx/IconButton";
import { CountdownBorder } from "./CountdownBorder";

const meta = {
  title: "Components/CountdownBorder",
  component: CountdownBorder,
  args: {
    durationMs: 5000,
    children: <IconButton label="Refresh" icon={<RotateCw size={16} />} />,
  },
} satisfies Meta<typeof CountdownBorder>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NotAnimated: Story = {
  args: { isAnimated: false },
};

export const CustomBorder: Story = {
  args: {
    style: { stroke: "var(--color-success)", strokeWidth: 3, borderRadius: 12 },
  },
};

function RestartDemo() {
  const [resetKey, setResetKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <CountdownBorder durationMs={5000} resetKey={resetKey} isPaused={isPaused}>
        <IconButton
          label="Refresh"
          icon={<RotateCw size={16} />}
          onClick={() => setResetKey((key) => key + 1)}
        />
      </CountdownBorder>
      <Button label="Restart" onClick={() => setResetKey((key) => key + 1)} />
      <Button
        variant="secondary"
        label={isPaused ? "Resume" : "Pause"}
        onClick={() => setIsPaused((paused) => !paused)}
      />
    </div>
  );
}

export const Restart: Story = {
  render: () => <RestartDemo />,
};
