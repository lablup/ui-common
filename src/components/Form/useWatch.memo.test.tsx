/**
 * `Form.useWatch` in components wrapped in `memo()` or `forwardRef()`. React
 * 19.2 kept such a fiber's first `useEffectEvent` closure
 * (facebook/react#34818), which froze the watcher's value, path, selector and
 * form at their first render.
 */
import { Form, type FormInstance } from "./index";
import { act, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

interface WatcherProps {
  form?: FormInstance;
  index?: number;
  k?: string;
}

type Watcher = React.ComponentType<WatcherProps>;

const show = (value: unknown) =>
  value instanceof Set ? `set:${[...value].join(",")}` : String(value);

/** The hook under test, called in the component's own render. */
type UseWatched = (props: WatcherProps) => unknown;

/** A plain, a memo() and a forwardRef() component that each call `useWatched` itself. */
type Named = [name: string, Watcher: Watcher];

function makeWatchers(
  useWatched: UseWatched,
): [plain: Named, memo: Named, forwardRef: Named] {
  function Plain(props: WatcherProps) {
    return <div data-testid="watched">{show(useWatched(props))}</div>;
  }
  const WithRef = React.forwardRef<HTMLDivElement, WatcherProps>(
    function ForwardRefWatcher(props, ref) {
      return (
        <div ref={ref} data-testid="watched">
          {show(useWatched(props))}
        </div>
      );
    },
  );
  return [
    ["plain", Plain],
    ["memo()", React.memo(Plain)],
    ["forwardRef()", WithRef],
  ];
}

const watched = () => screen.getByTestId("watched");

/** Renders `<Form>` with `initialValues` and returns its instance. */
function makeFormHost(initialValues: Record<string, unknown>) {
  let form!: FormInstance;
  function FormHost({
    children,
  }: {
    children?: (form: FormInstance) => React.ReactNode;
  }) {
    const [instance] = Form.useForm();
    form = instance;
    return (
      <Form form={instance} initialValues={initialValues}>
        {children?.(instance)}
      </Form>
    );
  }
  return { FormHost, getForm: () => form };
}

describe.each(
  makeWatchers(({ form }) => Form.useWatch(["rg"], { form, preserve: true })),
)("Form.useWatch in a %s component", (_name, Watcher) => {
  it("reports a change back to the first value", async () => {
    const { FormHost, getForm } = makeFormHost({ rg: "a" });
    render(<FormHost>{(form) => <Watcher form={form} />}</FormHost>);
    await waitFor(() => expect(watched()).toHaveTextContent("a"));

    await act(async () => getForm().setFieldValue("rg", "b"));
    await waitFor(() => expect(watched()).toHaveTextContent("b"));

    await act(async () => getForm().setFieldValue("rg", "a"));
    await waitFor(() => expect(watched()).toHaveTextContent("a"));
  });
});

describe.each(
  makeWatchers(({ form, index = 0 }) =>
    Form.useWatch(["rows", index], { form, preserve: true }),
  ),
)("Form.useWatch on a dynamic path in a %s component", (_name, Watcher) => {
  it("follows the path when the index changes", async () => {
    const { FormHost, getForm } = makeFormHost({ rows: ["r0", "r1"] });
    const { rerender } = render(
      <FormHost>{(form) => <Watcher form={form} index={0} />}</FormHost>,
    );
    await waitFor(() => expect(watched()).toHaveTextContent("r0"));

    rerender(<FormHost>{(form) => <Watcher form={form} index={1} />}</FormHost>);
    await waitFor(() => expect(watched()).toHaveTextContent("r1"));

    await act(async () => getForm().setFieldValue(["rows", 1], "r1b"));
    await waitFor(() => expect(watched()).toHaveTextContent("r1b"));
  });
});

describe.each(
  makeWatchers(({ form, k = "x" }) =>
    Form.useWatch((values: any) => values?.[k], { form, preserve: true }),
  ),
)("Form.useWatch with an inline selector in a %s component", (_name, Watcher) => {
  it("runs the selector from the latest render", async () => {
    const { FormHost } = makeFormHost({ x: "X", y: "Y" });
    const { rerender } = render(
      <FormHost>{(form) => <Watcher form={form} k="x" />}</FormHost>,
    );
    await waitFor(() => expect(watched()).toHaveTextContent("X"));

    rerender(<FormHost>{(form) => <Watcher form={form} k="y" />}</FormHost>);
    await waitFor(() => expect(watched()).toHaveTextContent("Y"));
  });
});

describe.each(
  makeWatchers(({ form }) => Form.useWatch(["rg"], { form, preserve: true })),
)("Form.useWatch given its form after mount in a %s component", (_name, Watcher) => {
  it("starts watching once the form arrives", async () => {
    const { FormHost, getForm } = makeFormHost({ rg: 1 });
    const Demo = ({ attached }: { attached: boolean }) => (
      <>
        <FormHost />
        <Watcher form={attached ? getForm() : undefined} />
      </>
    );
    const { rerender } = render(<Demo attached={false} />);
    expect(watched()).toHaveTextContent("undefined");

    rerender(<Demo attached />);
    await waitFor(() => expect(watched()).toHaveTextContent("1"));

    await act(async () => getForm().setFieldValue("rg", 2));
    await waitFor(() => expect(watched()).toHaveTextContent("2"));
  });
});

describe("Form.useWatch equality", () => {
  it("reports a Set that gains a member", async () => {
    const [[, Watcher]] = makeWatchers(({ form }) =>
      Form.useWatch(["s"], { form, preserve: true }),
    );
    const { FormHost, getForm } = makeFormHost({ s: new Set([1]) });
    render(<FormHost>{(form) => <Watcher form={form} />}</FormHost>);
    await waitFor(() => expect(watched()).toHaveTextContent("set:1"));

    await act(async () => getForm().setFieldValue("s", new Set([1, 2])));
    await waitFor(() => expect(watched()).toHaveTextContent("set:1,2"));
  });
});
