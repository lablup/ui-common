/**
 * UncontrolledInput
 *
 * A text or number field that reports its value only when the user commits
 * it, by pressing Enter or leaving the field, never on each keystroke. For a
 * value whose change is expensive: persisting a setting, refetching a list.
 *
 * - The draft lives in the component, seeded from `defaultValue`. A new
 *   `defaultValue` discards an uncommitted edit.
 * - `type="number"` renders `NumberInput`; every other type `TextInput`.
 * - Astryx fields need an accessible name. Without `label`, a generic one
 *   from the catalog is used and hidden; pass a real `label` wherever the
 *   field has one.
 *
 * @example
 * <UncontrolledInput label="Page size" type="number" defaultValue="20" onCommit={setPageSize} />
 */
import { useRef, useState, type CSSProperties } from "react";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { TextInput, type TextInputStatus } from "@astryxdesign/core/TextInput";

import { useUicTranslator } from "../../i18n/useUicTranslator";

export interface UncontrolledInputProps {
  /** Initial value. A new value resets the field and drops an uncommitted edit. */
  defaultValue?: string;
  /** Called with the value when the user presses Enter or leaves the field. */
  onCommit?: (value: string) => void;
  /** `number` renders `NumberInput`. @default "text" */
  type?: "text" | "number" | "password" | "email";
  placeholder?: string;
  isDisabled?: boolean;
  /** Validation state, as on `TextInput`. */
  status?: TextInputStatus;
  /**
   * Accessible name. @default the catalog's uic.UncontrolledInput.label
   * ("Select"), hidden
   */
  label?: string;
  /** @default true when `label` is not given, else false */
  isLabelHidden?: boolean;
  className?: string;
  style?: CSSProperties;
  /** `data-testid` and other data attributes go on the field. */
  [dataAttribute: `data-${string}`]: string | undefined;
}

export function UncontrolledInput({
  defaultValue,
  onCommit,
  type,
  placeholder,
  isDisabled,
  status,
  label,
  isLabelHidden,
  className,
  style,
  ...dataAttributes
}: UncontrolledInputProps) {
  const t = useUicTranslator();
  const [draft, setDraft] = useState(defaultValue ?? "");
  // NumberInput calls onChange and then onEnter/onBlur in one handler, before
  // a re-render, so a value it has just changed to is read from here.
  const justChanged = useRef<string | null>(null);
  // Reseed on a new `defaultValue` during render, as React documents for
  // state derived from a prop.
  const [seed, setSeed] = useState(defaultValue);
  if (seed !== defaultValue) {
    setSeed(defaultValue);
    setDraft(defaultValue ?? "");
  }

  const shared = {
    ...dataAttributes,
    label: label ?? t("uic.UncontrolledInput.label"),
    isLabelHidden: isLabelHidden ?? label === undefined,
    placeholder,
    isDisabled,
    status,
    className,
    style,
  };
  const commit = () => {
    const value = justChanged.current ?? draft;
    justChanged.current = null;
    onCommit?.(value);
  };

  if (type === "number") {
    const numeric = draft === "" ? null : Number(draft);
    return (
      <NumberInput
        {...shared}
        value={numeric === null || Number.isNaN(numeric) ? null : numeric}
        onChange={(next) => {
          const text = next === null ? "" : String(next);
          justChanged.current = text;
          setDraft(text);
        }}
        onEnter={commit}
        onBlur={commit}
      />
    );
  }

  return (
    <TextInput
      {...shared}
      type={type === "password" || type === "email" ? type : "text"}
      value={draft}
      onChange={setDraft}
      onEnter={commit}
      onBlur={commit}
    />
  );
}

UncontrolledInput.displayName = "UncontrolledInput";
