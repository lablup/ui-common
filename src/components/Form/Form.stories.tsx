import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { HStack, VStack } from "../../astryx/Stack";
import { Text } from "../../astryx/Text";
import { StepNumberInput } from "../StepNumberInput";
import { Selector } from "../../formControls/Selector";
import { TextInput } from "../../formControls/TextInput";
import FormRoot from "./Form";
import {
  ErrorList,
  Form,
  FormItem,
  FormItemVisual,
  FormList,
  type FormProps,
} from "./index";

const REGIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
];

interface ProjectValues {
  name?: string;
  email?: string;
  region?: string;
  storage?: number;
}

/** A small project form: required fields, a format rule, a custom validator, submit and reset. */
function ProjectForm(props: FormProps) {
  const [form] = Form.useForm<ProjectValues>();
  const [submitted, setSubmitted] = useState<ProjectValues | null>(null);
  return (
    <VStack gap={4} align="stretch" style={{ maxWidth: 480 }}>
      <Form<ProjectValues>
        layout="vertical"
        initialValues={{ storage: 8 }}
        {...props}
        form={form}
        onFinish={(values: ProjectValues) => {
          setSubmitted(values);
          props.onFinish?.(values);
        }}
      >
        <FormItem
          name="name"
          label="Project name"
          rules={[
            { required: true, message: "Enter a project name." },
            { min: 3, message: "Use at least 3 characters." },
          ]}
        >
          <TextInput placeholder="my-project" />
        </FormItem>
        <FormItem
          name="email"
          label="Contact email"
          tooltip="Notifications about this project go here."
          rules={[{ type: "email", message: "Enter a valid email address." }]}
        >
          <TextInput type="email" placeholder="owner@example.com" />
        </FormItem>
        <FormItem
          name="region"
          label="Region"
          rules={[{ required: true, message: "Choose a region." }]}
        >
          <Selector options={REGIONS} placeholder="Select a region" />
        </FormItem>
        <FormItem
          name="storage"
          label="Storage"
          extra="Between 1 and 64 GiB."
          rules={[
            {
              validator: (_, value: number) =>
                value >= 1 && value <= 64
                  ? Promise.resolve()
                  : Promise.reject(new Error("Choose between 1 and 64 GiB.")),
            },
          ]}
        >
          <StepNumberInput
            label="Storage"
            isLabelHidden
            steps={[1, 2, 4, 8, 16, 32, 64]}
            units="GiB"
          />
        </FormItem>
        <HStack gap={2}>
          <Button type="submit" variant="primary" label="Create project" />
          <Button
            variant="secondary"
            label="Reset"
            onClick={() => {
              form.resetFields();
              setSubmitted(null);
            }}
          />
        </HStack>
      </Form>
      {submitted ? (
        <Text color="secondary">Submitted: {JSON.stringify(submitted)}</Text>
      ) : null}
    </VStack>
  );
}

/** `Form.List`: rows added and removed at run time, each validated on its own. */
function MembersForm(props: FormProps) {
  return (
    <Form
      layout="vertical"
      initialValues={{ members: ["member@example.com"] }}
      {...props}
      style={{ maxWidth: 480 }}
    >
      <FormList
        name="members"
        rules={[
          {
            validator: (_, value: unknown[] | undefined) =>
              value && value.length > 0
                ? Promise.resolve()
                : Promise.reject(new Error("Add at least one member.")),
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <VStack gap={2} align="stretch">
            {fields.map((field, index) => (
              <HStack key={field.key} gap={2} vAlign="start">
                <FormItem
                  name={field.name}
                  label={index === 0 ? "Members" : undefined}
                  rules={[
                    { required: true, message: "Enter an email address." },
                    { type: "email", message: "Enter a valid email address." },
                  ]}
                  style={{ flex: 1 }}
                >
                  <TextInput aria-label={`Member ${index + 1}`} />
                </FormItem>
                <Button
                  variant="ghost"
                  label="Remove"
                  onClick={() => remove(field.name)}
                />
              </HStack>
            ))}
            <ErrorList errors={errors} />
            <HStack gap={2}>
              <Button variant="secondary" label="Add member" onClick={() => add()} />
              <Button type="submit" variant="primary" label="Save" />
            </HStack>
          </VStack>
        )}
      </FormList>
    </Form>
  );
}

/** `labelExtra`: an action in the label row, outside the `<label>`. */
function LabelExtraForm(props: FormProps) {
  const [ascending, setAscending] = useState(true);
  const options = ascending ? REGIONS : [...REGIONS].reverse();
  return (
    <Form layout="vertical" {...props} style={{ maxWidth: 480 }}>
      <FormItem
        name="region"
        label="Region"
        labelExtra={
          <Button
            variant="ghost"
            size="sm"
            label={ascending ? "Sort Z–A" : "Sort A–Z"}
            onClick={() => setAscending((value) => !value)}
          />
        }
      >
        <Selector options={options} placeholder="Select a region" />
      </FormItem>
    </Form>
  );
}

const CLUSTER_WARNING = "A cluster of size 1 runs as a single-node session.";

/**
 * A `warningOnly` rule on an item with `dependencies`. Step Accelerators: each
 * change re-validates Cluster size, and the counter records every time the
 * warning left the DOM and came back within 100ms, a flicker too short to see.
 * Clearing the warning by changing Cluster size is not counted.
 */
function DependentWarningForm(props: FormProps) {
  const [form] = Form.useForm();
  const [flickers, setFlickers] = useState(0);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    form.validateFields(["clusterSize"]).catch(() => {});
  }, [form]);

  useEffect(() => {
    if (!container) return;
    const hasWarning = (nodes: NodeList) =>
      [...nodes].some((node) => node.textContent?.includes(CLUSTER_WARNING));
    let removedAt: number | null = null;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (hasWarning(record.removedNodes)) removedAt = performance.now();
        if (hasWarning(record.addedNodes) && removedAt !== null) {
          if (performance.now() - removedAt < 100) setFlickers((prev) => prev + 1);
          removedAt = null;
        }
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [container]);

  return (
    <VStack ref={setContainer} gap={4} align="stretch" style={{ maxWidth: 480 }}>
      <Form
        layout="vertical"
        {...props}
        form={form}
        initialValues={{ accelerators: 1, clusterSize: 1 }}
      >
        <FormItem name="accelerators" label="Accelerators">
          <StepNumberInput label="Accelerators" isLabelHidden steps={[1, 2, 3, 4, 8]} />
        </FormItem>
        <FormItem
          name="clusterSize"
          label="Cluster size"
          dependencies={["accelerators"]}
          rules={[
            {
              warningOnly: true,
              validator: (_, value) =>
                value === 1
                  ? Promise.reject(new Error(CLUSTER_WARNING))
                  : Promise.resolve(),
            },
          ]}
        >
          <StepNumberInput label="Cluster size" isLabelHidden steps={[1, 2, 4]} />
        </FormItem>
      </Form>
      <HStack gap={2} align="center">
        <Text>Warning flickered (removed and back within 100ms): {flickers}</Text>
        <Button
          variant="secondary"
          size="sm"
          label="Reset count"
          onClick={() => setFlickers(0)}
        />
      </HStack>
    </VStack>
  );
}

const meta = {
  title: "Components/Form",
  // `Form` itself: its static members (`Form.Item`, ...) are not part of the props.
  component: FormRoot,
  subcomponents: { FormItem, FormItemVisual, FormList, ErrorList },
  args: {
    onFinish: fn(),
    onFinishFailed: fn(),
    onValuesChange: fn(),
  },
  argTypes: {
    layout: { control: "inline-radio", options: ["vertical", "horizontal", "inline"] },
    size: { control: "inline-radio", options: ["small", "middle", "large"] },
  },
  render: (args) => <ProjectForm {...args} />,
} satisfies Meta<typeof FormRoot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HorizontalLayout: Story = {
  args: { layout: "horizontal", labelCol: { span: 8 }, wrapperCol: { span: 16 } },
};

export const List: Story = {
  render: (args) => <MembersForm {...args} />,
};

/**
 * `FormItemVisual`: an item's layout without the form engine, for a field whose
 * value and status the caller manages itself.
 */
export const ItemVisual: Story = {
  render: () => (
    <VStack gap={2} align="stretch" style={{ maxWidth: 480 }}>
      <FormItemVisual
        label="Project name"
        fieldId="visual-name"
        required
        status="error"
        hasFeedback
        errors={["Enter a project name."]}
      >
        <TextInput id="visual-name" status="error" />
      </FormItemVisual>
      <FormItemVisual
        label="Contact email"
        fieldId="visual-email"
        status="warning"
        hasFeedback
        warnings={["This address has not been verified."]}
      >
        <TextInput id="visual-email" status="warning" value="owner@example.com" />
      </FormItemVisual>
      <FormItemVisual
        label="Region"
        fieldId="visual-region"
        status="success"
        hasFeedback
        extra="Closest to your team."
      >
        <TextInput id="visual-region" value="North" />
      </FormItemVisual>
    </VStack>
  ),
};

export const LabelExtra: Story = {
  render: (args) => <LabelExtraForm {...args} />,
};

export const DependentWarning: Story = {
  render: (args) => <DependentWarningForm {...args} />,
};
