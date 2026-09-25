import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { ColorPicker, toHexColor } from "./ColorPicker";

const open = async (name: string | RegExp = "Select color") => {
  await userEvent.click(screen.getByRole("button", { name }));
  return screen.findByRole("dialog");
};

describe("toHexColor", () => {
  it.each([
    ["#AABBCC", "#aabbcc"],
    ["#abc", "#aabbcc"],
    ["#11223344", "#112233"],
    ["rgb(255, 0, 16)", "#ff0010"],
    ["rgba(0 128 255 / 0.5)", "#0080ff"],
    [" #123456 ", "#123456"],
  ])("normalises %s to %s", (input, hex) => {
    expect(toHexColor(input)).toBe(hex);
  });

  it.each([undefined, null, "", "red", "#12", "rgb(1, 2)", "var(--color-accent)"])(
    "returns null for %s",
    (input) => {
      expect(toHexColor(input)).toBeNull();
    },
  );
});

describe("ColorPicker", () => {
  it("names the trigger and paints the swatch with the value", () => {
    const { container } = render(<ColorPicker value="#ABC" data-testid="accent" />);
    const trigger = screen.getByRole("button", { name: "Select color" });
    expect(trigger).toHaveAttribute("data-testid", "accent");
    expect(
      container.querySelector<HTMLElement>(".uic-color-picker__swatch-fill")!.style
        .backgroundColor,
    ).toBe("rgb(170, 187, 204)");
  });

  it("shows the hex, or No color, on the trigger with hasValueLabel", () => {
    const { rerender } = render(
      <ColorPicker value="rgb(0, 0, 255)" hasValueLabel data-testid="c" />,
    );
    expect(screen.getByTestId("c-value")).toHaveTextContent("#0000ff");
    rerender(<ColorPicker value="not a colour" hasValueLabel data-testid="c" />);
    expect(screen.getByTestId("c-value")).toHaveTextContent("No color");
    rerender(
      <ColorPicker value={null} hasValueLabel noColorLabel="Default" data-testid="c" />,
    );
    expect(screen.getByTestId("c-value")).toHaveTextContent("Default");
  });

  it("uses label as the accessible name of the trigger and the area", async () => {
    render(<ColorPicker value="#000000" label="Accent" />);
    await open("Accent");
    expect(screen.getByLabelText("Accent", { selector: "input" })).toHaveAttribute(
      "type",
      "color",
    );
  });

  it("commits the settled colour from the area, not the live one", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#000000" onChange={onChange} data-testid="c" />);
    await open();
    const area = screen.getByTestId("c-area") as HTMLInputElement;
    fireEvent.input(area, { target: { value: "#112233" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(area, { target: { value: "#112233" } });
    expect(onChange).toHaveBeenCalledWith("#112233");
  });

  it("commits a complete hex typed into the field, and not a partial one", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#000000" onChange={onChange} />);
    await open();
    const field = screen.getByRole("textbox", { name: "Hex value" });
    await userEvent.clear(field);
    await userEvent.type(field, "#12");
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.type(field, "3");
    expect(onChange).toHaveBeenLastCalledWith("#112233");
    await userEvent.type(field, "456");
    expect(onChange).toHaveBeenLastCalledWith("#123456");
  });

  it("does not report the colour it already has", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#123456" onChange={onChange} data-testid="c" />);
    await open();
    fireEvent.change(screen.getByTestId("c-area"), { target: { value: "#123456" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears and closes, and commits nothing on the way out", async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(
      <ColorPicker value="#123456" hasClear onClear={onClear} onChange={onChange} />,
    );
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("offers no clear button without hasClear", async () => {
    render(<ColorPicker value="#123456" />);
    await open();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("disables the trigger", () => {
    render(<ColorPicker value="#123456" isDisabled />);
    expect(screen.getByRole("button", { name: "Select color" })).toBeDisabled();
  });

  it("takes its strings from the shipped translations", async () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <ColorPicker value={null} hasValueLabel hasClear data-testid="c" />
      </InternationalizationProvider>,
    );
    expect(screen.getByTestId("c-value")).toHaveTextContent("색상 없음");
    await userEvent.click(screen.getByTestId("c"));
    await screen.findByRole("dialog");
    expect(screen.getByRole("textbox", { name: "16진수 값" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "지우기" })).toBeInTheDocument();
    expect(
      screen.getByLabelText("색상 선택", { selector: "input" }),
    ).toBeInTheDocument();
  });

  it("passes className and style to the trigger", () => {
    render(<ColorPicker className="extra" style={{ minWidth: 110 }} />);
    const trigger = screen.getByRole("button", { name: "Select color" });
    expect(trigger).toHaveClass("uic-color-picker__trigger", "extra");
    expect(trigger.style.minWidth).toBe("110px");
  });
});
