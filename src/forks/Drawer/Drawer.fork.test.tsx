/**
 * ui-common's tests for its Drawer fork: the fixes it carries (Escape
 * containment, `aria-modal` passthrough), and that everything else renders
 * exactly as lab's does.
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Drawer as UpstreamDrawer } from "@astryxdesign/lab";

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

describe("Drawer fork: Escape containment", () => {
  it("still closes on an Escape from inside the drawer", () => {
    const onOpenChange = renderDrawer(Drawer);
    fireEvent.keyDown(screen.getByLabelText("Drawer field"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("ignores an Escape from a layer portalled out of its children", () => {
    const onOpenChange = renderDrawer(Drawer);
    const layerInput = screen.getByTestId("layer-input");
    expect(screen.getByRole("dialog").contains(layerInput)).toBe(false);
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    layerInput.dispatchEvent(event);
    expect(onOpenChange).not.toHaveBeenCalled();
    // Left for the layer's own dismissal to act on.
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores an Escape that ends an IME composition", () => {
    const onOpenChange = renderDrawer(Drawer);
    fireEvent.keyDown(screen.getByLabelText("Drawer field"), {
      key: "Escape",
      isComposing: true,
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // When these fail, lab has shipped the fix: delete the fork and its
  // exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from lab's, which acts on the portalled Escape", () => {
    const onOpenChange = renderDrawer(UpstreamDrawer);
    fireEvent.keyDown(screen.getByTestId("layer-input"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
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
    [
      "start side, no scrim, no close button",
      { side: "start", hasScrim: false, hasCloseButton: false },
    ],
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
