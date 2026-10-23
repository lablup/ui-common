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

/**
 * A control's width inside a `Form.Item` when the caller passes none: what its
 * antd 5 counterpart renders there (paths are under antd's `es/`). Outside an
 * item no width is set, so Astryx's own default applies. Astryx's field is
 * block-level, so it fills the item's content box when unset; a control antd
 * leaves at its content width gets `"fit-content"` here, not nothing.
 */
export const IN_ITEM_WIDTH = {
  // select/style/index.js:202 `.ant-select-in-form-item { width: 100% }`
  Selector: "100%",
  // select/style/index.js:202, `mode="multiple"`
  MultiSelector: "100%",
  // select/style/index.js:202, `mode="tags"` (TagsInput renders this wrapper)
  Tokenizer: "100%",
  // AutoComplete renders Select (auto-complete/AutoComplete.js:10): select/style/index.js:202
  Typeahead: "100%",
  // input/style/index.js:49 genBasicInputStyle `width: 100%`
  TextInput: "100%",
  // input/style/index.js:49, TextArea shares Input's style
  TextArea: "100%",
  // input-number/style/token.js:8 `controlWidth: 90`, applied at input-number/style/index.js:64
  NumberInput: 90,
  // date-picker/style/index.js:83 `inline-flex` and no width: content-sized
  DateInput: "fit-content",
  // date-picker/style/index.js:83, TimePicker shares DatePicker's style
  TimeInput: "fit-content",
  // date-picker/style/index.js:83, DatePicker `showTime`
  DateTimeInput: "fit-content",
  // date-picker/style/index.js:83, RangePicker shares DatePicker's style
  DateRangeInput: "fit-content",
  // upload/style/index.js:22 `.ant-upload-select { display: inline-block }`
  FileInput: "fit-content",
  // upload/style/dragger.js:11 `.ant-upload-drag { width: 100% }`
  FileInputDropzone: "100%",
  // switch/style/index.js:231 `display: inline-block`
  Switch: "fit-content",
  // checkbox/style/index.js:25 `.ant-checkbox-wrapper { display: inline-flex }`
  CheckboxInput: "fit-content",
  // checkbox/style/index.js:15 `.ant-checkbox-group { display: inline-flex }`
  CheckboxList: "fit-content",
  // radio/style/index.js:14 `.ant-radio-group { display: inline-block }`
  RadioList: "fit-content",
  // slider/style/index.js:26 a block `div` with no width: fills, as Astryx's field does unset
  Slider: undefined,
  // segmented/style/index.js:32 `inline-block`; Astryx's is `inline-flex` and takes no width
  SegmentedControl: undefined,
} as const satisfies Record<string, number | string | undefined>;

export type ItemSizedControl = keyof typeof IN_ITEM_WIDTH;

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
  /** Which row of `IN_ITEM_WIDTH` sizes the control inside a `Form.Item`. */
  sizing?: ItemSizedControl;
  /** The caller's `width`. Set, it always wins. */
  width?: number | string;
}

/** Astryx's `status` for a border with no message. */
type BorderStatus = { type: "error" | "warning" } | undefined;

export function useFormControl({
  status,
  disabled,
  ariaRequired,
  ariaLabel,
  namesItself = false,
  sizing,
  width,
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
    width: (width ?? (item.inItemRow && sizing ? IN_ITEM_WIDTH[sizing] : undefined)) as
      number | string | undefined,
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
