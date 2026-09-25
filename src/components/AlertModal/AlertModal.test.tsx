import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";

import { uiCommonMessages } from "../../i18n/messages";
import { Modal } from "../Modal/Modal";
import { AlertModal } from "./AlertModal";

const renderAlert = (props: Partial<ComponentProps<typeof AlertModal>> = {}) => {
  const onOpenChange = vi.fn();
  const onAction = vi.fn();
  const result = render(
    <AlertModal
      isOpen
      onOpenChange={onOpenChange}
      onAction={onAction}
      title="Delete session?"
      description="This action cannot be undone."
      actionLabel="Delete"
      {...props}
    />,
  );
  return { ...result, onOpenChange, onAction };
};

const getMask = () => document.querySelector(".uic-modal__mask") as HTMLElement;

const levelOf = (root: Element | null | undefined) =>
  Number((root as HTMLElement).style.getPropertyValue("--uic-modal-level"));

describe("AlertModal", () => {
  it("portals to document.body without a native <dialog>", () => {
    renderAlert();

    const root = document.body.querySelector(".uic-modal");
    expect(root?.parentElement).toBe(document.body);
    expect(document.querySelector("dialog")).toBeNull();
    expect(root?.hasAttribute("data-uic-modal-open")).toBe(true);
  });

  // Astryx AlertDialog's only off-top-layer path renders role="group", so
  // the role is the first thing a rewrite loses.
  it("exposes role=alertdialog with an accessible name and description", () => {
    renderAlert();

    const alert = screen.getByRole("alertdialog");
    expect(alert).toHaveAccessibleName("Delete session?");
    expect(alert).toHaveAccessibleDescription("This action cannot be undone.");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("focuses the least destructive choice first", () => {
    renderAlert();

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
  });

  it.each([
    { label: "Escape", cancels: true },
    { label: "a backdrop click", cancels: false },
  ])("$label cancels: $cancels", async ({ label, cancels }) => {
    const user = userEvent.setup();
    const { onOpenChange } = renderAlert();

    if (label === "Escape") await user.keyboard("{Escape}");
    else await user.click(getMask());

    expect(onOpenChange).toHaveBeenCalledTimes(cancels ? 1 : 0);
    if (cancels) expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cancels from the Cancel button", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onAction } = renderAlert();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("runs the action without closing itself", async () => {
    const user = userEvent.setup();
    const { onOpenChange, onAction } = renderAlert();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disables either button on request", () => {
    renderAlert({ isCancelDisabled: true, isActionDisabled: true });

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("takes a caller's cancel label over the catalog", () => {
    renderAlert({ cancelLabel: "Keep it" });

    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
  });

  it("translates the cancel label through the catalog", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <AlertModal
          isOpen
          onOpenChange={vi.fn()}
          onAction={vi.fn()}
          title="t"
          description="d"
          actionLabel="a"
        />
      </InternationalizationProvider>,
    );

    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });

  // Both surfaces claim from one stack, or an alert raised from inside a
  // modal neither paints above it nor inerts it.
  it("stacks above an open Modal and inerts it", () => {
    render(
      <>
        <Modal isOpen onOpenChange={vi.fn()} aria-label="base">
          <Layout content={<LayoutContent>base body</LayoutContent>} />
        </Modal>
        <AlertModal
          isOpen
          onOpenChange={vi.fn()}
          onAction={vi.fn()}
          title="Delete session?"
          description="This action cannot be undone."
          actionLabel="Delete"
        />
      </>,
    );

    const baseRoot = screen.getByRole("dialog", { name: "base" }).closest(".uic-modal");
    const alertRoot = screen.getByRole("alertdialog").closest(".uic-modal");

    expect(levelOf(baseRoot)).toBe(0);
    expect(levelOf(alertRoot)).toBe(1);
    expect(baseRoot?.hasAttribute("inert")).toBe(true);
    expect(alertRoot?.hasAttribute("inert")).toBe(false);
  });

  it("forwards a zIndex override to the portal root", () => {
    renderAlert({ zIndex: 5000 });

    expect(
      screen
        .getByRole("alertdialog")
        .closest<HTMLElement>(".uic-modal")
        ?.style.getPropertyValue("--uic-modal-z"),
    ).toBe("5000");
  });
});
