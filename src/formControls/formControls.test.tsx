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
import { cloneElement, useState, type ComponentProps, type ReactElement } from "react";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { Form, type FormInstance } from "../components/Form";
import { Modal } from "../components/Modal";
import { Popover } from "../components/Popover";
import { CheckboxInput } from "./CheckboxInput";
import { CheckboxList, CheckboxListItem } from "./CheckboxList";
import { DateInput } from "./DateInput";
import { DateRangeInput } from "./DateRangeInput";
import { DateTimeInput } from "./DateTimeInput";
import { FileInput } from "./FileInput";
import { MultiSelector } from "./MultiSelector";
import { NumberInput } from "./NumberInput";
import { RadioList, RadioListItem } from "./RadioList";
import { SegmentedControl, SegmentedControlItem } from "./SegmentedControl";
import { Selector } from "./Selector";
import { Slider } from "./Slider";
import { Switch } from "./Switch";
import { TagsInput } from "./TagsInput";
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
  ["TagsInput", <TagsInput />, "input"],
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
  [
    "SegmentedControl",
    <SegmentedControl>
      <SegmentedControlItem value="a" label="Alpha" />
    </SegmentedControl>,
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
    validateTrigger,
  }: {
    disabled?: boolean;
    required?: boolean;
    form?: { current?: FormInstance };
    validateTrigger?: string;
  } = {},
) {
  function Harness() {
    const [instance] = Form.useForm();
    if (form) form.current = instance;
    return (
      <Form form={instance} disabled={disabled}>
        <Form.Item
          label="Field label"
          name="field"
          validateTrigger={validateTrigger}
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

  it('validates when focus leaves it, with validateTrigger="onBlur"', async () => {
    const { container } = renderItem(control, {
      required: true,
      validateTrigger: "onBlur",
    });
    // The control the item names, or the first focusable part of it.
    const FOCUSABLE =
      'input:not([type=hidden]):not([aria-hidden=true]), textarea, button, [tabindex="0"]';
    const el = find(container);
    const focusable = el.matches(FOCUSABLE)
      ? el
      : el.querySelector<HTMLElement>(FOCUSABLE)!;
    act(() => focusable.focus());
    act(() => focusable.blur());
    expect(await screen.findByText("Fill this in.")).toBeInTheDocument();
  });

  it("takes focus from form.focusField, as the first error does", () => {
    const form: { current?: FormInstance } = {};
    const { container } = renderItem(control, { form });
    act(() => form.current!.focusField("field"));
    expect(container.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(container);
  });
});

describe("form-control wrappers", () => {
  it("let focusField land on SegmentedControl's selected segment", () => {
    const form: { current?: FormInstance } = {};
    renderItem(
      <SegmentedControl>
        <SegmentedControlItem value="a" label="Alpha" />
        <SegmentedControlItem value="b" label="Beta" />
      </SegmentedControl>,
      { form },
    );
    act(() => form.current!.setFieldsValue({ field: "b" }));
    act(() => form.current!.focusField("field"));
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Beta" }));
  });

  it("let SegmentedControl's status mark it invalid on its own", () => {
    render(
      <SegmentedControl aria-label="View" status="error">
        <SegmentedControlItem value="a" label="Alpha" />
      </SegmentedControl>,
    );
    expect(screen.getByRole("radiogroup", { name: "View" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

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

  it("let TextInput take maxLength, as antd's Input does", () => {
    render(<TextInput aria-label="Code" maxLength={4} />);
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveAttribute(
      "maxlength",
      "4",
    );
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
            <Modal
              isOpen
              onOpenChange={() => {}}
              title="Pick"
              footer={<TextInput aria-label="Note" />}
            >
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
    // The footer and header slots are outside the body but inside the Modal.
    const note = screen.getByRole("textbox", { name: "Note", hidden: true });
    expect(note).not.toHaveAttribute("aria-invalid", "true");
  });

  it("keep a Popover's controls out of the item it opens from", async () => {
    const form: { current?: FormInstance } = {};
    function Harness() {
      const [instance] = Form.useForm();
      form.current = instance;
      return (
        <Form form={instance}>
          <Form.Item label="Owner" name="owner" rules={[{ required: true }]}>
            <Popover
              label="Filter"
              isOpen
              onOpenChange={() => {}}
              content={<TextInput aria-label="Search users" />}
            >
              <button type="button">Filter</button>
            </Popover>
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

describe("form-control types", () => {
  // Checked by `tsc`: an inline `onChange` is typed from the props, as on
  // Astryx's controls, instead of an implicit any.
  it("type an inline onChange from the branch the props pick", () => {
    render(
      <>
        <Selector
          aria-label="a"
          options={OPTIONS}
          onChange={(v) => expectTypeOf(v).toEqualTypeOf<string>()}
        />
        <Selector
          aria-label="b"
          options={OPTIONS}
          hasClear
          onChange={(v) => expectTypeOf(v).toEqualTypeOf<string | null>()}
        />
        <NumberInput
          aria-label="c"
          onChange={(v) => expectTypeOf(v).toEqualTypeOf<number | null>()}
        />
        <Slider
          aria-label="d"
          onChange={(v) => expectTypeOf(v).toEqualTypeOf<number>()}
        />
        <Slider
          aria-label="e"
          defaultValue={[1, 2]}
          onChange={(v) => expectTypeOf(v).toEqualTypeOf<[number, number]>()}
        />
      </>,
    );
    expect(screen.getAllByRole("slider")).toHaveLength(3);
  });
});

/** The `--x-width` each Astryx field under `root` was given, in order. */
function fieldWidths(root: ParentNode) {
  return [...root.querySelectorAll<HTMLElement>("[style]")]
    .map((el) => el.style.getPropertyValue("--x-width"))
    .filter(Boolean);
}

/**
 * Each wrapper's width inside a `Form.Item` when none is passed: what its antd
 * counterpart renders there (`IN_ITEM_WIDTH` in ./formControl.tsx). `null`
 * means no width is set.
 */
const NOT_FIT_CONTENT: Record<string, string | null> = {
  TextInput: "100%",
  TextArea: "100%",
  NumberInput: "90px",
  Selector: "100%",
  MultiSelector: "100%",
  Typeahead: "100%",
  Tokenizer: "100%",
  TagsInput: "100%",
  Slider: null,
  SegmentedControl: null,
};

type Sizable = ReactElement<{ width?: number; "aria-label"?: string }>;

const ITEM_WIDTHS: Array<[string, Sizable, string | null]> = [
  ...CASES.map(([name, control]): [string, Sizable, string | null] => [
    name,
    control as Sizable,
    name in NOT_FIT_CONTENT ? (NOT_FIT_CONTENT[name] ?? null) : "fit-content",
  ]),
  ["FileInput (dropzone)", <FileInput mode="dropzone" />, "100%"],
];

describe("size a control inside a Form.Item as antd does, and only there", () => {
  it.each(ITEM_WIDTHS)("%s inside a Form.Item", (_, control, expected) => {
    const { container } = render(
      <Form>
        <Form.Item name="x" label="X">
          {control}
        </Form.Item>
      </Form>,
    );
    expect(fieldWidths(container)).toEqual(expected ? [expected] : []);
  });

  it.each(ITEM_WIDTHS)("%s keeps Astryx's width outside one", (_, control) => {
    const { container } = render(
      <Form>{cloneElement(control, { "aria-label": "Standalone" })}</Form>,
    );
    expect(fieldWidths(container)).toEqual([]);
  });

  it.each(ITEM_WIDTHS.filter(([name]) => name !== "SegmentedControl"))(
    "%s takes an explicit width, inside a Form.Item and outside",
    (_, control) => {
      const sized = cloneElement(control, { width: 123 });
      const { container } = render(
        <Form>
          <Form.Item name="x" label="X">
            {sized}
          </Form.Item>
          {cloneElement(sized, { "aria-label": "Standalone" })}
        </Form>,
      );
      expect(fieldWidths(container)).toEqual(["123px", "123px"]);
    },
  );

  it("let an explicit width win, inside a Form.Item and outside", () => {
    const { container } = render(
      <Form>
        <Form.Item name="x" label="X">
          <Selector width={120} options={OPTIONS} />
        </Form.Item>
        <Form.Item name="y" label="Y">
          <TextInput width="50%" />
        </Form.Item>
        <Selector aria-label="s" width={160} options={OPTIONS} />
        <TextInput aria-label="t" width={200} />
      </Form>,
    );
    expect(fieldWidths(container)).toEqual(["120px", "50%", "160px", "200px"]);
  });

  it("fill a noStyle item inside a styled one, not a noStyle item alone", () => {
    const { container } = render(
      <Form>
        <Form.Item label="Range">
          <Form.Item name="from" noStyle>
            <Selector aria-label="From" options={OPTIONS} />
          </Form.Item>
        </Form.Item>
        <Form.Item name="query" noStyle>
          <TextInput aria-label="Query" />
        </Form.Item>
      </Form>,
    );
    expect(fieldWidths(container)).toEqual(["100%"]);
  });

  it("keep a Modal's controls from filling the item it opens from", () => {
    const modal = (
      <Modal isOpen onOpenChange={() => {}} title="Pick">
        <TextInput aria-label="Search users" />
      </Modal>
    );
    // The widths the Modal gives its own parts, with no item around it.
    const alone = render(<Form>{modal}</Form>);
    const expected = fieldWidths(screen.getByRole("dialog", { hidden: true }));
    alone.unmount();
    render(
      <Form>
        <Form.Item label="Owner" name="owner">
          {modal}
        </Form.Item>
      </Form>,
    );
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(fieldWidths(dialog)).toEqual(expected);
  });
});

describe("what a host app's adapter used to add", () => {
  it("show MultiSelector's selection, not a count", () => {
    render(<MultiSelector aria-label="Tags" options={OPTIONS} value={["a", "b"]} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Alpha, Beta");
  });

  it("let NumberInput report null when emptied, as antd's InputNumber does", async () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="Count" value={5} onChange={onChange} />);
    const input = screen.getByRole("spinbutton", { name: "Count" });
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("let NumberInput read a numeric string", () => {
    render(<NumberInput aria-label="Port" value="8080" />);
    expect(screen.getByRole("spinbutton", { name: "Port" })).toHaveValue("8080");
  });

  it("let NumberInput take NaN without re-rendering forever", () => {
    render(<NumberInput aria-label="Ratio" value={NaN} />);
    expect(screen.getByRole("spinbutton", { name: "Ratio" })).toHaveValue("");
  });

  it("round a decimal typed into an integer NumberInput", async () => {
    const onChange = vi.fn();
    render(
      <NumberInput aria-label="Replicas" isIntegerOnly max={10} onChange={onChange} />,
    );
    await userEvent.type(screen.getByRole("spinbutton", { name: "Replicas" }), "2.6");
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});

describe("TagsInput", () => {
  function renderTags(props: Partial<ComponentProps<typeof TagsInput>> = {}) {
    const form: { current?: FormInstance } = {};
    function Harness() {
      const [instance] = Form.useForm();
      form.current = instance;
      return (
        <Form form={instance}>
          <Form.Item label="Hosts" name="hosts">
            <TagsInput {...props} />
          </Form.Item>
          <button type="button">Elsewhere</button>
        </Form>
      );
    }
    render(<Harness />);
    return form;
  }

  it("holds the tags as strings, one per separator typed", async () => {
    const form = renderTags({ tokenSeparators: [",", " "] });
    const input = screen.getByRole("combobox", { name: "Hosts" });
    // fireEvent, not userEvent: user-event keeps its own copy of the text and
    // misses the input being emptied.
    for (const [text, separator] of [
      ["a", ","],
      ["b", " "],
      ["c", ","],
    ]) {
      fireEvent.change(input, { target: { value: text } });
      fireEvent.keyDown(input, { key: separator });
      expect(input).toHaveValue("");
    }
    expect(form.current!.getFieldValue("hosts")).toEqual(["a", "b", "c"]);
  });

  it("splits a pasted entry when it is committed, dropping duplicates", async () => {
    const form = renderTags({ tokenSeparators: [","], defaultValue: ["a"] });
    const input = screen.getByRole("combobox", { name: "Hosts" });
    await userEvent.click(input);
    await userEvent.paste("a,b,c");
    await userEvent.keyboard("{Enter}");
    expect(form.current!.getFieldValue("hosts")).toEqual(["a", "b", "c"]);
  });

  it("keeps text left in the input when focus leaves", async () => {
    const form = renderTags();
    await userEvent.type(screen.getByRole("combobox", { name: "Hosts" }), "left");
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(form.current!.getFieldValue("hosts")).toEqual(["left"]);
  });

  it("keeps the other tags as they are when one is removed", async () => {
    const form = renderTags({
      tokenSeparators: [","],
      defaultValue: ["a,b", "x", "y"],
    });
    await userEvent.click(screen.getByRole("button", { name: /Remove x/ }));
    expect(form.current!.getFieldValue("hosts")).toEqual(["a,b", "y"]);
  });

  it("labels the create row with ui-common's message", async () => {
    renderTags();
    await userEvent.type(screen.getByRole("combobox", { name: "Hosts" }), "new");
    expect(
      await screen.findByRole("option", { name: 'Create "new"', hidden: true }),
    ).toBeInTheDocument();
  });
});
