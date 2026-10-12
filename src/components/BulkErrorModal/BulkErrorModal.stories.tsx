import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import type { DataGridColumn } from "../DataGrid/DataGrid";
import { BulkErrorModal } from "./BulkErrorModal";
import { overlayDocs, useOpenArg } from "../../stories/helpers";

interface Failure {
  key: string;
  target: string;
  reason: string;
}

const columns: DataGridColumn<Failure>[] = [
  { key: "target", header: "Folder", renderCell: (row) => row.target },
  { key: "reason", header: "Error", renderCell: (row) => row.reason },
];

const reasons = [
  "Permission denied",
  "Not found",
  "Folder is in use",
  "Quota exceeded",
];

const failures = (count: number): Failure[] =>
  Array.from({ length: count }, (_, index) => ({
    key: `row-${index + 1}`,
    target: `dataset-${index + 1}`,
    reason: reasons[index % reasons.length] ?? "Failed",
  }));

const meta = {
  title: "Components/BulkErrorModal",
  component: BulkErrorModal,
  args: {
    isOpen: true,
    onOpenChange: fn(),
    columns,
    data: failures(3),
  },
  parameters: overlayDocs("520px"),
  render: function Render(args) {
    const setOpen = useOpenArg(args.onOpenChange);
    return (
      <>
        <Button label="Show errors" onClick={() => setOpen(true)} />
        <BulkErrorModal {...args} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof BulkErrorModal<Failure>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: "Fix the failed folders and try again." },
};

/** More than ten failures page; the page bar appears. */
export const ManyFailures: Story = {
  args: { data: failures(25) },
};

export const CustomTitles: Story = {
  args: {
    title: "Could not move 3 folders",
    description: "The other folders were moved.",
    descriptionTitle: "Partially completed",
  },
};
