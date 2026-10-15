/**
 * Every src/formControls wrapper honours Form.Item's contract (#69): one
 * label, linked by the item; one message on error, with the control's own
 * error state; disabled by `<Form disabled>`; required announced without
 * Astryx's "Required" marker; and no `value` needed up front.
 */
import { act, render, screen } from "@testing-library/react";
import type * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Form, type FormInstance } from "../components/Form";
import { CheckboxInput } from "./CheckboxInput";
import { CheckboxList, CheckboxListItem } from "./CheckboxList";
import { DateInput } from "./DateInput";
import { DateRangeInput } from "./DateRangeInput";
import { DateTimeInput } from "./DateTimeInput";
import { FileInput } from "./FileInput";
import { MultiSelector } from "./MultiSelector";
import { NumberInput } from "./NumberInput";
import { RadioList, RadioListItem } from "./RadioList";
import { Selector } from "./Selector";
import { Slider } from "./Slider";
import { Switch } from "./Switch";
import { TextArea } from "./TextArea";
import { TextInput } from "./TextInput";
import { TimeInput } from "./TimeInput";
import { Tokenizer } from "./Tokenizer";
import { createStaticSource, Typeahead } from "./Typeahead";

beforeEach(() => {
  // jsdom has no Popover API; the selectors' surfaces call it on mount.
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
});

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];
const source = createStaticSource([{ id: "a", label: "Alpha" }]);

/** `control` is the element `Form.Item`'s label is meant to name. */
const CASES: Array<[string, React.ReactElement, string]> = [
  ["TextInput", <TextInput />, "input"],
  ["TextArea", <TextArea />, "textarea"],
  ["NumberInput", <NumberInput />, "input"],
  ["Selector", <Selector options={OPTIONS} />, "#field"],
  ["MultiSelector", <MultiSelector options={OPTIONS} />, "#field"],
  ["Typeahead", <Typeahead searchSource={source} />, "input"],
  ["Tokenizer", <Tokenizer searchSource={source} />, "input"],
  ["DateInput", <DateInput />, "#field"],
  ["TimeInput", <TimeInput />, "#field"],
  ["DateTimeInput", <DateTimeInput />, "#field"],
  ["DateRangeInput", <DateRangeInput />, "#field"],
  ["Switch", <Switch />, "#field"],
  ["CheckboxInput", <CheckboxInput />, "#field"],
  [
    "CheckboxList",
    <CheckboxList>
      <CheckboxListItem value="a" label="Alpha" />
    </CheckboxList>,
    "[role=group]",
  ],
  [
    "RadioList",
    <RadioList>
      <RadioListItem value="a" label="Alpha" />
    </RadioList>,
    "[role=radiogroup]",
  ],
  ["Slider", <Slider />, "[role=slider]"],
  ["FileInput", <FileInput />, "button"],
];

function renderItem(
  control: React.ReactElement,
  {
    disabled,
    required,
    form,
  }: { disabled?: boolean; required?: boolean; form?: { current?: FormInstance } } = {},
) {
  function Harness() {
    const [instance] = Form.useForm();
    if (form) form.current = instance;
    return (
      <Form form={instance} disabled={disabled}>
        <Form.Item
          label="Field label"
          name="field"
          rules={required ? [{ required: true, message: "Fill this in." }] : []}
        >
          {control}
        </Form.Item>
      </Form>
    );
  }
  return render(<Harness />);
}

describe.each(CASES)("%s in Form.Item", (_, control, selector) => {
  const find = (container: HTMLElement) =>
    container.querySelector<HTMLElement>(selector)!;

  it("renders with no value, named once by the item's label", () => {
    const { container } = renderItem(control);
    const el = find(container);
    expect(el).toBeInTheDocument();
    // DateRangeInput's trigger adds its state after the label, as Astryx's does.
    expect(el).toHaveAccessibleName(/^Field label(: .*)?$/);
  });

  it("shows one message on error and marks the control invalid", async () => {
    const form: { current?: FormInstance } = {};
    const { container } = renderItem(control, { required: true, form });
    await act(async () => {
      await form.current!.validateFields().catch(() => {});
    });
    expect(screen.getAllByText("Fill this in.")).toHaveLength(1);
    const invalid = container.querySelector('[aria-invalid="true"]');
    expect(invalid).not.toBeNull();
  });

  it("announces required without Astryx's Required marker", () => {
    const { container } = renderItem(control, { required: true });
    expect(
      container.querySelector('[aria-required="true"], [required]'),
    ).not.toBeNull();
    // Astryx's marker is "∙ Required" in the label. (DateRangeInput's trigger is
    // a button, which cannot carry aria-required, so Astryx describes it with a
    // visually hidden "Required" instead; that one stays.)
    expect(screen.queryByText("∙", { exact: false })).toBeNull();
  });

  it("is disabled by <Form disabled>", () => {
    const { container } = renderItem(control, { disabled: true });
    expect(
      container.querySelector('[disabled], [aria-disabled="true"], [data-disabled]'),
    ).not.toBeNull();
  });
});

describe("form-control wrappers", () => {
  it("keep focus while an error appears: the tree does not change shape", async () => {
    const form: { current?: FormInstance } = {};
    const { container } = renderItem(<TextInput />, { required: true, form });
    const input = container.querySelector("input")!;
    input.focus();
    await act(async () => {
      await form.current!.validateFields().catch(() => {});
    });
    expect(container.querySelector("input")).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("take an antd-style status for the border, with no message", () => {
    render(<TextInput aria-label="Name" status="warning" />);
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("let Switch and CheckboxInput take checked and children, as antd's do", () => {
    function Harness() {
      return (
        <Form initialValues={{ on: true, agree: true }}>
          <Form.Item label="Notifications" name="on" valuePropName="checked">
            <Switch>Email me</Switch>
          </Form.Item>
          <Form.Item name="agree" valuePropName="checked">
            <CheckboxInput>I agree</CheckboxInput>
          </Form.Item>
        </Form>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("switch", { name: /Notifications/ })).toBeChecked();
    expect(screen.getByRole("switch")).toHaveAccessibleName(/Email me/);
    expect(screen.getByRole("checkbox", { name: "I agree" })).toBeChecked();
  });
});
