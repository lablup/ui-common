/**
 * `SegmentedControl` for `Form.Item`: ui-common's SegmentedControl fork
 * (src/forks/SegmentedControl, which keeps the item's `aria-describedby`)
 * without the field chrome the item owns (see ../formControl.tsx). antd's
 * `Radio.Group` of `Radio.Button`s. The radiogroup is not reached by the
 * item's `<label htmlFor>`, so it takes the item's label text as its
 * `aria-label`.
 */
import {
  SegmentedControl as ForkSegmentedControl,
  type SegmentedControlProps as ForkSegmentedControlProps,
} from "../../forks/SegmentedControl";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type SegmentedControlProps = Omit<
  ForkSegmentedControlProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: string;
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: string;
    onChange?: ForkSegmentedControlProps["onChange"];
  };

export function SegmentedControl({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: SegmentedControlProps) {
  const { required, field } = useFormControl({
    component: "SegmentedControl",
    caller: rest,
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    namesItself: true,
  });
  const [mergedValue, handleChange] = useMergedValue(value, defaultValue, onChange, "");
  return (
    <FormControlScope required={required}>
      <ForkSegmentedControl
        {...rest}
        label={field.label}
        isDisabled={field.isDisabled}
        // Astryx draws no status on it; an error still marks it invalid.
        aria-invalid={
          rest["aria-invalid"] ?? (field.status?.type === "error" || undefined)
        }
        value={mergedValue ?? ""}
        onChange={handleChange}
      />
    </FormControlScope>
  );
}
