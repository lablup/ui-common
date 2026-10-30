/**
 * `Form.useWatch` reports a change back to a value it has already seen, in a
 * plain component and in one wrapped in `memo()` or `forwardRef()`. React 19.2
 * kept the first render's `useEffectEvent` closure for the latter two
 * (facebook/react#34818), which hid an A → B → A change.
 */
import { Form, type FormInstance } from "./index";
import { act, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

interface WatcherProps {
  form: FormInstance;
}

function PlainWatcher({ form }: WatcherProps) {
  const value = Form.useWatch(["rg"], { form, preserve: true });
  return <div data-testid="watched">{String(value)}</div>;
}

const MemoWatcher = React.memo(PlainWatcher);

const ForwardRefWatcher = React.forwardRef<HTMLDivElement, WatcherProps>(
  function ForwardRefWatcher(props, ref) {
    const value = Form.useWatch(["rg"], { form: props.form, preserve: true });
    return (
      <div ref={ref} data-testid="watched">
        {String(value)}
      </div>
    );
  },
);

const WATCHERS: [name: string, Watcher: React.ComponentType<WatcherProps>][] = [
  ["plain", PlainWatcher],
  ["memo()", MemoWatcher],
  ["forwardRef()", ForwardRefWatcher],
];

describe.each(WATCHERS)("Form.useWatch in a %s component", (_name, Watcher) => {
  it("reports a change back to the first value", async () => {
    let form!: FormInstance;
    const Demo = () => {
      const [instance] = Form.useForm();
      form = instance;
      return (
        <Form form={instance} initialValues={{ rg: "a" }}>
          <Watcher form={instance} />
        </Form>
      );
    };
    render(<Demo />);
    await waitFor(() => expect(screen.getByTestId("watched")).toHaveTextContent("a"));

    await act(async () => {
      form.setFieldValue("rg", "b");
    });
    await waitFor(() => expect(screen.getByTestId("watched")).toHaveTextContent("b"));

    await act(async () => {
      form.setFieldValue("rg", "a");
    });
    await waitFor(() => expect(screen.getByTestId("watched")).toHaveTextContent("a"));
  });
});
