/**
 * Tests for Select, written as part of its admission (issue #16).
 *
 * Neither product that shipped this component had a test for it, which is what
 * rule 3 in CONTRIBUTING.md exists to prevent: a shared component nobody can
 * safely change is worse than two copies nobody shares.
 *
 * The listbox is portalled to the body, so queries go through `screen` rather
 * than the render container.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Select } from "./Select";
import type { SelectOption } from "./Select";

const OPTIONS: SelectOption[] = [
  { value: "eu", label: "Frankfurt", description: "eu-central-1" },
  { value: "us", label: "Oregon", description: "us-west-2" },
  { value: "ap", label: "Seoul", description: "ap-northeast-2" },
];

function renderSelect(props: Partial<Parameters<typeof Select>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <Select
      value="eu"
      onChange={onChange}
      options={OPTIONS}
      aria-label="Region"
      {...props}
    />,
  );
  return { onChange, trigger: screen.getByRole("button", { name: /region/i }) };
}

describe("Select", () => {
  it("shows the selected option and opens on click", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect();

    expect(trigger).toHaveTextContent("Frankfurt");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("reports the current choice to assistive technology", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect();
    await user.click(trigger);

    expect(screen.getByRole("option", { name: /Frankfurt/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: /Oregon/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("selects an option and closes", async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = renderSelect();
    await user.click(trigger);

    await user.click(screen.getByRole("option", { name: /Oregon/ }));

    expect(onChange).toHaveBeenCalledWith("us");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select a disabled option", async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = renderSelect({
      options: [OPTIONS[0]!, { ...OPTIONS[1]!, disabled: true }],
    });
    await user.click(trigger);

    await user.click(screen.getByRole("option", { name: /Oregon/ }));

    expect(onChange).not.toHaveBeenCalled();
    // Visible but unavailable, which is the point of the prop.
    expect(screen.getByRole("option", { name: /Oregon/ })).toBeInTheDocument();
  });

  it("stays closed and inert when disabled", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect({ disabled: true });

    await user.click(trigger);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("keyboard", () => {
  it("opens, moves through the options and selects with Enter", () => {
    const { onChange, trigger } = renderSelect();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const options = screen.getAllByRole("option");
    expect(trigger).toHaveAttribute("aria-activedescendant", options[1]?.id);

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("us");
  });

  it("closes on Escape without choosing", () => {
    const { onChange, trigger } = renderSelect();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("searchable", () => {
  it("filters the options as the reader types", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect({ searchable: true });
    await user.click(trigger);

    await user.type(screen.getByRole("searchbox"), "seo");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Seoul/ })).toBeInTheDocument();
  });

  it("matches the description as well as the label", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect({ searchable: true });
    await user.click(trigger);

    await user.type(screen.getByRole("searchbox"), "us-west");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Oregon/ })).toBeInTheDocument();
  });

  it("says so in English when nothing matches", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect({ searchable: true });
    await user.click(trigger);

    await user.type(screen.getByRole("searchbox"), "zzz");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No options")).toBeInTheDocument();
  });

  it("takes the caller's words instead, since it resolves no locale key", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect({
      searchable: true,
      noOptionsLabel: "일치하는 항목 없음",
    });
    await user.click(trigger);

    await user.type(screen.getByRole("searchbox"), "zzz");

    expect(screen.getByText("일치하는 항목 없음")).toBeInTheDocument();
  });
});

describe("as a form field", () => {
  it("names the trigger from its label", async () => {
    render(<Select value="eu" onChange={vi.fn()} options={OPTIONS} label="Region" />);

    // The label names it, so no aria-label is needed alongside.
    const trigger = screen.getByRole("button", { name: /Region/ });
    expect(trigger).not.toHaveAttribute("aria-label");
  });

  it("marks itself invalid for a form that says so", () => {
    const { trigger } = renderSelect({ invalid: true });

    expect(trigger).toHaveAttribute("aria-invalid", "true");
  });

  it("carries a caller's description reference", () => {
    const { trigger } = renderSelect({ "aria-describedby": "region-hint" });

    expect(trigger).toHaveAttribute("aria-describedby", "region-hint");
  });

  it("reports a blur to the form", async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    const { trigger } = renderSelect({ onBlur });

    await user.click(trigger);
    await user.tab();

    expect(onBlur).toHaveBeenCalled();
  });
});
