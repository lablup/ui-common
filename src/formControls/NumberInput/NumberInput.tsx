/**
 * `NumberInput` for `Form.Item`: Astryx's NumberInput without the field chrome the item
 * owns (label, description, required marker, status message; see
 * ../formControl.tsx). The item's `<label htmlFor>` names it.
 *
 * Its value model is antd InputNumber's: emptying the field reports `null`
 * (`hasClear` is on unless set to `false`), a numeric string is read as its
 * number, and with `isIntegerOnly` a typed decimal is rounded on blur instead
 * of being dropped.
 *
 * Inside a `Form.Item` it also reports the draft as it is typed, as antd's
 * InputNumber does (#74): Astryx commits the whole text on blur or Enter
 * only, so the item's rules and `Form.useWatch` saw nothing until focus left.
 * A plain number within `min` and `max` (an integer under `isIntegerOnly`) is
 * reported on each input; an emptied field reports `null` under `hasClear`.
 * Any other draft (a sign alone, a locale-formatted paste, an out-of-range
 * number) waits for Astryx's commit, which clamps or reverts it as before.
 * On its own it keeps Astryx's commit-on-blur.
 */
import { use, type FocusEvent, type FormEvent } from "react";
import { useLocale } from "@astryxdesign/core/i18n";
import {
  NumberInput as AstryxNumberInput,
  type NumberInputProps as AstryxNumberInputProps,
} from "@astryxdesign/core/NumberInput";

import { FormItemInputContext } from "../../components/Form/context";
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

/** What a keyboard writes: digits, one decimal point, a sign, an exponent. */
const PLAIN_NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

/** The marks the locale writes numbers with, as Astryx reads them. */
function numberMarks(locale: string): { decimal: string; group: string } {
  let parts: Intl.NumberFormatPart[];
  try {
    parts = new Intl.NumberFormat(locale).formatToParts(1234567.8);
  } catch {
    parts = new Intl.NumberFormat("en").formatToParts(1234567.8);
  }
  return {
    decimal: parts.find((part) => part.type === "decimal")?.value ?? ".",
    group: parts.find((part) => part.type === "group")?.value ?? ",",
  };
}

/**
 * The text as `Number()` reads it: the locale's decimal mark becomes a
 * point. Group marks are dropped when `lenient` (a whole draft read back on
 * blur); otherwise text with any mark but the decimal is `null`, as is a
 * point where the locale's point is a group mark.
 */
function toPlainNumber(text: string, locale: string, lenient: boolean): string | null {
  const { decimal, group } = numberMarks(locale);
  let out = text.trim();
  if (lenient) {
    out = out
      .split(group)
      .join("")
      .replace(/[\s\u00a0\u202f]/g, "");
  } else if (out.includes(group) || (decimal !== "." && out.includes("."))) {
    return null;
  }
  if (decimal !== ".") out = out.split(decimal).join(".");
  return PLAIN_NUMBER.test(out) ? out : null;
}

/**
 * The value a draft reports while it is typed, or `undefined` when it has to
 * wait for Astryx's commit: not a plain number in the locale, not an integer
 * where one is required, or outside `min`..`max` (which the commit clamps).
 */
function draftValue(
  text: string,
  {
    locale,
    min,
    max,
    isIntegerOnly,
    hasClear,
  }: {
    locale: string;
    min?: number | null;
    max?: number | null;
    isIntegerOnly?: boolean;
    hasClear: boolean;
  },
): number | null | undefined {
  if (text.trim() === "") return hasClear ? null : undefined;
  const plain = toPlainNumber(text, locale, false);
  if (plain === null) return undefined;
  const value = Number(plain);
  if (!Number.isFinite(value)) return undefined;
  if (isIntegerOnly && !Number.isInteger(value)) return undefined;
  if (min != null && value < min) return undefined;
  if (max != null && value > max) return undefined;
  return value;
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
  const inItem = use(FormItemInputContext).isFormItemInput === true;
  const locale = useLocale();
  // Astryx keeps the typed text as a draft (shown while focused) and reads
  // `value` only at rest, so reporting the draft early changes nothing on
  // screen; its own commit on blur or Enter then finds the value already set.
  const handleInput = (event: FormEvent<HTMLInputElement>) => {
    if (!inItem) return;
    const next = draftValue(event.currentTarget.value, {
      locale,
      min: rest.min,
      max: rest.max,
      isIntegerOnly: rest.isIntegerOnly,
      hasClear,
    });
    if (next !== undefined && next !== numericValue) handleChange(next);
  };
  // Astryx reverts a decimal typed into an integer field; antd rounds it.
  // The text is still in the input when the blur reaches us, written the
  // way the locale writes a decimal ("2,6" under de-DE).
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const plain = toPlainNumber(event.target.value, locale, true);
    const typed = plain === null ? NaN : Number(plain);
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
    // Reaches the <input> through Astryx's rest props; `onChange` is Astryx's own.
    onInput: handleInput,
    onBlur: handleBlur,
  } as unknown as AstryxNumberInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxNumberInput {...props} />
    </FormControlScope>
  );
}
