/**
 * ui-common's tests for its Drawer fork: the changes it carries (`aria-modal`
 * passthrough, a `Modal` inside rendering into its dialog), that Escape still
 * goes through core's layer-dismissal stack (upstream's own behaviour since
 * lab 0.6.5, kept pinned here), and that everything else renders exactly as
 * lab's does.
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover } from "@astryxdesign/core/Popover";
import { Selector } from "@astryxdesign/core/Selector";
import { Drawer as UpstreamDrawer } from "@astryxdesign/lab";

import { Modal } from "../../components/Modal";
import { ComplexSelector } from "../ComplexSelector";
import { comparableMarkup } from "../../test/forkParity";
import { Drawer } from "./Drawer";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.show = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
  // A scrimless drawer opens with showPopover(); jsdom has neither.
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute("open", "");
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute("open");
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** A layer opened from inside the drawer, portalled out of its DOM subtree. */
function PortalledLayer() {
  return createPortal(
    <input aria-label="Layer field" data-testid="layer-input" />,
    document.body,
  );
}

function renderDrawer(DrawerImpl: typeof Drawer, onOpenChange = vi.fn()) {
  render(
    <DrawerImpl isOpen onOpenChange={onOpenChange} label="Details">
      <input aria-label="Drawer field" />
      <PortalledLayer />
    </DrawerImpl>,
  );
  return onOpenChange;
}

/** Mock the Popover API, which jsdom does not implement. */
function mockPopoverApi() {
  const originalMatches = HTMLElement.prototype.matches;
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute("popover-open", "");
    if (this instanceof HTMLDialogElement) this.setAttribute("open", "");
    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "open" });
    this.dispatchEvent(event);
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute("popover-open");
    if (this instanceof HTMLDialogElement) this.removeAttribute("open");
    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "closed" });
    this.dispatchEvent(event);
  });
  vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (
    this: HTMLElement,
    selector: string,
  ) {
    if (selector === ":popover-open") return this.hasAttribute("popover-open");
    return originalMatches.call(this, selector);
  });
}

/** A drawer holding a Popover, a Selector and a ComplexSelector, each closable on its own. */
function DrawerWithLayers({ impl: Impl = Drawer }: { impl?: typeof Drawer }) {
  const [isDrawerOpen, setDrawerOpen] = useState(true);
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [fruit, setFruit] = useState<string | undefined>(undefined);
  return (
    <Impl isOpen={isDrawerOpen} onOpenChange={setDrawerOpen} label="Details">
      <Popover
        isOpen={isPopoverOpen}
        onOpenChange={setPopoverOpen}
        label="Filters"
        content={<input aria-label="Popover field" />}
      >
        <button type="button">Open filters</button>
      </Popover>
      <Selector
        label="Fruit"
        value={fruit}
        onChange={setFruit}
        options={[
          { value: "apple", label: "Apple" },
          { value: "banana", label: "Banana" },
        ]}
      />
      <ComplexSelector label="Owner" value="alice" triggerLabel="Alice">
        {() => <input aria-label="Owner search" />}
      </ComplexSelector>
    </Impl>
  );
}

const drawerIsOpen = () =>
  document.querySelector('dialog[aria-label="Details"]')!.hasAttribute("open");

describe("Drawer fork: Escape goes through core's layer-dismissal stack, as lab's does", () => {
  beforeEach(mockPopoverApi);

  it("closes on an Escape from inside the drawer", () => {
    const onOpenChange = renderDrawer(Drawer);
    fireEvent.keyDown(screen.getByLabelText("Drawer field"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("closes only an open Popover inside it, then itself on a second Escape", async () => {
    const user = userEvent.setup();
    render(<DrawerWithLayers />);
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    (await screen.findByLabelText("Popover field")).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(drawerIsOpen()).toBe(true);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(drawerIsOpen()).toBe(false));
  });

  it("closes only an open Selector inside it, then itself on a second Escape", async () => {
    const user = userEvent.setup();
    render(<DrawerWithLayers />);
    const trigger = screen.getByRole("combobox", { name: /Fruit/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(drawerIsOpen()).toBe(true);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(drawerIsOpen()).toBe(false));
  });

  it("closes only an open ComplexSelector inside it, then itself on a second Escape", async () => {
    const user = userEvent.setup();
    render(<DrawerWithLayers />);
    const trigger = screen.getByRole("button", { name: "Owner" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    (await screen.findByLabelText("Owner search")).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(drawerIsOpen()).toBe(true);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(drawerIsOpen()).toBe(false));
  });

  it("closes nested drawers top-first", () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    render(
      <Drawer isOpen onOpenChange={closeOuter} label="Outer">
        <Drawer isOpen onOpenChange={closeInner} label="Inner">
          <input aria-label="Inner field" />
        </Drawer>
      </Drawer>,
    );
    fireEvent.keyDown(screen.getByLabelText("Inner field"), { key: "Escape" });
    expect(closeInner).toHaveBeenCalledExactlyOnceWith(false);
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it("ignores an Escape that ends an IME composition", () => {
    const onOpenChange = renderDrawer(Drawer);
    fireEvent.keyDown(screen.getByLabelText("Drawer field"), {
      key: "Escape",
      isComposing: true,
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("answers a native close request only while it is the top layer", () => {
    const closeOuter = vi.fn();
    render(
      <Drawer isOpen onOpenChange={closeOuter} label="Outer">
        <Drawer isOpen onOpenChange={() => {}} label="Inner">
          Inner
        </Drawer>
      </Drawer>,
    );
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog", { name: "Outer" }), cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(closeOuter).not.toHaveBeenCalled();
  });

  it("leaves an Escape in a modal opened inside it to that modal", async () => {
    const closeDrawer = vi.fn();
    const closeModal = vi.fn();
    render(
      <Drawer isOpen onOpenChange={closeDrawer} label="Details">
        <Modal isOpen onOpenChange={closeModal} title="Edit">
          <input aria-label="Modal field" />
        </Modal>
      </Drawer>,
    );
    const field = await screen.findByLabelText("Modal field");
    fireEvent.keyDown(field, { key: "Escape" });
    expect(closeModal).toHaveBeenCalledWith(false);
    expect(closeDrawer).not.toHaveBeenCalled();
  });

  it("matches lab's, which closes only the Popover on the first Escape", async () => {
    const user = userEvent.setup();
    render(<DrawerWithLayers impl={UpstreamDrawer} />);
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);
    (await screen.findByLabelText("Popover field")).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(drawerIsOpen()).toBe(true);
  });
});

// jsdom stubs showModal and has no top layer, so these pin the wiring; the
// stacking itself was checked in Chromium (a Modal inside a scrimmed drawer
// takes the hit test and typing, Escape closes it alone).
describe("Drawer fork: a Modal inside", () => {
  it("renders into a scrimmed drawer's dialog and enters the top layer", async () => {
    mockPopoverApi();
    render(
      <Drawer isOpen onOpenChange={() => {}} label="Details">
        <input aria-label="Drawer field" />
        <Modal isOpen onOpenChange={() => {}} title="Edit">
          <input aria-label="Modal field" />
        </Modal>
      </Drawer>,
    );
    const field = await screen.findByLabelText("Modal field");
    const root = field.closest(".uic-modal") as HTMLElement;
    const drawer = screen.getByRole("dialog", { name: "Details", hidden: true });
    expect(root.parentElement).toBe(drawer);
    expect(root).toHaveAttribute("popover", "manual");
    expect(HTMLElement.prototype.showPopover).toHaveBeenCalled();
    expect(root.matches(":popover-open")).toBe(true);
    // The drawer's own content is covered; the modal is not.
    expect(screen.getByLabelText("Drawer field").closest("[inert]")).not.toBeNull();
    expect(field.closest("[inert]")).toBeNull();
  });

  it("leaves the top layer when it closes", async () => {
    mockPopoverApi();
    const { rerender } = render(
      <Drawer isOpen onOpenChange={() => {}} label="Details">
        <Modal isOpen onOpenChange={() => {}} title="Edit">
          <input aria-label="Modal field" />
        </Modal>
      </Drawer>,
    );
    const root = (await screen.findByLabelText("Modal field")).closest(
      ".uic-modal",
    ) as HTMLElement;
    rerender(
      <Drawer isOpen onOpenChange={() => {}} label="Details">
        <Modal isOpen={false} onOpenChange={() => {}} title="Edit">
          <input aria-label="Modal field" />
        </Modal>
      </Drawer>,
    );
    expect(root.matches(":popover-open")).toBe(false);
  });

  it("renders into a scrimless drawer's dialog too, which is a top-layer popover", async () => {
    mockPopoverApi();
    render(
      <Drawer isOpen onOpenChange={() => {}} label="Details" hasScrim={false}>
        <Modal isOpen onOpenChange={() => {}} title="Edit">
          <input aria-label="Modal field" />
        </Modal>
      </Drawer>,
    );
    const field = await screen.findByLabelText("Modal field");
    const root = field.closest(".uic-modal") as HTMLElement;
    const drawer = screen.getByRole("dialog", { name: "Details", hidden: true });
    // The drawer itself is in the top layer, so a body portal would sit behind it.
    expect(drawer.matches(":popover-open")).toBe(true);
    expect(root.parentElement).toBe(drawer);
    expect(root).toHaveAttribute("popover", "manual");
    expect(root.matches(":popover-open")).toBe(true);
  });
});

describe("Drawer fork: aria-modal", () => {
  it("keeps upstream's default: modal with a scrim, unset without", () => {
    const { rerender } = render(
      <Drawer isOpen onOpenChange={() => {}} label="Details">
        Content
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    rerender(
      <Drawer isOpen onOpenChange={() => {}} label="Details" hasScrim={false}>
        Content
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal");
  });

  it("passes a consumer's aria-modal through on a scrimless drawer", () => {
    render(
      <Drawer
        isOpen
        onOpenChange={() => {}}
        label="Details"
        hasScrim={false}
        aria-modal="true"
      >
        Content
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("still differs from lab's, which overrides it", () => {
    render(
      <UpstreamDrawer
        isOpen
        onOpenChange={() => {}}
        label="Details"
        hasScrim={false}
        aria-modal="true"
      >
        Content
      </UpstreamDrawer>,
    );
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal");
  });
});

describe("Drawer fork: parity with lab", () => {
  function Toggle({ impl: Impl, ...props }: { impl: typeof Drawer } & object) {
    const [isOpen] = useState(true);
    return (
      <Impl isOpen={isOpen} onOpenChange={() => {}} label="Details" {...props}>
        Content
      </Impl>
    );
  }

  const cases: Array<[string, object]> = [
    ["the defaults", {}],
    ["start side, no scrim", { side: "start", hasScrim: false }],
    ["a required purpose", { purpose: "required" }],
    [
      "a string width, full width on mobile",
      { width: "32rem", isFullWidthOnMobile: true },
    ],
  ];

  it.each(cases)("renders lab's markup with %s", (_, props) => {
    const fork = render(<Toggle impl={Drawer} {...props} />);
    const upstream = render(<Toggle impl={UpstreamDrawer} {...props} />);
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });

  it("renders lab's markup while closed", () => {
    const fork = render(
      <Drawer isOpen={false} onOpenChange={() => {}} label="Details">
        Content
      </Drawer>,
    );
    const upstream = render(
      <UpstreamDrawer isOpen={false} onOpenChange={() => {}} label="Details">
        Content
      </UpstreamDrawer>,
    );
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });
});
