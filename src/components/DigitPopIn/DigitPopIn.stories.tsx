import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../astryx/Button";
import { DigitPopIn } from "./DigitPopIn";

const meta = {
  title: "Components/DigitPopIn",
  component: DigitPopIn,
  args: {
    text: "1,234",
  },
} satisfies Meta<typeof DigitPopIn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Formats: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {["42", "98.5%", "1,048,576", "3 / 4"].map((text) => (
        <DigitPopIn key={text} text={text} />
      ))}
    </div>
  ),
};

const samples = ["1,234", "5,678", "98.5%", "12", "3 / 4"];

function ReplayDemo() {
  const [index, setIndex] = useState(0);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <DigitPopIn text={samples[index] ?? ""} />
      <Button
        label="Next value"
        onClick={() => setIndex((current) => (current + 1) % samples.length)}
      />
    </div>
  );
}

export const Replay: Story = {
  render: () => <ReplayDemo />,
};
