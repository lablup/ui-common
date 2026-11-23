import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { uiCommonMessages } from "../../i18n/messages";
import { Form, type FormInstance } from "../Form";
import { PasswordInput } from "./PasswordInput";

const field = () => screen.getByLabelText("Password", { selector: "input" });

describe("PasswordInput", () => {
  it("masks the password until the toggle shows it, and masks it again", async () => {
    const onRevealedChange = vi.fn();
    render(
      <PasswordInput
        aria-label="Password"
        defaultValue="secret"
        onRevealedChange={onRevealedChange}
      />,
    );
    expect(field()).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(field()).toHaveAttribute("type", "text");
    expect(onRevealedChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(field()).toHaveAttribute("type", "password");
    expect(onRevealedChange).toHaveBeenLastCalledWith(false);
  });

  it("starts shown with defaultIsRevealed", () => {
    render(<PasswordInput aria-label="Password" defaultIsRevealed />);
    expect(field()).toHaveAttribute("type", "text");
  });

  it("follows isRevealed when controlled", async () => {
    const onRevealedChange = vi.fn();
    const { rerender } = render(
      <PasswordInput
        aria-label="Password"
        isRevealed={false}
        onRevealedChange={onRevealedChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(onRevealedChange).toHaveBeenCalledWith(true);
    // The caller has not changed isRevealed, so the field stays masked.
    expect(field()).toHaveAttribute("type", "password");
    rerender(<PasswordInput aria-label="Password" isRevealed />);
    expect(field()).toHaveAttribute("type", "text");
  });

  it("keeps the password from spellcheck, autocorrect and autocapitalize", async () => {
    render(<PasswordInput aria-label="Password" />);
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(field()).toHaveAttribute("spellcheck", "false");
    expect(field()).toHaveAttribute("autocorrect", "off");
    expect(field()).toHaveAttribute("autocapitalize", "none");
  });

  it("keeps focus in the field when the toggle is pressed", async () => {
    render(<PasswordInput aria-label="Password" />);
    const input = field();
    input.focus();
    const toggle = screen.getByRole("button", { name: "Show password" });
    const mouseDown = fireEvent.mouseDown(toggle);
    // preventDefault on mousedown is what keeps the browser from moving focus.
    expect(mouseDown).toBe(false);
    await userEvent.click(toggle);
    expect(input).toHaveFocus();
  });

  it("does not submit the surrounding form on Enter on the toggle", async () => {
    const onKeyDown = vi.fn();
    render(
      <form onKeyDown={onKeyDown}>
        <PasswordInput aria-label="Password" />
      </form>,
    );
    const toggle = screen.getByRole("button", { name: "Show password" });
    act(() => toggle.focus());
    await userEvent.keyboard("{Enter}");
    expect(onKeyDown).not.toHaveBeenCalled();
    expect(field()).toHaveAttribute("type", "text");
    // Enter in the field itself still reaches the form.
    act(() => field().focus());
    await userEvent.keyboard("{Enter}");
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("masks a disabled field, disables the toggle, and stays masked once enabled", async () => {
    function Harness() {
      const [disabled, setDisabled] = useState(false);
      return (
        <>
          <PasswordInput aria-label="Password" disabled={disabled} />
          <button type="button" onClick={() => setDisabled((d) => !d)}>
            flip
          </button>
        </>
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(field()).toHaveAttribute("type", "text");
    await userEvent.click(screen.getByRole("button", { name: "flip" }));
    expect(field()).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "flip" }));
    expect(field()).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeEnabled();
  });

  it("masks a controlled field while it is disabled", () => {
    render(<PasswordInput aria-label="Password" isRevealed disabled />);
    expect(field()).toHaveAttribute("type", "password");
  });

  it("takes its value from Form.Item and is disabled by <Form disabled>", async () => {
    const form: { current?: FormInstance } = {};
    function Harness({ disabled }: { disabled?: boolean }) {
      const [instance] = Form.useForm();
      form.current = instance;
      return (
        <Form form={instance} disabled={disabled} initialValues={{ password: "abc" }}>
          <Form.Item label="Password" name="password">
            <PasswordInput />
          </Form.Item>
        </Form>
      );
    }
    const { rerender } = render(<Harness />);
    expect(field()).toHaveValue("abc");
    await userEvent.type(field(), "d");
    expect(form.current!.getFieldValue("password")).toBe("abcd");
    rerender(<Harness disabled />);
    expect(field()).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });

  it("takes explicit toggle names over the catalog's", async () => {
    render(
      <PasswordInput
        aria-label="Password"
        showPasswordLabel="Reveal"
        hidePasswordLabel="Conceal"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByRole("button", { name: "Conceal" })).toBeInTheDocument();
  });

  it("translates the toggle's name from the catalog", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <PasswordInput aria-label="Password" />
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("button", { name: "비밀번호 보기" })).toBeInTheDocument();
  });

  it("reserves the toggle's room, hides Edge's reveal button and tones the icon down", () => {
    const css = readFileSync(join(__dirname, "PasswordInput.css"), "utf8");
    expect(css).toMatch(
      /\.uic-password-input__control\s*\{[^}]*padding-inline-end:[^;]*--size-element-sm/,
    );
    expect(css).toMatch(/input::-ms-reveal\s*\{\s*display:\s*none;/);
    expect(css).toMatch(
      /\.uic-password-input__toggle\s*\{[^}]*color:\s*var\(--color-text-secondary\)/,
    );
  });
});
