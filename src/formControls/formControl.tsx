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
import { use, type ReactNode } from "react";

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

/** A required Astryx prop made optional, because `Form.Item` injects it. */
export type Injected<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const noop = () => {};

interface UseFormControlOptions {
  status?: FormControlStatus;
  disabled?: boolean;
  /** `Form.Item` injects `aria-required="true"` from its rules. */
  ariaRequired?: unknown;
  /**
   * The control is not reached by the item's `<label htmlFor>` (a group, a
   * slider, a button named by `aria-label`), so it takes the item's label
   * text as its own, visually hidden. Everything else gets an empty label:
   * the item's label already names it, and a second one would be read twice.
   */
  namesItself?: boolean;
}

/** Astryx's `status` for a border with no message. */
type BorderStatus = { type: "error" | "warning" } | undefined;

export function useFormControl({
  status,
  disabled,
  ariaRequired,
  namesItself = false,
}: UseFormControlOptions) {
  const item = use(FormItemInputContext);
  const itemStatus =
    item.status === "error" || item.status === "warning" ? item.status : "";
  const merged = status ?? itemStatus;
  return {
    required: ariaRequired === true || ariaRequired === "true",
    field: {
      label: namesItself ? (item.label ?? "") : "",
      isLabelHidden: true,
      isDisabled: disabled,
      status: (merged ? { type: merged } : undefined) as BorderStatus,
    },
  };
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
