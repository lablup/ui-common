import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { Selector } from "../../astryx/Selector";
import { VStack } from "../../astryx/Stack";
import { Text } from "../../astryx/Text";
import { Form } from "../Form";
import { BulkEditFormItem } from "./BulkEditFormItem";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const OWNERS = [
  { value: "team-a", label: "Team A" },
  { value: "team-b", label: "Team B" },
];

/**
 * A bulk-edit form over several records. A field left in "Keep as is" stays
 * `undefined` in the submitted values, a cleared one is `null`.
 */
function BulkEditForm({
  onFinish,
  children,
}: {
  onFinish?: (values: Record<string, unknown>) => void;
  children: React.ReactNode;
}) {
  const [submitted, setSubmitted] = useState<string | null>(null);
  return (
    <VStack gap={4} align="stretch" style={{ maxWidth: 420 }}>
      <Form
        layout="vertical"
        onFinish={(values) => {
          setSubmitted(
            JSON.stringify(values, (_, v) => (v === undefined ? "(keep)" : v)),
          );
          onFinish?.(values);
        }}
      >
        <VStack gap={3} align="stretch">
          {children}
          <Button type="submit" variant="primary" label="Apply to 12 items" />
        </VStack>
      </Form>
      {submitted ? <Text color="secondary">Submitted: {submitted}</Text> : null}
    </VStack>
  );
}

const meta = {
  title: "Components/BulkEditFormItem",
  component: BulkEditFormItem,
  args: {
    name: "status",
    label: "Status",
  },
  render: (args) => (
    <BulkEditForm onFinish={fn()}>
      <BulkEditFormItem {...args}>
        <Selector label="Status" isLabelHidden options={STATUSES} />
      </BulkEditFormItem>
    </BulkEditForm>
  ),
} satisfies Meta<typeof BulkEditFormItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithExtra: Story = {
  args: {
    extra: "Applies to every selected item.",
  },
};

export const SeveralFields: Story = {
  render: () => (
    <BulkEditForm onFinish={fn()}>
      <BulkEditFormItem name="status" label="Status">
        <Selector label="Status" isLabelHidden options={STATUSES} />
      </BulkEditFormItem>
      <BulkEditFormItem name="owner" label="Owner" hasClear clearValueLabel="No owner">
        <Selector label="Owner" isLabelHidden options={OWNERS} />
      </BulkEditFormItem>
    </BulkEditForm>
  ),
};
