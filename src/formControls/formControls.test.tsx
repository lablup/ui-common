/**
 * Every src/formControls wrapper honours Form.Item's contract (#69): one
 * label, linked by the item; one message on error, with the control's own
 * error state; disabled by `<Form disabled>`; required announced without
 * Astryx's "Required" marker; and no `value` needed up front.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cloneElement, useState, type ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Form, type FormInstance } from "../components/Form";
import { Modal } from "../components/Modal";
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
const CASES: Array<[string, ReactElement, string]> = [
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
  control: ReactElement,
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
    // A button (FileInput's and DateRangeInput's triggers) cannot carry
    // aria-required, so Astryx describes it with a visually hidden "Required"
    // instead; that one stays.
    const announced =
      container.querySelector('[aria-required="true"], [required]') !== null ||
      /Required/.test(
        (find(container).getAttribute("aria-describedby") ?? "")
          .split(" ")
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" "),
      );
    expect(announced).toBe(true);
    // Astryx's marker is "∙ Required" in the label.
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

  it("fall back to the item's status when status is empty, as antd's do", async () => {
    const form: { current?: FormInstance } = {};
    const { container } = renderItem(<TextInput status="" />, { required: true, form });
    await act(async () => {
      await form.current!.validateFields().catch(() => {});
    });
    expect(container.querySelector("input")).toHaveAttribute("aria-invalid", "true");
  });

  it("let CheckboxList fill a field that has no initial value", async () => {
    const form: { current?: FormInstance } = {};
    renderItem(
      <CheckboxList>
        <CheckboxListItem value="a" label="Alpha" />
      </CheckboxList>,
      { form },
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Alpha" }));
    expect(form.current!.getFieldValue("field")).toEqual(["a"]);
    expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeChecked();
  });

  it("keep Tokenizer's search alive through a parent re-render while empty", async () => {
    let settle: (items: { id: string; label: string }[]) => void = () => {};
    const search = vi.fn(
      () =>
        new Promise<{ id: string; label: string }[]>((resolve) => {
          settle = resolve;
        }),
    );
    const asyncSource = { search, bootstrap: () => [] };
    let rerender: () => void = () => {};
    function Harness() {
      const [, setTick] = useState(0);
      rerender = () => setTick((n) => n + 1);
      return (
        <Form>
          <Form.Item label="Tags" name="tags">
            <Tokenizer searchSource={asyncSource} debounceMs={0} />
          </Form.Item>
        </Form>
      );
    }
    render(<Harness />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Al" } });
    await waitFor(() => expect(search).toHaveBeenCalled());
    act(() => rerender());
    await act(async () => {
      settle([{ id: "a", label: "Alpha" }]);
    });
    // The menu is a popover, which jsdom never shows, so the option is hidden
    // from the accessibility tree.
    expect(
      await screen.findByRole("option", { name: /Alpha/, hidden: true }),
    ).toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-busy", "true");
  });

  it("take an antd-style status for the border, with no message", () => {
    const { container } = render(<TextInput aria-label="Name" status="warning" />);
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    // Scoped: Astryx's shared live regions outlive a test.
    expect(within(container).queryByRole("alert")).toBeNull();
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

describe.each(CASES)("%s on its own", (_, control, selector) => {
  it("is named by its aria-label, as antd's controls are", () => {
    const { container } = render(
      cloneElement(control as ReactElement<Record<string, unknown>>, {
        id: "field",
        "aria-label": "Standalone",
      }),
    );
    expect(container.querySelector<HTMLElement>(selector)).toHaveAccessibleName(
      /^Standalone(: .*)?$/,
    );
  });
});

describe("form-control parts", () => {
  it("are named after the item's label", () => {
    renderItem(<TextInput hasClear defaultValue="x" />);
    expect(
      screen.getByRole("button", { name: "Clear Field label" }),
    ).toBeInTheDocument();
  });

  it("name NumberInput's steppers after the item's label", () => {
    renderItem(<NumberInput hasNumberSteppers />);
    expect(
      screen.getByRole("button", { name: /Increment Field label/, hidden: true }),
    ).toBeInTheDocument();
  });

  it("name DateTimeInput's time input after the item's label", () => {
    const { container } = renderItem(<DateTimeInput />);
    expect(container.querySelector('[aria-label="Field label time"]')).not.toBeNull();
  });

  it("are named after a standalone aria-label", () => {
    render(<TextInput aria-label="Search" hasClear defaultValue="x" />);
    expect(screen.getByRole("textbox")).toHaveAccessibleName("Search");
    expect(screen.getByRole("button", { name: "Clear Search" })).toBeInTheDocument();
  });
});

describe("form controls without a value (antd's uncontrolled mode)", () => {
  it("keep what the user types, and still report it", async () => {
    const onChange = vi.fn();
    render(<TextInput aria-label="Search" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "abc");
    expect(screen.getByRole("textbox")).toHaveValue("abc");
    expect(onChange).toHaveBeenLastCalledWith("abc", expect.anything());
  });

  it("start at defaultValue", () => {
    render(<TextInput aria-label="Search" defaultValue="hello" />);
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });

  it("let Switch and CheckboxInput toggle, from defaultChecked", async () => {
    render(
      <>
        <Switch aria-label="Dark mode" />
        <CheckboxInput defaultChecked>Agree</CheckboxInput>
      </>,
    );
    await userEvent.click(screen.getByRole("switch", { name: "Dark mode" }));
    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Agree" })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("follow the item again when it resets the field", async () => {
    const form: { current?: FormInstance } = {};
    renderItem(<TextInput />, { form });
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "abc");
    expect(form.current!.getFieldValue("field")).toBe("abc");
    act(() => form.current!.resetFields());
    // The item may remount its control on reset; read the one on screen.
    expect(screen.getByRole("textbox")).toHaveValue("");
    await userEvent.type(screen.getByRole("textbox"), "de");
    act(() => form.current!.setFieldsValue({ field: undefined }));
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});

describe("surfaces that are not part of the item", () => {
  it("keep a nested form's controls out of the outer item's status and name", async () => {
    const form: { current?: FormInstance } = {};
    function Harness() {
      const [instance] = Form.useForm();
      form.current = instance;
      return (
        <Form form={instance}>
          <Form.Item label="Owner" name="owner" rules={[{ required: true }]}>
            <div>
              <Form component={false}>
                <RadioList aria-label="Role">
                  <RadioListItem value="a" label="Admin" />
                </RadioList>
              </Form>
            </div>
          </Form.Item>
        </Form>
      );
    }
    render(<Harness />);
    await act(async () => {
      await form.current!.validateFields().catch(() => {});
    });
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAccessibleName("Role");
    expect(group).not.toHaveAttribute("aria-invalid", "true");
  });

  it("keep a Modal's controls out of the item it opens from", async () => {
    const form: { current?: FormInstance } = {};
    function Harness() {
      const [instance] = Form.useForm();
      form.current = instance;
      return (
        <Form form={instance}>
          <Form.Item label="Owner" name="owner" rules={[{ required: true }]}>
            <Modal isOpen onOpenChange={() => {}}>
              <TextInput aria-label="Search users" />
            </Modal>
          </Form.Item>
        </Form>
      );
    }
    render(<Harness />);
    await act(async () => {
      await form.current!.validateFields().catch(() => {});
    });
    const search = screen.getByRole("textbox", { name: "Search users", hidden: true });
    expect(search).not.toHaveAttribute("aria-invalid", "true");
  });
});
