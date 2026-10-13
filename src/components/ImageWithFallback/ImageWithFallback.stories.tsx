import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImageOff } from "lucide-react";

import { ImageWithFallback } from "./ImageWithFallback";

const sampleImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#4f6bed"/><circle cx="24" cy="24" r="10" fill="#ffffff"/></svg>',
)}`;

const meta = {
  title: "Components/ImageWithFallback",
  component: ImageWithFallback,
  argTypes: {
    fallbackIcon: { control: false },
  },
  args: {
    src: sampleImage,
    alt: "Sample logo",
    fallbackIcon: <ImageOff size={24} />,
    width: 48,
    height: 48,
  },
} satisfies Meta<typeof ImageWithFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Fallback: Story = {
  args: { src: "missing-image.png" },
};

export const DecorativeFallback: Story = {
  args: { src: "missing-image.png", alt: "" },
};
