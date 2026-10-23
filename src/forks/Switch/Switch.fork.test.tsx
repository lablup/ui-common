/**
 * ui-common's tests for its Switch fork: the fix it carries (a passed `id`
 * reaches the native checkbox, so an outside `<label htmlFor>` names and
 * toggles it), that a passed `aria-describedby` describes it (upstream's
 * since Astryx 0.7.2, which Form.Item relies on), and that everything else
 * renders exactly as Astryx's does.
 */
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch as UpstreamSwitch } from "@astryxdesign/core/Switch";

import { Form } from "../../components/Form";
import { comparableMarkup } from "../../test/forkParity";
import { Switch, type SwitchProps } from "./Switch";

type Props = Partial<SwitchProps>;

describe("Switch fork: a passed id", () => {
  it("lands on the native checkbox", () => {
    render(
      <Switch label="Notifications" value={false} onChange={() => {}} id="field" />,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("id", "field");
  });

  it("falls back to a generated id without one", () => {
    render(<Switch label="Notifications" value={false} onChange={() => {}} />);
    expect(screen.getByRole("switch").id).not.toBe("");
  });

  it("lets an outside label name and toggle it", async () => {
    const onChange = vi.fn();
    render(
      <>
        <label htmlFor="field">Outside</label>
        <Switch
          label="Notifications"
          isLabelHidden
          value={false}
          onChange={onChange}
          id="field"
        />
      </>,
    );
    expect(screen.getByRole("switch")).toHaveAccessibleName(/Outside/);
    await userEvent.click(screen.getByText("Outside"));
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("is what Form.Item's label points at", async () => {
    render(
      <Form initialValues={{ flag: false }}>
        <Form.Item label="Flag" name="flag">
          <Switch
            label="Notifications"
            isLabelHidden
            onChange={() => {}}
            value={false}
          />
        </Form.Item>
      </Form>,
    );
    const control = screen.getByRole("switch");
    expect(control).toHaveAttribute("id", "flag");
    await userEvent.click(screen.getByText("Flag"));
    expect(control).toBeChecked();
  });
});

describe("Switch: a passed aria-describedby", () => {
  it("describes the native checkbox, ahead of the switch's own ids", () => {
    render(
      <>
        <p id="hint">Sent weekly.</p>
        <Switch
          label="Notifications"
          description="Email only"
          value={false}
          onChange={() => {}}
          aria-describedby="hint"
        />
      </>,
    );
    const control = screen.getByRole("switch");
    expect(control.getAttribute("aria-describedby")).toMatch(/^hint /);
    expect(control).toHaveAccessibleDescription(/^Sent weekly\. Email only/);
  });

  it("carries Form.Item's message and extra", async () => {
    const { container } = render(
      <Form>
        <Form.Item
          label="Accept"
          name="accept"
          extra="Read the terms"
          rules={[{ required: true, message: "Must accept." }]}
        >
          <Switch label="Accept" isLabelHidden value={false} onChange={() => {}} />
        </Form.Item>
      </Form>,
    );
    const form = container.querySelector("form")!;
    await act(async () => {
      form.requestSubmit();
    });
    const control = await screen.findByRole("switch");
    await waitFor(() =>
      expect(control).toHaveAccessibleDescription(/Must accept\..*Read the terms/),
    );
  });
});

describe("Switch fork: parity with Astryx", () => {
  const cases: Array<[string, Props]> = [
    ["off", {}],
    ["on", { value: true }],
    ["small, disabled", { size: "sm", isDisabled: true }],
    [
      "a status and a description",
      { status: { type: "error", message: "Required" }, description: "Help" },
    ],
    ["a hidden label, required", { isLabelHidden: true, isRequired: true }],
  ];

  it.each(cases)("renders Astryx's markup with %s", (_, props) => {
    const fork = render(
      <Switch label="Notifications" value={false} onChange={() => {}} {...props} />,
    );
    const upstream = render(
      <UpstreamSwitch
        label="Notifications"
        value={false}
        onChange={() => {}}
        {...(props as object)}
      />,
    );
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });

  // When this fails, Astryx has shipped the fix: delete the fork and its
  // exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from Astryx's, which drops the id", () => {
    render(
      <UpstreamSwitch
        label="Notifications"
        value={false}
        onChange={() => {}}
        id="field"
      />,
    );
    expect(screen.getByRole("switch")).not.toHaveAttribute("id", "field");
  });
});
