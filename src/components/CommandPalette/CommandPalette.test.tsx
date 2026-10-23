/**
 * CommandPalette: Astryx's, pinned to the top of the viewport.
 *
 * jsdom drops `@layer` blocks and does no layout, so the placement is read
 * from the stylesheet source and the rendered class, and the height cap from
 * the dialog's inline style.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette as AstryxCommandPalette } from "@astryxdesign/core/CommandPalette";
import { createStaticSource } from "@astryxdesign/core/Typeahead";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "./CommandPalette";

const source = createStaticSource([
  { id: "home", label: "Home" },
  { id: "settings", label: "Settings" },
  { id: "sessions", label: "Sessions" },
]);

const AVAILABLE = "calc(100dvh - var(--command-palette-top) - var(--spacing-4))";

beforeEach(() => {
  // jsdom does not implement <dialog> showModal/close.
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("CommandPalette", () => {
  it("is a named modal dialog with the search combobox", () => {
    render(<CommandPalette isOpen onOpenChange={() => {}} searchSource={source} />);
    const dialog = screen.getByRole("dialog", { name: "Command palette" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("pins the dialog to the top, keeping the caller's class", () => {
    render(
      <CommandPalette
        isOpen
        onOpenChange={() => {}}
        searchSource={source}
        className="app-palette"
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("uic-command-palette");
    expect(dialog).toHaveClass("app-palette");
  });

  it("keeps the same dialog while the results narrow", async () => {
    const user = userEvent.setup();
    render(<CommandPalette isOpen onOpenChange={() => {}} searchSource={source} />);
    const dialog = screen.getByRole("dialog");
    expect(await screen.findAllByRole("option")).toHaveLength(3);

    await user.type(screen.getByRole("combobox"), "set");
    expect(await screen.findAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(dialog).toHaveClass("uic-command-palette");
  });

  it("caps Astryx's default max height by the viewport below the offset", () => {
    render(<CommandPalette isOpen onOpenChange={() => {}} searchSource={source} />);
    expect(screen.getByRole("dialog").getAttribute("style")).toContain(
      `min(480px, ${AVAILABLE})`,
    );
  });

  it("caps a passed max height the same way", () => {
    const { unmount } = render(
      <CommandPalette
        isOpen
        onOpenChange={() => {}}
        searchSource={source}
        maxHeight={320}
      />,
    );
    expect(screen.getByRole("dialog").getAttribute("style")).toContain(
      `min(320px, ${AVAILABLE})`,
    );
    unmount();

    render(
      <CommandPalette
        isOpen
        onOpenChange={() => {}}
        searchSource={source}
        maxHeight="60dvh"
      />,
    );
    expect(screen.getByRole("dialog").getAttribute("style")).toContain(
      `min(60dvh, ${AVAILABLE})`,
    );
  });

  it("leaves the inline preview as Astryx renders it", () => {
    const { container } = render(
      <CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} />,
    );
    expect(container.querySelector(".uic-command-palette")).toBeNull();
    expect(container.innerHTML).not.toContain("--command-palette-top");
  });

  it("differs from Astryx's only in the class and the height cap", () => {
    const { unmount } = render(
      <AstryxCommandPalette isOpen onOpenChange={() => {}} searchSource={source} />,
    );
    const astryx = screen.getByRole("dialog");
    expect(astryx).not.toHaveClass("uic-command-palette");
    expect(astryx.getAttribute("style")).not.toContain("--command-palette-top");
    unmount();
  });
});

describe("CommandPalette.css", () => {
  const css = readFileSync(join(__dirname, "CommandPalette.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );

  it("sets a fixed top margin and an auto bottom one on the dialog", () => {
    const rule = /\.uic-command-palette\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).toMatch(/--command-palette-top:\s*15dvh/);
    expect(rule).toMatch(/margin-block:\s*var\(--command-palette-top\)\s+auto/);
  });
});
