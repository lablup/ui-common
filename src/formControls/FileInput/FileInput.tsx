/**
 * `FileInput` for `Form.Item`: ui-common's FileInput fork (src/forks/FileInput,
 * which hands the item's `aria-*` and focus handlers to the trigger) without
 * the field chrome the item owns (label, description, required marker, status
 * message; see ../formControl.tsx). It is not reached by the item's `<label htmlFor>`, so it takes the item's label text as its own, visually hidden.
 */
import {
  FileInput as AstryxFileInput,
  type FileInputProps as AstryxFileInputProps,
} from "../../forks/FileInput";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../formControl";

export type FileInputProps = DistributiveOmit<
  AstryxFileInputProps,
  FormControlChromeProps | "value" | "onChange"
> &
  FormControlProps & {
    value?: AstryxFileInputProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxFileInputProps["value"];
    onChange?: AstryxFileInputProps["onChange"];
  };

export function FileInput({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  ...rest
}: FileInputProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    namesItself: true,
  });
  const [mergedValue, handleChange] = useMergedValue(
    value,
    defaultValue,
    onChange,
    null,
  );
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    value: mergedValue,
    onChange: handleChange,
  } as unknown as AstryxFileInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxFileInput {...props} />
    </FormControlScope>
  );
}
