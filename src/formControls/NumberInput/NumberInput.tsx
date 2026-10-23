/**
 * `NumberInput` for `Form.Item`: Astryx's NumberInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 *
 * Its value model is antd InputNumber's: emptying the field reports `null`
 * (`hasClear` is on unless set to `false`), a numeric string is read as its
 * number, and with `isIntegerOnly` a typed decimal is rounded on blur instead
 * of being dropped.
 */
import type { FocusEvent } from "react";
import {
  NumberInput as AstryxNumberInput,
  type NumberInputProps as AstryxNumberInputProps,
} from "@astryxdesign/core/NumberInput";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

type NumberInputValue = number | string | null;

export type NumberInputProps = DistributiveOmit<
  AstryxNumberInputProps,
  FormControlChromeProps | "value" | "onChange" | "hasClear"
> &
  FormControlProps & {
    /** A number, or a string that reads as one. */
    value?: NumberInputValue;
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: NumberInputValue;
    /** `null` when the field is emptied. */
    onChange?: (value: number | null) => void;
    /**
     * Shows a clear button, and lets an emptied field report `null`.
     * `false` keeps the last number when the text is erased.
     * @default true
     */
    hasClear?: boolean;
  };

function toNumber(value: NumberInputValue | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

export function NumberInput({
  value,
  defaultValue,
  onChange,
  hasClear = true,
  status,
  disabled,
  ...rest
}: NumberInputProps) {
  const { required, field, width } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    sizing: "NumberInput",
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue<NumberInputValue>(
    value,
    defaultValue,
    onChange,
    undefined,
  );
  const numericValue = toNumber(mergedValue);
  // Astryx reverts a decimal typed into an integer field; antd rounds it.
  // The text is still in the input when the blur reaches us.
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const typed = event.target.value.trim() === "" ? NaN : Number(event.target.value);
    if (rest.isIntegerOnly && Number.isFinite(typed) && !Number.isInteger(typed)) {
      let rounded = Math.round(typed);
      if (rest.min != null && rounded < rest.min) rounded = Math.ceil(rest.min);
      if (rest.max != null && rounded > rest.max) rounded = Math.floor(rest.max);
      if (rounded !== numericValue) handleChange(rounded);
    }
    rest.onBlur?.(event);
  };
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    width,
    hasClear,
    value: numericValue,
    onChange: handleChange,
    onBlur: handleBlur,
  } as unknown as AstryxNumberInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxNumberInput {...props} />
    </FormControlScope>
  );
}
