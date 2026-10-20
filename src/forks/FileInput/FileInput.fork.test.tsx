/**
 * ui-common's tests for its FileInput fork: the fix it carries (the ARIA
 * props and focus handlers reach the trigger button, not the hidden native
 * input), and that everything else renders exactly as Astryx's does.
 */
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileInput as UpstreamFileInput } from "@astryxdesign/core/FileInput";

import { Form, type FormInstance } from "../../components/Form";
import { comparableMarkup } from "../../test/forkParity";
import { FileInput, type FileInputProps } from "./FileInput";

type Props = Partial<FileInputProps>;

const trigger = () => screen.getByRole("button", { name: /Upload/ });
const nativeInput = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="file"]')!;

describe("FileInput fork: the trigger carries the ARIA props", () => {
  it("merges a passed aria-describedby ahead of its own ids", () => {
    const { container } = render(
      <>
        <p id="hint">PNG only.</p>
        <FileInput
          label="Upload"
          description="Up to 1 MB"
          value={null}
          onChange={() => {}}
          aria-describedby="hint"
        />
      </>,
    );
    expect(trigger().getAttribute("aria-describedby")).toMatch(/^hint /);
    expect(trigger()).toHaveAccessibleDescription(/^PNG only\. Up to 1 MB/);
    expect(nativeInput(container)).not.toHaveAttribute("aria-describedby");
  });

  it("is invalid when told so, without a status", () => {
    render(
      <FileInput label="Upload" value={null} onChange={() => {}} aria-invalid="true" />,
    );
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
  });

  it("announces aria-required as its visually hidden Required", () => {
    render(
      <FileInput
        label="Upload"
        value={null}
        onChange={() => {}}
        aria-required="true"
      />,
    );
    expect(trigger()).toHaveAccessibleDescription(/Required/);
  });

  it("takes the focus handlers", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <FileInput
        label="Upload"
        value={null}
        onChange={() => {}}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    fireEvent.focus(trigger());
    fireEvent.blur(trigger());
    expect(onFocus).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("leaves data-* on the native input", () => {
    const { container } = render(
      <FileInput
        label="Upload"
        value={null}
        onChange={() => {}}
        data-testid="upload"
      />,
    );
    expect(nativeInput(container)).toHaveAttribute("data-testid", "upload");
    expect(trigger()).not.toHaveAttribute("data-testid");
  });
});

describe("FileInput fork: in a Form.Item", () => {
  function renderItem(form: { current?: FormInstance }) {
    function Harness() {
      const [instance] = Form.useForm();
      form.current = instance;
      return (
        <Form form={instance}>
          <Form.Item
            label="Avatar"
            name="avatar"
            extra="PNG only"
            validateTrigger="onBlur"
            rules={[{ required: true, message: "Pick one." }]}
          >
            <FileInput label="Upload" isLabelHidden value={null} onChange={() => {}} />
          </Form.Item>
        </Form>
      );
    }
    return render(<Harness />);
  }

  it("describes the trigger with the item's message and extra", async () => {
    const form: { current?: FormInstance } = {};
    renderItem(form);
    await act(async () => {
      await form.current!.validateFields().catch(() => {});
    });
    expect(trigger()).toHaveAttribute("aria-invalid", "true");
    expect(trigger()).toHaveAccessibleDescription(/Pick one\..*PNG only/);
  });

  it("validates when the trigger loses focus", async () => {
    renderItem({});
    fireEvent.blur(trigger());
    await waitFor(() => expect(screen.getByText("Pick one.")).toBeInTheDocument());
  });

  it("is what focusField lands on", () => {
    const form: { current?: FormInstance } = {};
    renderItem(form);
    act(() => form.current!.focusField("avatar"));
    expect(trigger()).toHaveFocus();
  });
});

describe("FileInput fork: parity with Astryx", () => {
  const cases: Array<[string, Props]> = [
    ["nothing attached", {}],
    ["a file", { value: new File(["x"], "a.png", { type: "image/png" }) }],
    ["the dropzone, disabled", { mode: "dropzone", isDisabled: true }],
    [
      "a status and a description",
      { status: { type: "error", message: "Too big" }, description: "Help" },
    ],
    ["a hidden label, required", { isLabelHidden: true, isRequired: true }],
    ["busy", { isLoading: true }],
  ];

  it.each(cases)("renders Astryx's markup with %s", (_, props) => {
    const fork = render(
      <FileInput label="Upload" value={null} onChange={() => {}} {...props} />,
    );
    const upstream = render(
      <UpstreamFileInput
        label="Upload"
        value={null}
        onChange={() => {}}
        {...(props as object)}
      />,
    );
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });

  // When this fails, Astryx has shipped the fix: delete the fork and its
  // provenance.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from Astryx's, which puts aria-describedby on the hidden input", () => {
    render(
      <UpstreamFileInput
        label="Upload"
        value={null}
        onChange={() => {}}
        aria-describedby="hint"
      />,
    );
    expect(trigger()).not.toHaveAttribute("aria-describedby", "hint");
  });
});
