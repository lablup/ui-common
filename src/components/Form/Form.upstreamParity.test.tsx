/**
 * Points where the engine follows rc-field-form / antd and a port could
 * drift: a nested form's disabled state, a control that reports twice in one
 * tick, and a `dependencies` item without a field of its own.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Form, type FormInstance } from "./index";

afterEach(() => {
  vi.restoreAllMocks();
});

function useCapture(form: { current?: FormInstance }) {
  const [instance] = Form.useForm();
  form.current = instance;
  return instance;
}

describe("Form, as rc-field-form and antd have it", () => {
  it("disables a nested form from the form around it", () => {
    render(
      <Form disabled>
        <Form component={false}>
          <Form.Item name="x" label="X">
            <input />
          </Form.Item>
        </Form>
      </Form>,
    );
    expect(screen.getByRole("textbox", { name: "X" })).toBeDisabled();
  });

  it("lets a nested form say it is not disabled", () => {
    render(
      <Form disabled>
        <Form component={false} disabled={false}>
          <Form.Item name="x" label="X">
            <input />
          </Form.Item>
        </Form>
      </Form>,
    );
    expect(screen.getByRole("textbox", { name: "X" })).toBeEnabled();
  });

  it("keeps the last of two changes a control reports in one tick", async () => {
    const form: { current?: FormInstance } = {};
    // A control that reports a raw value, then the one it normalised it to.
    function Twice({
      onChange,
    }: {
      value?: string;
      onChange?: (next: string) => void;
    }) {
      return (
        <button
          type="button"
          onClick={() => {
            onChange?.("b");
            onChange?.("a");
          }}
        >
          set
        </button>
      );
    }
    function Harness() {
      const instance = useCapture(form);
      return (
        <Form form={instance} initialValues={{ x: "a" }}>
          <Form.Item name="x">
            <Twice />
          </Form.Item>
        </Form>
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "set" }));
    expect(form.current!.getFieldValue("x")).toBe("a");
    expect(form.current!.isFieldTouched("x")).toBe(true);
  });

  it("renders nothing for a `dependencies` item with an element child and no name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const form: { current?: FormInstance } = {};
    function Harness() {
      const instance = useCapture(form);
      return (
        <Form form={instance} initialValues={{ a: 1 }}>
          <Form.Item name="a">
            <input aria-label="A" />
          </Form.Item>
          <Form.Item dependencies={["a"]}>
            <input aria-label="Dependent" />
          </Form.Item>
        </Form>
      );
    }
    render(<Harness />);
    expect(screen.queryByRole("textbox", { name: "Dependent" })).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Must set `name` or use a render function"),
    );
    await act(async () => {
      await userEvent.type(screen.getByRole("textbox", { name: "A" }), "2");
    });
    expect(form.current!.getFieldsValue(true)).toEqual({ a: "12" });
  });
});
