/**
 * `PasswordInput`: a password field for `Form.Item` with a show/hide toggle at
 * its trailing edge. It is Astryx's TextInput under the same contract as
 * ui-common's `TextInput` wrapper (../../formControls/formControl.tsx), plus:
 *
 * - The toggle switches `type` between `password` and `text`. Its name comes
 *   from the catalog (`uic.PasswordInput.*`), and pressing it keeps focus,
 *   and the touch keyboard, in the field.
 * - Enter on the toggle does not reach the surrounding form.
 * - Spellcheck, autocorrect and autocapitalize are off, so a shown password
 *   never goes to a spellcheck service.
 * - A disabled field is masked, and its toggle disabled; an uncontrolled one
 *   stays masked once enabled again.
 */
import { IconButton } from "@astryxdesign/core/IconButton";
import {
  TextInput as AstryxTextInput,
  type TextInputProps as AstryxTextInputProps,
} from "@astryxdesign/core/TextInput";
import { Eye, EyeOff } from "lucide-react";
import { useState, type KeyboardEvent, type MouseEvent } from "react";

import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type DistributiveOmit,
  type FormControlChromeProps,
  type FormControlProps,
} from "../../formControls/formControl";
import { useUicTranslator } from "../../i18n/useUicTranslator";
import "./PasswordInput.css";

export type PasswordInputProps = DistributiveOmit<
  AstryxTextInputProps,
  | FormControlChromeProps
  | "value"
  | "onChange"
  | "type"
  | "hasSpellCheck"
  | "hasAutoCorrect"
  | "autoCapitalize"
> &
  FormControlProps & {
    value?: AstryxTextInputProps["value"];
    /** The starting value when `value` is not set (uncontrolled), as in antd. */
    defaultValue?: AstryxTextInputProps["value"];
    onChange?: AstryxTextInputProps["onChange"];
    /** The native limit on the password's length, as antd's Input takes. */
    maxLength?: number;
    /**
     * Whether the password is shown as plain text. Without it the field keeps
     * its own state. A disabled field is masked whatever this says.
     */
    isRevealed?: boolean;
    /** Whether the password starts shown when `isRevealed` is not set. */
    defaultIsRevealed?: boolean;
    /** Called with the new state when the toggle is pressed. */
    onRevealedChange?: (isRevealed: boolean) => void;
    /** Accessible name of the toggle while the password is masked. */
    showPasswordLabel?: string;
    /** Accessible name of the toggle while the password is shown. */
    hidePasswordLabel?: string;
  };

export function PasswordInput({
  value,
  defaultValue,
  onChange,
  status,
  disabled,
  isRevealed: isRevealedProp,
  defaultIsRevealed = false,
  onRevealedChange,
  showPasswordLabel,
  hidePasswordLabel,
  containerClassName,
  controlClassName,
  ...rest
}: PasswordInputProps) {
  const t = useUicTranslator();
  const { required, field, width } = useFormControl({
    component: "PasswordInput",
    caller: rest,
    status,
    disabled,
    ariaRequired: rest["aria-required"],
    ariaLabel: rest["aria-label"],
    sizing: "TextInput",
    width: rest.width,
  });
  const [mergedValue, handleChange] = useMergedValue(value, defaultValue, onChange, "");
  const isDisabled = field.isDisabled ?? false;

  const [innerRevealed, setInnerRevealed] = useState(defaultIsRevealed);
  // Re-mask on the render that disables the field (a form disables it while it
  // submits), not in an effect.
  const [wasDisabled, setWasDisabled] = useState(isDisabled);
  if (wasDisabled !== isDisabled) {
    setWasDisabled(isDisabled);
    if (isDisabled) setInnerRevealed(false);
  }
  const controlled = isRevealedProp !== undefined;
  const isRevealed = !isDisabled && (controlled ? isRevealedProp : innerRevealed);

  const toggle = () => {
    const next = !isRevealed;
    if (!controlled) setInnerRevealed(next);
    onRevealedChange?.(next);
  };
  const toggleLabel = isRevealed
    ? (hidePasswordLabel ?? t("uic.PasswordInput.hidePassword"))
    : (showPasswordLabel ?? t("uic.PasswordInput.showPassword"));

  const props = {
    ...rest,
    ...field,
    statusVariant: "detached",
    width,
    value: mergedValue,
    onChange: handleChange,
    type: isRevealed ? "text" : "password",
    hasSpellCheck: false,
    hasAutoCorrect: false,
    autoCapitalize: "none",
    containerClassName: [
      "uic-password-input__field",
      width === undefined && "uic-password-input__field--fluid",
      containerClassName,
    ]
      .filter(Boolean)
      .join(" "),
    controlClassName: ["uic-password-input__control", controlClassName]
      .filter(Boolean)
      .join(" "),
  } as unknown as AstryxTextInputProps;

  return (
    <div className="uic-password-input">
      <FormControlScope required={required}>
        <AstryxTextInput {...props} />
      </FormControlScope>
      <IconButton
        className="uic-password-input__toggle"
        variant="ghost"
        size="sm"
        icon={
          isRevealed ? (
            <EyeOff size="1em" aria-hidden />
          ) : (
            <Eye size="1em" aria-hidden />
          )
        }
        label={toggleLabel}
        isDisabled={isDisabled}
        onMouseDown={(event: MouseEvent) => event.preventDefault()}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === "Enter") event.stopPropagation();
        }}
        onClick={toggle}
      />
    </div>
  );
}
