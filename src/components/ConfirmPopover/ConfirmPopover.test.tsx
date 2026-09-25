import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@astryxdesign/core/Button";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { ConfirmPopover } from "./ConfirmPopover";

const openWith = async (name: string) => {
  await userEvent.click(screen.getByRole("button", { name }));
  return screen.findByRole("dialog");
};

describe("ConfirmPopover", () => {
  it("asks, with Cancel focused first", async () => {
    render(
      <ConfirmPopover title="Deactivate this key?" description="It can be restored.">
        <Button label="Deactivate" />
      </ConfirmPopover>,
    );
    const dialog = await openWith("Deactivate");
    expect(dialog).toHaveAccessibleName("Deactivate this key?");
    expect(screen.getByText("It can be restored.")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: /Cancel|Confirm/ });
    expect(buttons.map((b) => b.textContent)).toEqual(["Cancel", "Confirm"]);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
  });

  it("runs onAction, waits for it, then closes", async () => {
    let resolve!: () => void;
    const onAction = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    render(
      <ConfirmPopover title="Restore?" actionLabel="Restore" onAction={onAction}>
        <Button label="Open" />
      </ConfirmPopover>,
    );
    await openWith("Open");
    await userEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    resolve();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancels and closes", async () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmPopover title="Leave?" onCancel={onCancel} onOpenChange={onOpenChange}>
        <Button label="Leave" />
      </ConfirmPopover>,
    );
    await openWith("Leave");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("styles and disables the action as asked", async () => {
    render(
      <ConfirmPopover title="Delete?" actionVariant="destructive" isActionDisabled>
        <Button label="Open" />
      </ConfirmPopover>,
    );
    await openWith("Open");
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("is named by label or the action when the title is not text", async () => {
    render(
      <ConfirmPopover title={<strong>Apply?</strong>} actionLabel="Apply now">
        <Button label="Open" />
      </ConfirmPopover>,
    );
    expect(await openWith("Open")).toHaveAccessibleName("Apply now");
  });

  it("follows a controlled isOpen", () => {
    const { rerender } = render(
      <ConfirmPopover title="Sure?" isOpen={false}>
        <Button label="Open" />
      </ConfirmPopover>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(
      <ConfirmPopover title="Sure?" isOpen>
        <Button label="Open" />
      </ConfirmPopover>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps a render-prop trigger a direct child of its ButtonGroup", () => {
    render(
      <ButtonGroup label="Control">
        <ConfirmPopover title="Apply revision?">
          {(triggerProps) => (
            <Button {...triggerProps} variant="primary" label="Apply" />
          )}
        </ConfirmPopover>
        <Button variant="primary" label="More" />
      </ButtonGroup>,
    );
    const apply = screen.getByRole("button", { name: "Apply" });
    const group = apply.closest(".astryx-button-group");
    expect(group).not.toBeNull();
    expect(apply.parentElement).toBe(group);
  });

  it("takes its default labels from the shipped translations", async () => {
    render(
      <InternationalizationProvider locale="ja-JP" messages={uiCommonMessages}>
        <ConfirmPopover title="よろしいですか?">
          <Button label="Open" />
        </ConfirmPopover>
      </InternationalizationProvider>,
    );
    await openWith("Open");
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "確認" })).toBeInTheDocument();
  });
});
