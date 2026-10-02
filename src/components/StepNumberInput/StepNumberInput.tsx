/**
 * StepNumberInput
 *
 * A number field that steps along a list of values instead of by a fixed
 * step: `[0.25, 0.5, 1, 2, 4, 8]` goes 2 → 4 → 8 on the stepper and on
 * ArrowUp/ArrowDown, and a typed 3 steps up to 4. A typed value is kept as
 * typed. `min` and `max` clamp a step.
 *
 * `NumberInput`'s own stepping is linear, so the field cancels its
 * ArrowUp/ArrowDown and the column beside it is a `NumberStepper`.
 *
 * @example
 * <StepNumberInput
 *   label="Shared memory"
 *   steps={[0.25, 0.5, 1, 2, 4, 8]}
 *   units="GiB"
 *   value={value}
 *   onChange={setValue}
 * />
 */
import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { InputGroup } from "@astryxdesign/core/InputGroup";
import { NumberInput } from "@astryxdesign/core/NumberInput";

import { NumberStepper, getNextStepIndex, type StepDirection } from "./NumberStepper";

export interface StepNumberInputProps {
  /** The values the stepper moves between. */
  steps: readonly number[];
  /** The value, when controlled. */
  value?: number;
  /** The first value when uncontrolled. Default: `steps[0]` */
  defaultValue?: number;
  /** Called with the new value. A cleared field reports 0. */
  onChange?: (value: number) => void;
  /** Lower bound for typing and stepping. */
  min?: number;
  /** Upper bound for typing and stepping. */
  max?: number;
  /** Unit shown in the field ("GiB"). */
  units?: string;
  /** Accessible name. */
  label: string;
  /** Hides the label visually; it stays the accessible name. Default: false */
  isLabelHidden?: boolean;
  placeholder?: string;
  isDisabled?: boolean;
  /** Accessible name of the step-up button. Default: NumberStepper's */
  increaseLabel?: string;
  /** Accessible name of the step-down button. Default: NumberStepper's */
  decreaseLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function StepNumberInput({
  steps,
  value: valueProp,
  defaultValue,
  onChange,
  min,
  max,
  units,
  label,
  isLabelHidden = false,
  placeholder,
  isDisabled,
  increaseLabel,
  decreaseLabel,
  className,
  style,
}: StepNumberInputProps) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? steps[0] ?? 0);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : innerValue;

  const setValue = (next: number) => {
    if (!isControlled) setInnerValue(next);
    onChange?.(next);
  };

  const step = (direction: StepDirection) => {
    const index = getNextStepIndex(steps, value, direction);
    if (index < 0 || index >= steps.length) return;
    let next = [...steps].sort((a, b) => a - b)[index] ?? value;
    if (min !== undefined && next < min) next = min;
    else if (max !== undefined && next > max) next = max;
    setValue(next);
  };

  // ArrowUp/ArrowDown would step linearly by `step`; step the list instead.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    step(event.key === "ArrowUp" ? "up" : "down");
  };

  return (
    <InputGroup
      label={label}
      isLabelHidden={isLabelHidden}
      isDisabled={isDisabled}
      className={className}
      style={style}
    >
      <NumberInput
        label={label}
        isLabelHidden
        value={value}
        onChange={(next) => setValue(next ?? 0)}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        units={units}
        placeholder={placeholder}
        isDisabled={isDisabled}
        width="100%"
      />
      <NumberStepper
        onStep={step}
        isDisabled={isDisabled}
        increaseLabel={increaseLabel}
        decreaseLabel={decreaseLabel}
      />
    </InputGroup>
  );
}

StepNumberInput.displayName = "StepNumberInput";
