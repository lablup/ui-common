/**
 * ui-common's tests for its CheckboxInput fork: the fix it carries (a passed `id`
 * reaches the native checkbox, so an outside `<label htmlFor>` names and
 * toggles it), and that everything else renders exactly as Astryx's does.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckboxInput as UpstreamCheckboxInput } from "@astryxdesign/core/CheckboxInput";

import { Form } from "../../components/Form";
import { comparableMarkup } from "../../test/forkParity";
import { CheckboxInput, type CheckboxInputProps } from "./CheckboxInput";

type Props = Partial<CheckboxInputProps>;

describe("CheckboxInput fork: a passed id", () => {
  it("lands on the native checkbox", () => {
    render(
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        id="field"
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("id", "field");
  });

  it("falls back to a generated id without one", () => {
    render(<CheckboxInput label="Accept terms" value={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox").id).not.toBe("");
  });

  it("lets an outside label name and toggle it", async () => {
    const onChange = vi.fn();
    render(
      <>
        <label htmlFor="field">Outside</label>
        <CheckboxInput
          label="Accept terms"
          isLabelHidden
          value={false}
          onChange={onChange}
          id="field"
        />
      </>,
    );
    expect(screen.getByRole("checkbox")).toHaveAccessibleName(/Outside/);
    await userEvent.click(screen.getByText("Outside"));
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("is what Form.Item's label points at", async () => {
    render(
      <Form initialValues={{ flag: false }}>
        <Form.Item label="Flag" name="flag">
          <CheckboxInput
            label="Accept terms"
            isLabelHidden
            onChange={() => {}}
            value={false}
          />
        </Form.Item>
      </Form>,
    );
    const control = screen.getByRole("checkbox");
    expect(control).toHaveAttribute("id", "flag");
    await userEvent.click(screen.getByText("Flag"));
    expect(control).toBeChecked();
  });
});

describe("CheckboxInput fork: parity with Astryx", () => {
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
      <CheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        {...props}
      />,
    );
    const upstream = render(
      <UpstreamCheckboxInput
        label="Accept terms"
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
      <UpstreamCheckboxInput
        label="Accept terms"
        value={false}
        onChange={() => {}}
        id="field"
      />,
    );
    expect(screen.getByRole("checkbox")).not.toHaveAttribute("id", "field");
  });
});
