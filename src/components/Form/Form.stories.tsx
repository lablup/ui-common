import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "../../astryx/Button";
import { Selector } from "../../astryx/Selector";
import { HStack, VStack } from "../../astryx/Stack";
import { Text } from "../../astryx/Text";
import { TextInput, type TextInputProps } from "../../astryx/TextInput";
import { StepNumberInput } from "../StepNumberInput";
import FormRoot from "./Form";
import {
  ErrorList,
  Form,
  FormItem,
  FormItemVisual,
  FormList,
  type FormProps,
} from "./index";

/**
 * `TextInput` requires `value`; inside `Form.Item` the item supplies it, so
 * the field takes it as optional.
 */
function TextField({
  value,
  ...props
}: Omit<TextInputProps, "value"> & { value?: string }) {
  return <TextInput {...props} value={value ?? ""} />;
}

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
          <TextField label="Project name" isLabelHidden placeholder="my-project" />
        </FormItem>
        <FormItem
          name="email"
          label="Contact email"
          tooltip="Notifications about this project go here."
          rules={[{ type: "email", message: "Enter a valid email address." }]}
        >
          <TextField
            label="Contact email"
            isLabelHidden
            type="email"
            placeholder="owner@example.com"
          />
        </FormItem>
        <FormItem
          name="region"
          label="Region"
          rules={[{ required: true, message: "Choose a region." }]}
        >
          <Selector
            label="Region"
            isLabelHidden
            options={REGIONS}
            placeholder="Select a region"
          />
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
                  <TextField label={`Member ${index + 1}`} isLabelHidden />
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
        <Selector
          label="Region"
          isLabelHidden
          options={options}
          placeholder="Select a region"
        />
      </FormItem>
    </Form>
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
        required
        status="error"
        hasFeedback
        errors={["Enter a project name."]}
      >
        <TextField label="Project name" isLabelHidden />
      </FormItemVisual>
      <FormItemVisual
        label="Contact email"
        status="warning"
        hasFeedback
        warnings={["This address has not been verified."]}
      >
        <TextField label="Contact email" isLabelHidden value="owner@example.com" />
      </FormItemVisual>
      <FormItemVisual
        label="Region"
        status="success"
        hasFeedback
        extra="Closest to your team."
      >
        <TextField label="Region" isLabelHidden value="North" />
      </FormItemVisual>
    </VStack>
  ),
};

export const LabelExtra: Story = {
  render: (args) => <LabelExtraForm {...args} />,
};
