import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { Statistic } from "./Statistic";

const bar = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[role="progressbar"]');

describe("Statistic", () => {
  it("renders the label, the value and its unit", () => {
    render(<Statistic label="Memory" value={512} unit="MB" />);
    expect(screen.getByText("Memory")).toBeInTheDocument();
    expect(screen.getByText("512")).toBeInTheDocument();
    expect(screen.getByText("MB")).toBeInTheDocument();
  });

  it("renders a node label", () => {
    render(<Statistic label={<span data-testid="label">CPU</span>} value={1} />);
    expect(screen.getByTestId("label")).toBeInTheDocument();
  });

  it.each([
    [3.14159, undefined, "3.14"],
    [3.14159, 3, "3.142"],
    [5.0, 2, "5"],
    [3.14159, 0, "3"],
    [1234567.89, 2, "1234567.89"],
    [0.00123, 5, "0.00123"],
    [-50, 2, "-50"],
    [0, 2, "0"],
  ])("formats %s at precision %s as %s", (value, precision, text) => {
    render(<Statistic label="Usage" value={value} precision={precision} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([Infinity, -Infinity, NaN])("shows Unlimited for %s", (value) => {
    render(<Statistic label="Usage" value={value} unit="GB" />);
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    expect(screen.queryByText("GB")).not.toBeInTheDocument();
  });

  it("takes Unlimited from the shipped translations, or from a prop", () => {
    const { rerender } = render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <Statistic label="Usage" value={Infinity} />
      </InternationalizationProvider>,
    );
    expect(screen.getByText("제한없음")).toBeInTheDocument();
    rerender(<Statistic label="Usage" value={Infinity} unlimitedLabel="No cap" />);
    expect(screen.getByText("No cap")).toBeInTheDocument();
  });

  it("draws no bar unless asked, and none without a total", () => {
    const { container, rerender } = render(
      <Statistic label="CPU" value={4} total={8} />,
    );
    expect(bar(container)).toBeNull();
    rerender(<Statistic label="CPU" value={4} progressMode="visible" />);
    expect(bar(container)).toBeNull();
  });

  it("draws the bar as notches, filled by value over total", () => {
    const { container } = render(
      <Statistic
        label="CPU"
        value={4}
        total={8}
        progressMode="visible"
        progressSteps={10}
        color="rgb(255, 0, 0)"
      />,
    );
    expect(bar(container)).toHaveAttribute("aria-valuenow", "50");
    expect(bar(container)).toHaveAccessibleName("CPU");
    const steps = container.querySelectorAll<HTMLElement>(".uic-statistic__step");
    expect(steps).toHaveLength(10);
    expect(container.querySelectorAll(".uic-statistic__step--filled")).toHaveLength(5);
    expect(steps[0]!.style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(steps[9]!.style.backgroundColor).toBe("");
    expect(screen.getByText("4")).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it.each([
    [8, 8, "100"],
    [10, 8, "125"],
    [0, 8, "0"],
    [5, 0, "100"],
    [0, 0, "0"],
    [undefined, 0, "100"],
    [undefined, 8, "100"],
    [5, Infinity, "0"],
    [Infinity, 8, "100"],
    [3, 7.5, "40"],
    [2.5, 10, "25"],
  ])("reports %s of %s as %s%%", (value, total, percent) => {
    const { container } = render(
      <Statistic label="CPU" value={value} total={total} progressMode="visible" />,
    );
    expect(bar(container)).toHaveAttribute("aria-valuenow", percent);
  });

  it("keeps a placeholder bar's space without painting it", () => {
    const { container } = render(
      <Statistic label="CPU" value={4} total={8} progressMode="placeholder" />,
    );
    expect(bar(container)).toHaveAttribute("aria-valuenow", "0");
    expect(container.querySelector(".uic-statistic__step")).toHaveClass(
      "uic-statistic__step--placeholder",
    );
  });

  it("shows value over total in the bar's tooltip", async () => {
    const { container } = render(
      <Statistic label="Memory" value={4} total={8} unit="GB" progressMode="visible" />,
    );
    const strip = container.querySelector(".uic-statistic__steps")!;
    fireEvent.pointerEnter(strip.parentElement ?? strip);
    fireEvent.mouseOver(strip);
    expect(await screen.findByText("4 GB / 8 GB")).toBeInTheDocument();
  });

  it("passes class names, inline styles and attributes to the root", () => {
    const { container } = render(
      <Statistic
        label="CPU"
        value={1}
        className="extra"
        style={{ backgroundColor: "red" }}
        data-testid="stat"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("uic-statistic", "extra");
    expect(root.style.backgroundColor).toBe("red");
    expect(root).toHaveAttribute("data-testid", "stat");
  });
});
