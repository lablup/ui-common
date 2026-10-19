/**
 * What every form-control wrapper under src/formControls/ shares (#69).
 *
 * ui-common's form controls follow antd's contract: the enclosing `Form.Item`
 * owns the label, the description (`extra`), the tooltip, the required mark
 * and the status message (`help` / `rules`). The control takes none of them.
 * It reads the item's status from `FormItemInputContext` and paints only its
 * border, and it honours what the item injects: `id`, `disabled` and the
 * `aria-*` attributes.
 *
 * Astryx's controls own all of that themselves, so each wrapper maps the
 * item's contract onto Astryx's props with `useFormControl` and renders the
 * Astryx control inside `FormControlScope`.
 */
import { FormLayoutContext } from "@astryxdesign/core/FormLayout";
import { use, useState, type ReactNode } from "react";

import { FormItemInputContext } from "../components/Form/context";

/** antd's `status`: the border only. The message belongs to `Form.Item`. */
export type FormControlStatus = "error" | "warning" | "";

/** The props a wrapper adds in place of Astryx's field chrome. */
export interface FormControlProps {
  /**
   * The border state. Inside a `Form.Item` it follows the item's validation
   * unless set here.
   */
  status?: FormControlStatus;
  /** Set by `<Form disabled>` through `Form.Item`. */
  disabled?: boolean;
}

/**
 * Astryx props a wrapper does not expose: `Form.Item` owns them (`label`,
 * `extra`, `tooltip`, `required` / `rules`, `help`, `disabled`).
 */
export type FormControlChromeProps =
  | "label"
  | "isLabelHidden"
  | "description"
  | "labelTooltip"
  | "labelIcon"
  | "isRequired"
  | "isOptional"
  | "status"
  | "statusVariant"
  | "isDisabled";

/** `Omit` that keeps a union of props a union (Selector, Slider, NumberInput). */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * A wrapper's props over an Astryx props union (Selector's `hasClear`,
 * Slider's single or range value): the chrome dropped and `value` optional
 * beside `defaultValue`, per branch. Each branch keeps its own `value` and
 * `onChange`, so TypeScript still picks the branch that types an inline
 * `onChange={(v) => …}`.
 */
export type FormControlValueProps<P> = P extends { value?: infer V }
  ? Omit<P, FormControlChromeProps | "value"> &
      FormControlProps & {
        value?: V;
        /** The starting value when `value` is not set (uncontrolled), as in antd. */
        defaultValue?: V;
      }
  : never;

/**
 * The empty value of a list control. One array for every render: Astryx
 * memoizes on the value's identity (Tokenizer rebuilds its search source and
 * abandons an in-flight search), and CheckboxList only reports clicks when it
 * has a value at all.
 */
export const EMPTY_ARRAY: never[] = [];

interface UseFormControlOptions {
  status?: FormControlStatus;
  disabled?: boolean;
  /** `Form.Item` injects `aria-required="true"` from its rules. */
  ariaRequired?: unknown;
  /** The caller's `aria-label`: names the control outside a `Form.Item`. */
  ariaLabel?: unknown;
  /**
   * The control is not reached by the item's `<label htmlFor>` (a group, a
   * slider, a button named by `aria-label`), so Astryx's hidden label alone
   * names it. Everything else is also named by the item's `<label htmlFor>`,
   * so it gets the same text as `aria-label`, which takes precedence over
   * both labels and keeps the name from being read twice.
   */
  namesItself?: boolean;
}

/** Astryx's `status` for a border with no message. */
type BorderStatus = { type: "error" | "warning" } | undefined;

export function useFormControl({
  status,
  disabled,
  ariaRequired,
  ariaLabel,
  namesItself = false,
}: UseFormControlOptions) {
  const item = use(FormItemInputContext);
  const itemStatus =
    item.status === "error" || item.status === "warning" ? item.status : "";
  // antd's getMergedStatus: an empty `status` falls back to the item's.
  const merged = status || itemStatus;
  // Astryx builds its parts' names from `label` ("Clear Name", "Name time",
  // "Increment Name"), so it gets the name even where the item's label
  // already names the control.
  const name =
    typeof ariaLabel === "string" && ariaLabel ? ariaLabel : (item.label ?? "");
  return {
    required: ariaRequired === true || ariaRequired === "true",
    field: {
      label: name,
      isLabelHidden: true,
      "aria-label": namesItself || !name ? undefined : name,
      isDisabled: disabled,
      status: (merged ? { type: merged } : undefined) as BorderStatus,
    },
  };
}

/**
 * antd's `useMergedState` for a control's value: controlled while `value` is
 * set, its own state (starting at `defaultValue`) while it is not, and back
 * to empty when a set `value` is cleared, as `form.resetFields()` does.
 * `onChange` is called either way.
 */
export function useMergedValue<V>(
  value: V | undefined,
  defaultValue: V | undefined,
  // Any value-first handler: Astryx's are unions keyed on other props
  // (`hasClear`, a range), which the wrapper hands back unchanged.
  onChange: ((next: never, ...args: never[]) => void) | undefined,
  empty: NoInfer<V> | undefined,
): [V | undefined, (next: V, ...args: unknown[]) => void] {
  const [inner, setInner] = useState(defaultValue);
  const [prevValue, setPrevValue] = useState(value);
  // Object.is: `NaN !== NaN` would set state on every render.
  if (!Object.is(prevValue, value)) {
    setPrevValue(value);
    if (value === undefined) setInner(undefined);
  }
  const controlled = value !== undefined;
  const handleChange = (next: V, ...args: unknown[]) => {
    if (!controlled) setInner(next);
    (onChange as ((...args: unknown[]) => void) | undefined)?.(next, ...args);
  };
  return [(controlled ? value : inner) ?? empty, handleChange];
}

/**
 * Turns `Form.Item`'s required state into Astryx's `aria-required` without
 * Astryx's visible "Required" marker: under `defaultOptionality="required"`
 * Astryx hides the marker and still announces it, and under `"optional"` it
 * does neither. The item draws its own asterisk. Always rendered, so the tree
 * never changes shape and the control never remounts.
 */
export function FormControlScope({
  required,
  children,
}: {
  required: boolean;
  children: ReactNode;
}) {
  const layout = use(FormLayoutContext);
  return (
    <FormLayoutContext
      value={{ ...layout, defaultOptionality: required ? "required" : "optional" }}
    >
      {children}
    </FormLayoutContext>
  );
}
