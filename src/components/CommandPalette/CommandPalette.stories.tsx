import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { createStaticSource } from "../../formControls/Typeahead";
import { CommandPalette } from "./CommandPalette";
import { overlayDocs, useOpenState } from "../../stories/helpers";

const source = createStaticSource([
  { id: "home", label: "Home", auxiliaryData: { group: "Pages" } },
  { id: "sessions", label: "Sessions", auxiliaryData: { group: "Pages" } },
  { id: "storage", label: "Storage", auxiliaryData: { group: "Pages" } },
  { id: "settings", label: "Settings", auxiliaryData: { group: "Pages" } },
  { id: "new-session", label: "Start a session", auxiliaryData: { group: "Actions" } },
  { id: "upload", label: "Upload files", auxiliaryData: { group: "Actions" } },
  { id: "theme", label: "Toggle dark mode", auxiliaryData: { group: "Actions" } },
  { id: "help", label: "Open help", auxiliaryData: { group: "Actions" } },
]);

/**
 * Astryx's CommandPalette with one difference: it sits at a fixed offset from
 * the top of the viewport instead of centred. Type in `Default` until the list
 * narrows: the input stays where it is and the surface shrinks from the
 * bottom.
 */
const meta = {
  title: "Components/CommandPalette",
  component: CommandPalette,
  args: {
    isOpen: true,
    onOpenChange: fn(),
    onValueChange: fn(),
    searchSource: source,
  },
  argTypes: {
    searchSource: { control: false },
    input: { control: false },
    footer: { control: false },
  },
  parameters: overlayDocs("560px"),
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, (next) =>
      args.onOpenChange(next),
    );
    return (
      <>
        <Button label="Open palette" onClick={() => setOpen(true)} />
        <CommandPalette {...args} isOpen={isOpen} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A passed `maxHeight` is still capped by the viewport below the offset. */
export const ShortMaxHeight: Story = {
  args: { maxHeight: 240 },
};
