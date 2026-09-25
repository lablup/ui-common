/**
 * Modal: the portalled surface (no native `<dialog>`, nothing outside made
 * unavailable), nesting, dismissal by purpose, the content lifecycle, and the
 * structured header/footer mode with its catalog defaults.
 *
 * jsdom treats `inert` as markup only, and there is no layout, so these check
 * the attributes and custom properties the browser acts on.
 */
import { useState, type ComponentProps } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogHeader as CoreDialogHeader } from "@astryxdesign/core/Dialog";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { Theme, defineTheme } from "@astryxdesign/core/theme";

import { DialogHeader, Modal, ModalHeader } from ".";
import { MODAL_OPEN_ATTRIBUTE, configureModalZIndex } from "./modalStack";

type ModalTestProps = Partial<ComponentProps<typeof Modal>>;

function renderModal(props: ModalTestProps = {}) {
  const onOpenChange = vi.fn();
  const result = render(
    <Modal isOpen onOpenChange={onOpenChange} {...props}>
      <Layout
        header={<ModalHeader title="Portal title" />}
        content={
          <LayoutContent>
            <button type="button">Inside</button>
          </LayoutContent>
        }
      />
    </Modal>,
  );
  return { ...result, onOpenChange };
}

const rootOf = (name?: string) =>
  (name === undefined
    ? document.querySelector(".uic-modal")
    : screen.getByRole("dialog", { name }).closest(".uic-modal")) as HTMLElement;

const getMask = () => document.querySelector(".uic-modal__mask") as HTMLElement;
const levelOf = (root: HTMLElement) =>
  Number(root.style.getPropertyValue("--uic-modal-level"));
const zOf = (root: HTMLElement) => Number(root.style.getPropertyValue("--uic-modal-z"));

afterEach(() => {
  configureModalZIndex();
});

describe("Modal surface", () => {
  it("portals to document.body without a native <dialog>", () => {
    const { container } = renderModal();
    const dialog = screen.getByRole("dialog", { name: "Portal title" });

    expect(dialog.tagName).toBe("DIV");
    expect(document.querySelector("dialog")).toBeNull();
    expect(container.contains(dialog)).toBe(false);
    expect(rootOf().parentElement).toBe(document.body);
    expect(rootOf()).toHaveAttribute(MODAL_OPEN_ATTRIBUTE);
  });

  it("claims nothing outside the modal is unavailable", () => {
    renderModal();
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal");
  });

  it("keeps the .astryx-dialog surface themes key off", () => {
    renderModal();
    expect(screen.getByRole("dialog").querySelector(".astryx-dialog")).not.toBeNull();
  });

  it("uses role=alertdialog for a required modal, and lets a passed role win", () => {
    const { unmount } = renderModal({ purpose: "required" });
    expect(
      screen.getByRole("alertdialog", { name: "Portal title" }),
    ).toBeInTheDocument();
    unmount();

    renderModal({ purpose: "form", role: "alertdialog" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("re-emits the nearest theme name so theme CSS reaches the portal", () => {
    const theme = defineTheme({ name: "uic-modal-test", tokens: {} });
    render(
      <Theme theme={theme}>
        <Modal isOpen onOpenChange={vi.fn()} aria-label="themed">
          body
        </Modal>
      </Theme>,
    );
    expect(rootOf("themed")).toHaveAttribute("data-astryx-theme", "uic-modal-test");
  });

  it("places a positioned modal with logical inline offsets", () => {
    renderModal({ position: { top: 8, end: "2rem" } });
    const wrap = screen.getByRole("dialog");
    expect(wrap).toHaveClass("uic-modal__wrap--positioned");
    expect(wrap.style.top).toBe("8px");
    expect(wrap.style.insetInlineEnd).toBe("2rem");
    expect(wrap.style.bottom).toBe("auto");
  });

  it("sizes the wrap, so a percentage resolves against the viewport", () => {
    renderModal({ width: "80%" });
    expect(screen.getByRole("dialog").style.width).toBe("80%");
  });

  it("leaves a fullscreen modal to size itself", () => {
    renderModal({ variant: "fullscreen", width: 600 });
    expect(screen.getByRole("dialog").style.width).toBe("");
  });

  it("renders in flow, without a portal, when isInline", () => {
    const { container } = render(
      <Modal isInline isOpen onOpenChange={vi.fn()} title="Preview">
        body
      </Modal>,
    );
    expect(document.querySelector(".uic-modal")).toBeNull();
    expect(container.textContent).toContain("Preview");
  });
});

describe("Modal dismissal", () => {
  it("closes on a backdrop click for an info modal", () => {
    const { onOpenChange } = renderModal();
    fireEvent.mouseDown(getMask());
    fireEvent.click(getMask());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.each(["form", "required"] as const)(
    "ignores the backdrop for a %s modal",
    (purpose) => {
      const { onOpenChange } = renderModal({ purpose });
      fireEvent.mouseDown(getMask());
      fireEvent.click(getMask());
      expect(onOpenChange).not.toHaveBeenCalled();
    },
  );

  it("keeps a drag that started inside the surface from dismissing it", () => {
    const { onOpenChange } = renderModal();
    fireEvent.mouseDown(screen.getByRole("dialog"));
    fireEvent.click(getMask());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it.each(["info", "form"] as const)(
    "closes on Escape for a %s modal",
    async (purpose) => {
      const user = userEvent.setup();
      const { onOpenChange } = renderModal({ purpose });
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    },
  );

  it("does not close on Escape for a required modal", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal({ purpose: "required" });
    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("restores focus to the trigger when it closes", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const view = renderModal();
    expect(document.activeElement).not.toBe(trigger);

    view.unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});

describe("Modal nesting", () => {
  function Nested() {
    const [isInnerOpen, setIsInnerOpen] = useState(false);
    return (
      <Modal isOpen onOpenChange={vi.fn()} aria-label="outer">
        <button type="button" onClick={() => setIsInnerOpen(true)}>
          open inner
        </button>
        <button type="button">outer-b</button>
        <Modal isOpen={isInnerOpen} onOpenChange={setIsInnerOpen} aria-label="inner">
          <button type="button">inner-a</button>
          <button type="button">inner-b</button>
        </Modal>
      </Modal>
    );
  }

  it("stacks from level 0 upward and inerts the covered root", async () => {
    const user = userEvent.setup();
    render(<Nested />);
    await user.click(screen.getByRole("button", { name: "open inner" }));

    const outer = rootOf("outer");
    const inner = rootOf("inner");
    expect([levelOf(outer), levelOf(inner)]).toEqual([0, 1]);
    expect(zOf(inner)).toBeGreaterThan(zOf(outer));
    expect(outer).toHaveAttribute("inert");
    expect(inner).not.toHaveAttribute("inert");
  });

  it("keeps Tab inside the modal opened on top", async () => {
    const user = userEvent.setup();
    render(<Nested />);
    await user.click(screen.getByRole("button", { name: "open inner" }));

    screen.getByRole("button", { name: "inner-a" }).focus();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "inner-b" }),
    );
  });

  it("closes only the top modal on Escape", async () => {
    const user = userEvent.setup();
    render(<Nested />);
    await user.click(screen.getByRole("button", { name: "open inner" }));
    screen.getByRole("button", { name: "inner-a" }).focus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "inner" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "outer" })).toBeInTheDocument();
    expect(rootOf("outer")).not.toHaveAttribute("inert");
  });

  it("honours a zIndex inside the band and ignores one outside it", () => {
    const { unmount } = renderModal({ zIndex: 5000 });
    expect(zOf(rootOf())).toBe(5000);
    unmount();

    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderModal({ zIndex: 10 });
    expect(zOf(rootOf())).toBe(1100);
  });

  it("paints in the band configureModalZIndex sets", () => {
    configureModalZIndex({ base: 500, step: 5, max: 900 });
    renderModal();
    expect(zOf(rootOf())).toBe(500);
  });
});

describe("Modal content lifecycle", () => {
  function Toggle(props: ModalTestProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setIsOpen((open) => !open)}>
          toggle
        </button>
        <Modal isOpen={isOpen} onOpenChange={setIsOpen} aria-label="life" {...props}>
          <input aria-label="field" defaultValue="" />
        </Modal>
      </>
    );
  }

  it("does not render content before the first open", () => {
    render(<Toggle />);
    expect(screen.queryByLabelText("field")).toBeNull();
    expect(document.querySelector(".uic-modal")).toBeNull();
  });

  it("fires afterOpenChange on each edge, never on mount", async () => {
    const user = userEvent.setup();
    const afterOpenChange = vi.fn();
    render(<Toggle afterOpenChange={afterOpenChange} />);
    expect(afterOpenChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(afterOpenChange).toHaveBeenLastCalledWith(true);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "toggle", hidden: true }));
    });
    expect(afterOpenChange).toHaveBeenLastCalledWith(false);
    expect(afterOpenChange).toHaveBeenCalledTimes(2);
  });

  it("keeps content, and its state, mounted while closed", async () => {
    const user = userEvent.setup();
    render(<Toggle />);
    await user.click(screen.getByRole("button", { name: "toggle" }));
    await user.type(screen.getByLabelText("field"), "kept");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "toggle", hidden: true }));
    });

    expect(rootOf()).toHaveClass("uic-modal--closed");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByDisplayValue("kept")).toBeInTheDocument();
  });

  it("drops content on close with unmountOnClose", async () => {
    const user = userEvent.setup();
    render(<Toggle unmountOnClose />);
    await user.click(screen.getByRole("button", { name: "toggle" }));
    await user.type(screen.getByLabelText("field"), "dropped");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "toggle", hidden: true }));
    });

    expect(document.querySelector(".uic-modal")).toBeNull();
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByLabelText("field")).toHaveValue("");
  });
});

describe("Modal structured mode", () => {
  it("puts headerClassName and footerClassName on the generated chrome", () => {
    render(
      <Modal
        isOpen
        onOpenChange={vi.fn()}
        title="Rename"
        onAction={vi.fn()}
        headerClassName="my-header"
        footerClassName="my-footer"
      >
        body
      </Modal>,
    );
    const header = document.querySelector(".my-header");
    const footer = document.querySelector(".my-footer");
    expect(header).toHaveTextContent("Rename");
    expect(footer?.querySelectorAll("button")).toHaveLength(2);
  });

  it("renders children alone when no structure is asked for", () => {
    render(
      <Modal isOpen onOpenChange={vi.fn()} aria-label="bare">
        only the body
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "bare" })).toHaveTextContent(
      "only the body",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("names itself from title and closes from the header button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal isOpen onOpenChange={onOpenChange} title="Rename" subtitle="Folder">
        body
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Rename" })).toHaveTextContent("Folder");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("drops the header close button when asked", () => {
    render(
      <Modal isOpen onOpenChange={vi.fn()} title="Rename" hasCloseButton={false}>
        body
      </Modal>,
    );
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("generates OK and Cancel with catalog defaults when onAction is set", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onAction = vi.fn();
    render(
      <Modal isOpen onOpenChange={onOpenChange} title="Rename" onAction={onAction}>
        body
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "OK" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("takes translated defaults from the provider and explicit labels over them", () => {
    const messages = {
      "ko-KR": {
        "uic.common.ok": { defaultMessage: "확인" },
        "uic.common.cancel": { defaultMessage: "취소" },
      },
    };
    const { unmount } = render(
      <InternationalizationProvider locale="ko-KR" messages={messages}>
        <Modal isOpen onOpenChange={vi.fn()} title="t" onAction={vi.fn()}>
          body
        </Modal>
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    unmount();

    render(
      <InternationalizationProvider locale="ko-KR" messages={messages}>
        <Modal
          isOpen
          onOpenChange={vi.fn()}
          title="t"
          onAction={vi.fn()}
          actionLabel="Rename"
          cancelLabel="Keep"
        >
          body
        </Modal>
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("button", { name: "Rename" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
  });

  it("holds the action pending until its promise settles", async () => {
    const user = userEvent.setup();
    let resolve: () => void = () => undefined;
    const onAction = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    render(
      <Modal
        isOpen
        onOpenChange={vi.fn()}
        title="t"
        onAction={onAction}
        actionLabel="Save"
      >
        body
      </Modal>,
    );
    const save = screen.getByRole("button", { name: "Save" });

    await user.click(save);
    await user.click(save);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(save).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      resolve();
    });
    expect(save).not.toHaveAttribute("aria-busy", "true");
  });

  it("uses the destructive variant and passes button props through", () => {
    render(
      <Modal
        isOpen
        onOpenChange={vi.fn()}
        title="t"
        onAction={vi.fn()}
        actionLabel="Delete"
        actionVariant="destructive"
        actionButtonProps={{ type: "submit", form: "the-form" }}
        hasCancelButton={false}
      >
        body
      </Modal>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-variant", "destructive");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("form", "the-form");
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("replaces the footer with a node, or removes it with null", () => {
    const { unmount } = render(
      <Modal
        isOpen
        onOpenChange={vi.fn()}
        title="t"
        footer={<span>custom footer</span>}
      >
        body
      </Modal>,
    );
    expect(screen.getByText("custom footer")).toBeInTheDocument();
    unmount();

    render(
      <Modal isOpen onOpenChange={vi.fn()} title="t" onAction={vi.fn()} footer={null}>
        body
      </Modal>,
    );
    expect(screen.queryByRole("button", { name: "OK" })).toBeNull();
  });

  it("shows a skeleton in place of the body while loading", () => {
    render(
      <Modal isOpen onOpenChange={vi.fn()} title="t" isLoading>
        real body
      </Modal>,
    );
    expect(screen.queryByText("real body")).toBeNull();
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});

describe("Modal exports", () => {
  it("ModalHeader and DialogHeader are Astryx's DialogHeader", () => {
    expect(ModalHeader).toBe(CoreDialogHeader);
    expect(DialogHeader).toBe(CoreDialogHeader);
  });
});
