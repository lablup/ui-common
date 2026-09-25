import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { UnitGrid, type UnitGridGroup } from "./UnitGrid";

const unit = (color = "#3469d6") => ({ color });

const GROUPS: UnitGridGroup[] = [
  { key: "alpha", label: "Alpha", units: [unit(), unit(), unit()] },
  { key: "beta", label: "Beta", units: [unit("#b84134"), unit("#b84134")] },
];

const cellsOf = (container: HTMLElement, key?: string) =>
  container.querySelectorAll(
    key ? `.uic-unit-grid__cell[data-group-key="${key}"]` : ".uic-unit-grid__cell",
  );

describe("UnitGrid", () => {
  it("renders one cell per unit, attributed to its group by key", () => {
    const { container } = render(
      <UnitGrid groups={GROUPS} columns={8} aria-label="Unit grid" />,
    );
    expect(cellsOf(container)).toHaveLength(5);
    expect(cellsOf(container, "alpha")).toHaveLength(3);
    expect(cellsOf(container, "beta")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Unit grid" })).toBeInTheDocument();
  });

  it("caps each group at maxUnitsPerGroup", () => {
    const { container } = render(
      <UnitGrid
        groups={[{ key: "big", units: Array.from({ length: 10 }, unit) }]}
        maxUnitsPerGroup={4}
        columns={8}
      />,
    );
    expect(cellsOf(container, "big")).toHaveLength(4);
  });

  it("renders a partial-fill overlay for fraction cells", () => {
    const { container } = render(
      <UnitGrid
        groups={[{ key: "a", units: [unit(), { color: "#3469d6", fraction: 0.5 }] }]}
        columns={8}
      />,
    );
    // 2 base cells + 1 fraction overlay rect, all attributed to the group.
    expect(cellsOf(container, "a")).toHaveLength(2);
    expect(container.querySelectorAll('rect[data-group-key="a"]')).toHaveLength(3);
  });

  it("names each group plate for assistive tech", () => {
    const { container } = render(<UnitGrid groups={GROUPS} columns={8} />);
    // role="img" on the svg flattens its subtree for AT, so the groups are
    // enumerable through the parallel sr-only list (no <title> on the
    // plates — its only rendered effect was a native tooltip competing
    // with the component's own popover).
    const srItems = within(screen.getByRole("list"))
      .getAllByRole("listitem")
      .map((el) => el.textContent);
    expect(srItems).toEqual(["Alpha", "Beta"]);
    expect(container.querySelectorAll("path > title")).toHaveLength(0);
  });

  it("shows the popover slot content for the hovered group", () => {
    const { container } = render(
      <UnitGrid
        groups={GROUPS}
        columns={8}
        renderGroupPopover={(group) => <div>popover: {group.label}</div>}
      />,
    );
    fireEvent.mouseMove(cellsOf(container, "beta")[0]!);
    expect(screen.getByText("popover: Beta")).toBeInTheDocument();
    expect(screen.queryByText("popover: Alpha")).not.toBeInTheDocument();
  });

  // A `position: fixed` popover resolves its offsets against the nearest
  // transformed ancestor, not the viewport — a drawer panel is one, and the
  // popover landed off-screen there.
  it("rebases the popover onto the fixed-positioning containing block", () => {
    const WRAPPER_LEFT = 1144;
    const renderWithOrigin = (originLeft: number) => {
      const spy = vi
        .spyOn(Element.prototype, "getBoundingClientRect")
        .mockImplementation(function (this: Element) {
          if (this.classList.contains("uic-unit-grid__wrapper")) {
            return { left: WRAPPER_LEFT, top: 0 } as DOMRect;
          }
          // The zero-size probe the component appends to measure the origin.
          if (this.getAttribute("aria-hidden") === "true") {
            return { left: originLeft, top: 0 } as DOMRect;
          }
          return { left: 0, top: 0 } as DOMRect;
        });
      const { container, unmount } = render(
        <UnitGrid
          groups={GROUPS}
          columns={8}
          renderGroupPopover={(group) => <div>popover: {group.label}</div>}
        />,
      );
      fireEvent.mouseMove(cellsOf(container, "beta")[0]!);
      const popover = container.querySelector<HTMLElement>(".uic-unit-grid__popover");
      const left = parseFloat(popover?.style.left ?? "NaN");
      unmount();
      spy.mockRestore();
      return left;
    };

    const untransformed = renderWithOrigin(0);
    const insideDrawer = renderWithOrigin(1120);

    expect(untransformed).toBe(WRAPPER_LEFT);
    expect(insideDrawer).toBe(WRAPPER_LEFT - 1120);
  });

  it("keeps hover attribution keyed by group key when groups are reordered", () => {
    const renderPopover = (group: UnitGridGroup) => <div>popover: {group.label}</div>;
    const { container, rerender } = render(
      <UnitGrid groups={GROUPS} columns={8} renderGroupPopover={renderPopover} />,
    );
    rerender(
      <UnitGrid
        groups={[...GROUPS].reverse()}
        columns={8}
        renderGroupPopover={renderPopover}
      />,
    );
    fireEvent.mouseMove(cellsOf(container, "alpha")[0]!);
    expect(screen.getByText("popover: Alpha")).toBeInTheDocument();
  });

  it("fires onHueOverrideChange with (key, paletteIdx) from the picker", () => {
    const onHueOverrideChange = vi.fn();
    const { container } = render(
      <UnitGrid
        groups={GROUPS}
        columns={8}
        onHueOverrideChange={onHueOverrideChange}
      />,
    );
    fireEvent.mouseMove(cellsOf(container, "alpha")[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Change group color" }));
    fireEvent.click(screen.getByRole("button", { name: "Use color 3" }));
    expect(onHueOverrideChange).toHaveBeenCalledWith("alpha", 2);
  });

  it("falls back to a translated accessible name when aria-label is omitted", () => {
    render(<UnitGrid groups={GROUPS} columns={8} />);
    expect(screen.getByRole("img", { name: "Resource grid" })).toBeInTheDocument();
  });

  it("supports keyboard activation of the picker controls", () => {
    const onHueOverrideChange = vi.fn();
    const { container } = render(
      <UnitGrid
        groups={GROUPS}
        columns={8}
        onHueOverrideChange={onHueOverrideChange}
      />,
    );
    fireEvent.mouseMove(cellsOf(container, "alpha")[0]!);
    const toggle = screen.getByRole("button", { name: "Change group color" });
    expect(toggle).toHaveAttribute("tabindex", "0");
    // Enter on the toggle opens the palette row.
    fireEvent.keyDown(toggle, { key: "Enter" });
    const swatch = screen.getByRole("button", { name: "Use color 2" });
    expect(swatch).toHaveAttribute("tabindex", "0");
    // Space activates a swatch AND is prevented from scrolling the page.
    const spaceNotPrevented = fireEvent.keyDown(swatch, { key: " " });
    expect(spaceNotPrevented).toBe(false);
    expect(onHueOverrideChange).toHaveBeenCalledWith("alpha", 1);
  });

  it("fires onClickGroup with the group key", () => {
    const onClickGroup = vi.fn();
    const { container } = render(
      <UnitGrid groups={GROUPS} columns={8} onClickGroup={onClickGroup} />,
    );
    fireEvent.click(cellsOf(container, "beta")[1]!);
    expect(onClickGroup).toHaveBeenCalledWith("beta");
  });

  it("renders the empty fallback when there are no units to show", () => {
    const { container } = render(
      <UnitGrid groups={[]} columns={8} emptyFallback={<div>nothing here</div>} />,
    );
    expect(screen.getByText("nothing here")).toBeInTheDocument();
    expect(cellsOf(container)).toHaveLength(0);
  });

  it('renders a dashed plate outline only for plateVariant "dashed" groups', () => {
    const { container } = render(
      <UnitGrid
        groups={[
          {
            key: "pending-ish",
            units: [unit(), unit()],
            plateVariant: "dashed",
          },
          { key: "solid-default", units: [unit()] },
          { key: "solid-explicit", units: [unit()], plateVariant: "solid" },
        ]}
        columns={8}
      />,
    );
    const plateOf = (key: string) =>
      container.querySelector(`path[data-group-key="${key}"]`);
    expect(plateOf("pending-ish")).toHaveAttribute("stroke-dasharray", "6 4");
    expect(plateOf("solid-default")).not.toHaveAttribute("stroke-dasharray");
    expect(plateOf("solid-explicit")).not.toHaveAttribute("stroke-dasharray");
  });

  it("renders provided legend items", () => {
    render(
      <UnitGrid
        groups={GROUPS}
        columns={8}
        legendItems={[
          { color: "#42825c", label: "Low" },
          { color: "#b84134", label: "High" },
        ]}
      />,
    );
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});

describe("UnitGrid strings and theming", () => {
  it("takes its strings from the shipped translations, or from props", () => {
    const { container, rerender } = render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <UnitGrid groups={GROUPS} columns={8} onHueOverrideChange={() => {}} />
      </InternationalizationProvider>,
    );
    expect(screen.getByRole("img", { name: "자원 그리드" })).toBeInTheDocument();
    fireEvent.mouseMove(cellsOf(container, "alpha")[0]!);
    fireEvent.click(screen.getByRole("button", { name: "그룹 색상 변경" }));
    expect(screen.getByRole("button", { name: "색상 2 사용" })).toBeInTheDocument();

    rerender(
      <UnitGrid
        groups={GROUPS}
        columns={8}
        onHueOverrideChange={() => {}}
        changeGroupColorLabel="Recolor"
        colorSwatchLabel={(index) => `Hue ${index}`}
      />,
    );
    fireEvent.mouseMove(cellsOf(container, "alpha")[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Recolor" }));
    expect(screen.getByRole("button", { name: "Hue 4" })).toBeInTheDocument();
  });

  it("paints groups from the --uic-unit-grid-group-N hues unless given a palette", () => {
    const plate = (container: HTMLElement, key: string) =>
      container.querySelector<SVGPathElement>(`path[data-group-key="${key}"]`)!;
    const { container, rerender } = render(<UnitGrid groups={GROUPS} columns={8} />);
    expect(plate(container, "alpha").style.fill).toBe("var(--uic-unit-grid-group-1)");
    expect(plate(container, "beta").style.fill).toBe("var(--uic-unit-grid-group-2)");
    rerender(
      <UnitGrid
        groups={GROUPS}
        columns={8}
        groupPalette={["red", "blue"]}
        hueOverrides={{ alpha: 1 }}
      />,
    );
    expect(plate(container, "alpha").style.fill).toBe("blue");
    expect(plate(container, "beta").style.fill).toBe("blue");
  });

  it("inks the group initial with one of its two ink properties", () => {
    const { container } = render(<UnitGrid groups={GROUPS} columns={8} />);
    const inks = Array.from(container.querySelectorAll<SVGTextElement>("text")).map(
      (el) => el.style.fill,
    );
    expect(inks).toHaveLength(2);
    for (const ink of inks) {
      expect([
        "var(--uic-unit-grid-ink-dark)",
        "var(--uic-unit-grid-ink-light)",
      ]).toContain(ink);
    }
  });

  it("passes class names and attributes to the root", () => {
    const { container } = render(
      <UnitGrid groups={GROUPS} columns={8} className="extra" data-testid="grid" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("uic-unit-grid", "extra");
    expect(root).toHaveAttribute("data-testid", "grid");
  });
});
