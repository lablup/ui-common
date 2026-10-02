import { useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

type Props = ComponentProps<typeof DeleteConfirmModal>;

const renderModal = (props: Partial<Props> = {}) => {
  const onOpenChange = vi.fn();
  const onAction = vi.fn();
  const result = render(
    <DeleteConfirmModal
      isOpen
      onOpenChange={onOpenChange}
      onAction={onAction}
      items={[{ key: "a", label: "my-folder" }]}
      {...props}
    />,
  );
  return { ...result, onOpenChange, onAction };
};

const deleteButton = () => screen.getByRole("button", { name: "Delete" });

describe("DeleteConfirmModal", () => {
  it("asks once, with the item and a warning banner, for a single item", () => {
    renderModal();

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Delete");
    expect(screen.getByText("Are you sure you want to delete?")).toBeInTheDocument();
    expect(within(screen.getByRole("list")).getByText("my-folder")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(deleteButton()).toBeEnabled();
  });

  it("runs the action and leaves closing to the caller", async () => {
    const { onAction, onOpenChange } = renderModal();

    await userEvent.click(deleteButton());

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("cancels through onOpenChange", async () => {
    const { onAction, onOpenChange } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("gates the action on the exact confirm text", async () => {
    const user = userEvent.setup();
    renderModal({ isConfirmInputRequired: true });

    const input = screen.getByRole("textbox", { name: "Type my-folder to confirm." });
    expect(deleteButton()).toBeDisabled();

    await user.type(input, "my-folde");
    expect(deleteButton()).toBeDisabled();

    await user.type(input, "r");
    expect(deleteButton()).toBeEnabled();
    // The single item is the token in the label, not a list.
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows the confirm text as a token inside the sentence", () => {
    renderModal({ isConfirmInputRequired: true });

    const token = screen.getByText("my-folder");
    const sentence = token.closest(".astryx-text") as HTMLElement;
    expect(sentence).not.toBe(token);
    expect(sentence).toHaveTextContent("Type my-folder to confirm.");
  });

  it("asks several items to type the catalog word, and titles them with a plural", async () => {
    const user = userEvent.setup();
    renderModal({
      items: [
        { key: "a", label: "a" },
        { key: "b", label: "b" },
        { key: "c", label: "c" },
      ],
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Delete 3 items");
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
    await user.type(screen.getByRole("textbox"), "Delete");
    expect(deleteButton()).toBeEnabled();
  });

  it("keeps the action disabled, with no field, while the confirm text is empty", () => {
    renderModal({ isConfirmInputRequired: true, confirmText: "" });

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(deleteButton()).toBeDisabled();
  });

  it("cannot open the gate with isActionDisabled={false}", () => {
    renderModal({ isConfirmInputRequired: true, isActionDisabled: false });

    expect(deleteButton()).toBeDisabled();
  });

  it("disables the action for no items", () => {
    renderModal({ items: [] });

    expect(deleteButton()).toBeDisabled();
  });

  it("drops the field and the warning for a reversible action", () => {
    renderModal({
      isReversible: true,
      isConfirmInputRequired: true,
      items: [
        { key: "a", label: "a" },
        { key: "b", label: "b" },
      ],
    });

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText("This action cannot be undone.")).toBeNull();
    expect(deleteButton()).toBeEnabled();
  });

  it("names the target, as text or as a node", () => {
    const { unmount } = renderModal({ target: "Project" });
    expect(
      screen.getByText("Are you sure you want to permanently delete Project?"),
    ).toBeInTheDocument();
    unmount();

    renderModal({ target: <strong>Credential</strong> });
    expect(screen.getByText("Credential").tagName).toBe("STRONG");
    expect(screen.getByText(/permanently delete/)).toHaveTextContent(
      "Are you sure you want to permanently delete Credential?",
    );
  });

  it("takes a label render function that places the token", () => {
    renderModal({
      isConfirmInputRequired: true,
      inputLabel: (token) => <>Enter {token} below</>,
    });

    expect(
      screen.getByRole("textbox", { name: "Enter my-folder below" }),
    ).toBeInTheDocument();
  });

  it("clears what was typed when it opens again", async () => {
    const user = userEvent.setup();
    const props = {
      onOpenChange: vi.fn(),
      onAction: vi.fn(),
      items: [{ key: "a", label: "my-folder" }],
      isConfirmInputRequired: true,
    };
    const { rerender } = render(<DeleteConfirmModal isOpen {...props} />);
    await user.type(screen.getByRole("textbox"), "my-folder");

    rerender(<DeleteConfirmModal isOpen={false} {...props} />);
    rerender(<DeleteConfirmModal isOpen {...props} />);

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(deleteButton()).toBeDisabled();
  });

  it("draws the list plain on request", () => {
    renderModal({
      hasPlainItems: true,
      items: [
        { key: "a", label: "a" },
        { key: "b", label: "b" },
      ],
    });

    expect(screen.getByRole("list")).not.toHaveClass("uic-delete-confirm-modal__items");
  });

  it("translates its strings through the catalog", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <DeleteConfirmModal
          isOpen
          onOpenChange={vi.fn()}
          onAction={vi.fn()}
          items={[
            { key: "a", label: "a" },
            { key: "b", label: "b" },
          ]}
        />
      </InternationalizationProvider>,
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName("2개 항목 삭제");
    expect(screen.getByRole("button", { name: "삭제" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });
});

describe("DeleteConfirmModal focus return", () => {
  function Opener() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)}>
          delete folder
        </button>
        <DeleteConfirmModal
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onAction={() => setIsOpen(false)}
          items={[{ key: "a", label: "my-folder" }]}
          confirmText="my-folder"
          isConfirmInputRequired
        />
      </>
    );
  }

  const opener = () =>
    screen.getByRole("button", { name: "delete folder", hidden: true });

  it("returns focus to the opener after its autofocused field held it", async () => {
    const user = userEvent.setup();
    render(<Opener />);

    await user.click(opener());
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(opener());

    await user.click(opener());
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(opener());

    await user.click(opener());
    await user.type(screen.getByRole("textbox"), "my-folder");
    await user.click(deleteButton());
    await waitFor(() => expect(document.activeElement).toBe(opener()));
  });
});
