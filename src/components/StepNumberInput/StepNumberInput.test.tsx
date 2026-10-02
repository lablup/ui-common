import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InputGroup } from "@astryxdesign/core/InputGroup";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { NumberStepper, getNextStepIndex } from "./NumberStepper";
import { StepNumberInput } from "./StepNumberInput";

const STEPS = [0, 0.5, 1, 2, 4, 8, 16];

const renderStepper = (onStep: (d: "up" | "down") => void = () => {}) =>
  render(
    <InputGroup label="Amount" isLabelHidden>
      <NumberStepper onStep={onStep} />
    </InputGroup>,
  );

describe("NumberStepper", () => {
  // The weld is CSS, which jsdom does not apply; these pin the DOM the
  // stylesheet is written against.
  it("is an InputGroupText slot whose two buttons are its direct children", () => {
    const { container } = renderStepper();
    const slot = container.querySelector(".uic-number-stepper") as HTMLElement;
    expect(slot).toHaveClass("astryx-input-group-text");
    expect(slot.children).toHaveLength(2);
    for (const el of slot.children)
      expect(el).toHaveClass("uic-number-stepper__button");
    expect(screen.getByLabelText("Increase")).toHaveClass(
      "uic-number-stepper__button--increase",
    );
    expect(screen.getByLabelText("Decrease")).toHaveClass(
      "uic-number-stepper__button--decrease",
    );
  });

  it("keeps both halves off the tab order", () => {
    const { container } = renderStepper();
    for (const el of container.querySelectorAll(".uic-number-stepper__button")) {
      expect(el).toHaveAttribute("tabindex", "-1");
      expect(el).toHaveAttribute("type", "button");
    }
  });

  it("reports each half's direction", async () => {
    const steps: string[] = [];
    renderStepper((d) => steps.push(d));
    await userEvent.click(screen.getByLabelText("Increase"));
    await userEvent.click(screen.getByLabelText("Decrease"));
    expect(steps).toEqual(["up", "down"]);
  });

  it("disables both halves together", () => {
    render(
      <InputGroup label="Amount" isLabelHidden>
        <NumberStepper onStep={() => {}} isDisabled />
      </InputGroup>,
    );
    expect(screen.getByLabelText("Increase")).toBeDisabled();
    expect(screen.getByLabelText("Decrease")).toBeDisabled();
  });

  it("names its halves through the catalog, or as given", () => {
    const { unmount } = render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <InputGroup label="Amount" isLabelHidden>
          <NumberStepper onStep={() => {}} />
        </InputGroup>
      </InternationalizationProvider>,
    );
    expect(screen.getByLabelText("증가")).toBeInTheDocument();
    expect(screen.getByLabelText("감소")).toBeInTheDocument();
    unmount();

    render(
      <InputGroup label="Amount" isLabelHidden>
        <NumberStepper onStep={() => {}} increaseLabel="More" decreaseLabel="Less" />
      </InputGroup>,
    );
    expect(screen.getByLabelText("More")).toBeInTheDocument();
    expect(screen.getByLabelText("Less")).toBeInTheDocument();
  });
});

describe("getNextStepIndex", () => {
  it("moves one rung from a value on a rung", () => {
    const rungs = [1, 2, 4, 8, 16];
    expect(getNextStepIndex(rungs, 4, "up")).toBe(3);
    expect(getNextStepIndex(rungs, 4, "down")).toBe(1);
  });

  it("moves to the nearer rung from between rungs", () => {
    const rungs = [1, 2, 4, 8, 16];
    expect(getNextStepIndex(rungs, 3, "up")).toBe(2);
    expect(getNextStepIndex(rungs, 3, "down")).toBe(1);
  });

  it("can leave the list, for the caller to decide", () => {
    const rungs = [1, 2, 4];
    expect(getNextStepIndex(rungs, 4, "up")).toBe(3);
    expect(getNextStepIndex(rungs, 1, "down")).toBe(-1);
  });
});

function Controlled(props: { initial: number; min?: number; max?: number }) {
  const [value, setValue] = useState(props.initial);
  return (
    <StepNumberInput
      label="Size"
      steps={STEPS}
      value={value}
      onChange={setValue}
      min={props.min}
      max={props.max}
    />
  );
}

const field = () => screen.getByRole("spinbutton", { name: /Size/ });

describe("StepNumberInput", () => {
  it("steps along the list from the buttons", async () => {
    render(<Controlled initial={2} />);
    await userEvent.click(screen.getByLabelText("Increase"));
    expect(field()).toHaveValue("4");
    await userEvent.click(screen.getByLabelText("Decrease"));
    await userEvent.click(screen.getByLabelText("Decrease"));
    expect(field()).toHaveValue("1");
  });

  it("steps along the list, not linearly, on ArrowUp and ArrowDown", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={4} />);
    await user.click(field());
    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("8");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(field()).toHaveValue("2");
  });

  it("stays put at either end of the list", async () => {
    const onChange = vi.fn();
    render(
      <StepNumberInput label="Size" steps={STEPS} value={16} onChange={onChange} />,
    );
    await userEvent.click(screen.getByLabelText("Increase"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps a step to min and max", async () => {
    render(<Controlled initial={4} max={6} />);
    await userEvent.click(screen.getByLabelText("Increase"));
    expect(field()).toHaveValue("6");
  });

  it("works uncontrolled from defaultValue, or the first step", async () => {
    const onChange = vi.fn();
    render(<StepNumberInput label="Size" steps={[1, 2, 4]} onChange={onChange} />);
    expect(field()).toHaveValue("1");
    await userEvent.click(screen.getByLabelText("Increase"));
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(field()).toHaveValue("2");
  });

  it("does not step while disabled", async () => {
    const onChange = vi.fn();
    render(
      <StepNumberInput
        label="Size"
        steps={STEPS}
        value={2}
        onChange={onChange}
        isDisabled
      />,
    );
    expect(screen.getByLabelText("Increase")).toBeDisabled();
    field().focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("labels the group and hides the label on request", () => {
    render(<StepNumberInput label="Size" isLabelHidden steps={STEPS} value={1} />);
    expect(field()).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Size" })).toBeInTheDocument();
  });
});
