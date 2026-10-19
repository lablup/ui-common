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
  noop,
  useFormControl,
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
    onChange?: AstryxFileInputProps["onChange"];
  };

export function FileInput({
  value,
  onChange,
  status,
  disabled,
  ...rest
}: FileInputProps) {
  const { required, field } = useFormControl({
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    namesItself: true,
  });
  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    value: value ?? null,
    onChange: onChange ?? noop,
  } as unknown as AstryxFileInputProps;
  return (
    <FormControlScope required={required}>
      <AstryxFileInput {...props} />
    </FormControlScope>
  );
}
