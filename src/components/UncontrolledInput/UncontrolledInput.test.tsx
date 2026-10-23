import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { UncontrolledInput } from "./UncontrolledInput";

describe("UncontrolledInput", () => {
  it("commits on Enter and on blur, never per keystroke", async () => {
    const onCommit = vi.fn();
    render(<UncontrolledInput label="Font" defaultValue="Inter" onCommit={onCommit} />);
    const input = screen.getByRole("textbox", { name: "Font" });
    await userEvent.clear(input);
    await userEvent.type(input, "Noto");
    expect(onCommit).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(onCommit).toHaveBeenLastCalledWith("Noto");
    await userEvent.type(input, " Sans");
    await userEvent.tab();
    expect(onCommit).toHaveBeenLastCalledWith("Noto Sans");
  });

  it("drops an uncommitted edit when defaultValue changes", async () => {
    const { rerender } = render(<UncontrolledInput label="Path" defaultValue="/a" />);
    const input = screen.getByRole("textbox", { name: "Path" });
    await userEvent.type(input, "bc");
    expect(input).toHaveValue("/abc");
    rerender(<UncontrolledInput label="Path" defaultValue="/z" />);
    expect(input).toHaveValue("/z");
  });

  it("renders a number field for type number and commits the new value", async () => {
    const onCommit = vi.fn();
    render(
      <UncontrolledInput
        label="Width"
        type="number"
        defaultValue="120"
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Width" });
    expect(input).toHaveValue("120");
    await userEvent.clear(input);
    await userEvent.type(input, "64{Enter}");
    expect(onCommit).toHaveBeenLastCalledWith("64");
    await userEvent.clear(input);
    await userEvent.type(input, "32");
    await userEvent.tab();
    expect(onCommit).toHaveBeenLastCalledWith("32");
  });

  it("passes the password and email types, and data attributes, through", () => {
    const { rerender } = render(
      <UncontrolledInput label="Secret" type="password" data-testid="field" />,
    );
    expect(screen.getByLabelText("Secret")).toHaveAttribute("type", "password");
    expect(screen.getByTestId("field")).toBeInTheDocument();
    rerender(<UncontrolledInput label="Mail" type="email" />);
    expect(screen.getByLabelText("Mail")).toHaveAttribute("type", "email");
  });

  it("disables the field", () => {
    render(<UncontrolledInput label="Name" isDisabled />);
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
  });

  it("falls back to a hidden catalog name, translated", () => {
    const { rerender } = render(<UncontrolledInput />);
    expect(screen.getByRole("textbox", { name: "Select" })).toBeInTheDocument();
    rerender(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <UncontrolledInput />
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("textbox", { name: "선택" })).toBeInTheDocument();
  });
  it.each(["text", "number"] as const)(
    "puts className and style on the %s field box, not the input",
    (type) => {
      render(
        <UncontrolledInput
          label="Size"
          type={type}
          className="narrow"
          style={{ maxWidth: 150, alignSelf: "stretch" }}
        />,
      );
      const input = screen.getByLabelText("Size");
      const box = input.closest<HTMLElement>(".narrow");
      expect(box).not.toBeNull();
      expect(box).toHaveStyle({ maxWidth: "150px", alignSelf: "stretch" });
      // The field box holds the label too, so the whole field is sized.
      expect(box).toContainElement(screen.getByText("Size"));
      expect(input).not.toHaveClass("narrow");
      expect(input.getAttribute("style") ?? "").not.toContain("max-width");
    },
  );

  it("passes width to the field and control styling to the control box", () => {
    render(
      <UncontrolledInput
        label="Size"
        width={200}
        className="field"
        controlClassName="control"
        controlStyle={{ minWidth: 80 }}
      />,
    );
    const input = screen.getByLabelText("Size");
    const field = input.closest<HTMLElement>(".field");
    const control = input.closest<HTMLElement>(".control");
    expect(field?.style.getPropertyValue("--x-width")).toBe("200px");
    expect(control).not.toBeNull();
    expect(control).not.toBe(input);
    expect(field).toContainElement(control);
    expect(control).toHaveStyle({ minWidth: "80px" });
  });
});
