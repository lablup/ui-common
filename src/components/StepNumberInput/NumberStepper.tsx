/**
 * NumberStepper
 *
 * The up/down column of a number field whose steps are not linear. Astryx's
 * `NumberInput hasNumberSteppers` snaps to a grid anchored at `min`
 * (`min + n * step`), so no `step` goes 8 → 16 up and 8 → 4 down, and its
 * buttons expose no hook to replace the arithmetic. This column is drawn the
 * way Astryx draws its own: the same width, the same chevron, rotated for
 * the upper half, the same hairline between the halves.
 *
 * It must sit inside an `InputGroup`: `InputGroupText` is what welds the
 * column to the field.
 *
 * Unlike Astryx's buttons, these do not move focus back into the field; they
 * only keep a click from taking it away.
 *
 * @example
 * <InputGroup label="Size" isLabelHidden>
 *   <NumberInput label="Size" isLabelHidden value={value} onChange={setValue} />
 *   <NumberStepper onStep={(direction) => setValue(stepTo(direction))} />
 * </InputGroup>
 */
import { Icon } from "@astryxdesign/core/Icon";
import { InputGroupText } from "@astryxdesign/core/InputGroup";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import "./NumberStepper.css";

export type StepDirection = "up" | "down";

export interface NumberStepperProps {
  /** Called with the direction of the half that was pressed. */
  onStep: (direction: StepDirection) => void;
  /** Disables both halves. */
  isDisabled?: boolean;
  /**
   * Accessible name of the upper half.
   * @default the catalog's uic.NumberStepper.increase ("Increase")
   */
  increaseLabel?: string;
  /**
   * Accessible name of the lower half.
   * @default the catalog's uic.NumberStepper.decrease ("Decrease")
   */
  decreaseLabel?: string;
}

export function NumberStepper({
  onStep,
  isDisabled,
  increaseLabel,
  decreaseLabel,
}: NumberStepperProps) {
  const t = useUicTranslator();
  return (
    <InputGroupText className="uic-number-stepper">
      <button
        type="button"
        // Not a tab stop, and a click must not take focus from the field,
        // as with Astryx's own stepper.
        tabIndex={-1}
        className="uic-number-stepper__button uic-number-stepper__button--increase"
        aria-label={increaseLabel ?? t("uic.NumberStepper.increase")}
        disabled={isDisabled}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => onStep("up")}
      >
        <Icon icon="chevronDown" size="xsm" color="inherit" />
      </button>
      <button
        type="button"
        tabIndex={-1}
        className="uic-number-stepper__button uic-number-stepper__button--decrease"
        aria-label={decreaseLabel ?? t("uic.NumberStepper.decrease")}
        disabled={isDisabled}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => onStep("down")}
      >
        <Icon icon="chevronDown" size="xsm" color="inherit" />
      </button>
    </InputGroupText>
  );
}

NumberStepper.displayName = "NumberStepper";

/**
 * The index of the next rung of `steps` from `current`. A value already on a
 * rung moves one rung (↑ from 4 lands on 8); a value between rungs moves to
 * the nearer rung in that direction. The result can fall outside `steps`
 * (-1, or `steps.length`); the caller decides what that means: clamp, or
 * carry into another unit.
 */
export function getNextStepIndex(
  steps: readonly number[],
  current: number,
  direction: StepDirection,
): number {
  const sorted = [...steps].sort((a, b) => a - b);
  let index = 0;
  while (index < sorted.length && (sorted[index] ?? 0) < current) index += 1;
  if (direction === "up") return current === sorted[index] ? index + 1 : index;
  return index - 1;
}
