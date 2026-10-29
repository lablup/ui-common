import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { DoubleBadge, type DoubleBadgeProps } from "./DoubleBadge";

const root = (c: HTMLElement) => c.querySelector(".uic-double-badge") as HTMLElement;

describe("DoubleBadge", () => {
  it("anchors the weld on `uic-double-badge` and pins the gap to 0", () => {
    const { container } = render(<DoubleBadge values={["ALIVE", "26.4"]} />);
    expect(root(container)).toBeInTheDocument();
    expect(root(container)).toHaveAttribute("data-gap", "0");
  });

  it("renders each value as a direct, welded badge child with its variant", () => {
    const { container } = render(
      <DoubleBadge
        values={[{ label: "ALIVE", variant: "success" }, { label: "26.4.0" }]}
      />,
    );
    const badges = Array.from(root(container).children);
    expect(badges).toHaveLength(2);
    badges.forEach((el) => expect(el).toHaveClass("uic-double-badge__item"));
    expect(badges.map((el) => el.textContent)).toEqual(["ALIVE", "26.4.0"]);
    expect(badges.map((el) => el.getAttribute("data-variant"))).toEqual([
      "success",
      "neutral",
    ]);
  });

  it("renders the string shorthand as neutral", () => {
    const { container } = render(<DoubleBadge values={["Elapsed", "1m"]} />);
    Array.from(root(container).children).forEach((el) =>
      expect(el).toHaveAttribute("data-variant", "neutral"),
    );
  });

  it("skips empty labels and renders nothing for an empty list", () => {
    const { container } = render(
      <DoubleBadge values={[{ label: "A" }, { label: "" }]} />,
    );
    expect(root(container).children).toHaveLength(1);
    const { container: empty } = render(<DoubleBadge values={[]} />);
    expect(empty).toBeEmptyDOMElement();
  });

  // jsdom drops `@layer`, so the divider is read from the stylesheet source.
  describe("divider", () => {
    const CSS = readFileSync(join(__dirname, "DoubleBadge.css"), "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );

    /** Declarations of every rule whose selector list includes `selector`. */
    function declarationsFor(selector: string): string[] {
      return [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter((m) =>
          (m[1] ?? "")
            .split(",")
            .map((s) => s.trim())
            .includes(selector),
        )
        .flatMap((m) =>
          (m[2] ?? "")
            .split(";")
            .map((d) => d.trim().replace(/\s+/g, " "))
            .filter(Boolean),
        );
    }

    it("draws its own divider before every badge but the first", () => {
      expect(
        declarationsFor(".uic-double-badge__item:not(:first-child)::before"),
      ).toEqual(
        expect.arrayContaining([
          'content: ""',
          "position: absolute",
          "inset-inline-start: 0",
          "width: var(--border-width)",
          "background-color: var(--uic-double-badge-divider, var(--color-border-emphasized))",
        ]),
      );
      expect(declarationsFor(".uic-double-badge__item:not(:first-child)")).toContain(
        "position: relative",
      );
    });

    it.each([
      ["info", "blue"],
      ["success", "green"],
      ["warning", "yellow"],
      ["error", "red"],
      ["blue", "blue"],
      ["cyan", "cyan"],
      ["green", "green"],
      ["orange", "orange"],
      ["pink", "pink"],
      ["purple", "purple"],
      ["red", "red"],
      ["teal", "teal"],
      ["yellow", "yellow"],
    ])("draws a %s badge's divider in the %s border", (variant, hue) => {
      expect(
        declarationsFor(`.uic-double-badge__item[data-variant="${variant}"]::before`),
      ).toEqual([`background-color: var(--color-border-${hue})`]);
    });

    it.each([
      ["info", "blue"],
      ["success", "green"],
      ["warning", "yellow"],
      ["error", "red"],
      ["teal", "teal"],
    ])(
      "draws the divider after a %s badge in the %s border, ahead of the next badge's own",
      (variant, hue) => {
        expect(
          declarationsFor(
            `.uic-double-badge__item[data-variant="${variant}"] + .uic-double-badge__item::before`,
          ),
        ).toEqual([`background-color: var(--color-border-${hue})`]);
      },
    );

    it("keeps a neutral badge's divider in the theme's divider token, else the emphasized border", () => {
      expect(
        declarationsFor('.uic-double-badge__item[data-variant="neutral"]::before'),
      ).toEqual([]);
    });

    it("lays the divider on the overlapped column, so an outlined theme gets one line", () => {
      const item = declarationsFor(".uic-double-badge__item:not(:first-child)");
      expect(item).toContain("margin-inline-start: calc(var(--border-width) * -1)");
      expect(item.some((d) => d.startsWith("border-inline-start"))).toBe(false);
    });
  });

  it("takes shorthand and object values mixed in one list", () => {
    // Type-level too: `pnpm run typecheck` rejects this file if the element
    // type is not a union.
    const values: DoubleBadgeProps["values"] = [
      { label: "RUNNING", variant: "success" },
      "2m",
    ];
    const { container } = render(<DoubleBadge values={values} />);
    expect(
      Array.from(root(container).children).map((el) => [
        el.textContent,
        el.getAttribute("data-variant"),
      ]),
    ).toEqual([
      ["RUNNING", "success"],
      ["2m", "neutral"],
    ]);
  });
});
