import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextHighlighter } from "./TextHighlighter";

const meta = {
  title: "Components/TextHighlighter",
  component: TextHighlighter,
  args: {
    children: "training-job-resnet-train-03",
    keyword: "train",
  },
} satisfies Meta<typeof TextHighlighter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CaseInsensitive: Story = {
  args: { children: "Model Server for Image Models", keyword: "MODEL" },
};

export const LiteralKeyword: Story = {
  args: { children: "report (v2).csv and report v2.csv", keyword: "(v2)" },
};

export const NoKeyword: Story = {
  args: { keyword: undefined },
};

export const NoMatch: Story = {
  args: { keyword: "inference" },
};

export const SearchResults: Story = {
  render: (args) => (
    <ul>
      {["dataset-images", "image-classifier", "notebook-sandbox", "Image Archive"].map(
        (name) => (
          <li key={name}>
            <TextHighlighter {...args}>{name}</TextHighlighter>
          </li>
        ),
      )}
    </ul>
  ),
  args: { keyword: "image" },
};
