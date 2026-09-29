import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProgressWithLabel } from "./ProgressWithLabel";

const fillOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".uic-progress-with-label__fill")!;
const rootOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".uic-progress-with-label")!;

describe("ProgressWithLabel", () => {
  it("renders both labels over a fill of value percent", () => {
    const { container } = render(
      <ProgressWithLabel label="CPU" valueLabel="3 / 8" value={37.5} />,
    );
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("3 / 8")).toBeInTheDocument();
    expect(fillOf(container).style.width).toBe("37.5%");
  });

  it.each([
    [undefined, "0%"],
    [Number.NaN, "0%"],
    [0, "0%"],
    [150, "100%"],
  ])("fills %s as %s", (value, width) => {
    const { container } = render(<ProgressWithLabel label="x" value={value} />);
    expect(fillOf(container).style.width).toBe(width);
  });

  it("greys the value label while the value is missing", () => {
    render(<ProgressWithLabel label="x" valueLabel="-" />);
    expect(screen.getByText("-")).toHaveAttribute("data-color", "disabled");
  });

  it("keeps the value label's space when hasValueLabel is false", () => {
    const { container } = render(
      <ProgressWithLabel
        label="x"
        valueLabel="hidden"
        value={10}
        hasValueLabel={false}
      />,
    );
    expect(screen.queryByText("hidden")).toBeNull();
    expect(
      container.querySelector(".uic-progress-with-label__value")?.textContent,
    ).toBe(" ");
  });

  it("takes a width, or grows without one", () => {
    const fixed = render(<ProgressWithLabel label="x" width={120} />);
    expect(rootOf(fixed.container).style.width).toBe("120px");
    expect(rootOf(fixed.container)).not.toHaveClass("uic-progress-with-label--grow");

    const grown = render(<ProgressWithLabel label="y" />);
    expect(rootOf(grown.container)).toHaveClass("uic-progress-with-label--grow");
  });

  it("sets the fill colour, size, style and label style", () => {
    const { container } = render(
      <ProgressWithLabel
        label="x"
        value={10}
        color="var(--color-error)"
        size="lg"
        style={{ border: "none" }}
        labelStyle={{ height: "8px" }}
      />,
    );
    const root = rootOf(container);
    expect(root.style.getPropertyValue("--uic-progress-with-label-color")).toBe(
      "var(--color-error)",
    );
    expect(root).toHaveClass("uic-progress-with-label--lg");
    expect(root.style.borderStyle).toBe("none");
    expect(screen.getByText("x").style.height).toBe("8px");
  });
});
