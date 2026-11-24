/**
 * `PasswordInput`: a password field for `Form.Item` with a show/hide toggle at
 * its trailing edge. It is Astryx's TextInput under the same contract as
 * ui-common's `TextInput` wrapper (../../formControls/formControl.tsx), plus:
 *
 * - The toggle switches `type` between `password` and `text`. Its name comes
 *   from the catalog (`uic.PasswordInput.*`), and pressing it keeps focus,
 *   and the touch keyboard, in the field.
 * - Enter on the toggle (keydown, keypress, keyup) does not reach the
 *   surrounding form.
 * - Spellcheck, autocorrect and autocapitalize are off, so a shown password
 *   never goes to a spellcheck service, and the password is kept out of the
 *   input's `value` attribute.
 * - The password is masked again, with `onRevealedChange(false)`, when the
 *   field is disabled, when its form submits, and when the page comes back
 *   from the back/forward cache. A field disabled when it mounts starts
 *   masked, and an uncontrolled one stays masked once enabled.
 *
 * Astryx's TextInput has no end slot, so the root is the positioning box: it
 * takes the field's width, and the toggle sits inside the control's trailing
 * padding. The control keeps its own border, focus and status styling.
 * Not supported in a `horizontal-labels` FormLayout, whose Field cells
 * (`display: contents`) the root breaks: use it standalone, in a `Form.Item`
 * or in an InputGroup.
 */
import { IconButton } from "@astryxdesign/core/IconButton";
import {
  TextInput as AstryxTextInput,
  type TextInputProps as AstryxTextInputProps,
} from "@astryxdesign/core/TextInput";
import { Eye, EyeOff } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

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
    /**
     * Called with the new state when the toggle is pressed, and with `false`
     * when the field masks the password on its own (disabled, form submit,
     * back/forward-cache restore).
     */
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

  // A field that mounts disabled starts masked, as one disabled later does.
  const [innerRevealed, setInnerRevealed] = useState(defaultIsRevealed && !isDisabled);
  // Re-mask on the render that disables the field (a form disables it while it
  // submits), not in an effect.
  const [wasDisabled, setWasDisabled] = useState(isDisabled);
  if (wasDisabled !== isDisabled) {
    setWasDisabled(isDisabled);
    if (isDisabled) setInnerRevealed(false);
  }
  const controlled = isRevealedProp !== undefined;
  const isRevealed = !isDisabled && (controlled ? isRevealedProp : innerRevealed);

  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef({ isRevealed, controlled, onRevealedChange, mergedValue });
  const lastRevealed = useRef(isRevealed);

  // The caller's ref follows the caller: a new ref gets the input and the
  // old one null.
  const callerRef = rest.ref;
  const setInput = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      const cleanup = typeof callerRef === "function" ? callerRef(node) : undefined;
      if (callerRef && typeof callerRef === "object") callerRef.current = node;
      return () => {
        inputRef.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof callerRef === "function") callerRef(null);
        else if (callerRef) callerRef.current = null;
      };
    },
    [callerRef],
  );

  // React mirrors a controlled input's value into its `value` attribute, on a
  // render and again after a change event, where the password would sit in
  // the DOM; the property alone holds it. Watched once per input element.
  const watched = useRef<{ node: HTMLInputElement; stop: () => void } | null>(null);
  useLayoutEffect(() => {
    const node = inputRef.current;
    if (watched.current?.node === node) return;
    watched.current?.stop();
    watched.current = null;
    if (!node) return;
    node.removeAttribute("value");
    const observer = new MutationObserver(() => {
      if (node.hasAttribute("value")) node.removeAttribute("value");
    });
    observer.observe(node, { attributes: true, attributeFilter: ["value"] });
    watched.current = { node, stop: () => observer.disconnect() };
  });
  useEffect(
    () => () => {
      watched.current?.stop();
      watched.current = null;
    },
    [],
  );

  // Tell the caller about the re-mask the disabling render made, so a
  // controlled caller drops its `true`. Runs before `lastRevealed` moves on.
  useEffect(() => {
    if (isDisabled && lastRevealed.current) latest.current.onRevealedChange?.(false);
  }, [isDisabled]);
  useEffect(() => {
    lastRevealed.current = isRevealed;
    latest.current = { isRevealed, controlled, onRevealedChange, mergedValue };
  });

  // Mask on the form's submit and on a back/forward-cache restore; keep the
  // value through a native reset.
  useEffect(() => {
    const mask = () => {
      const current = latest.current;
      if (!current.isRevealed) return;
      if (!current.controlled) setInnerRevealed(false);
      current.onRevealedChange?.(false);
    };
    const onSubmit = (event: Event) => {
      const form = inputRef.current?.form;
      if (form && event.target === form) mask();
    };
    // With no `value` attribute a native reset would blank the field without
    // a change event; the field is controlled, so it keeps its value, as a
    // React-controlled input does.
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onReset = (event: Event) => {
      const input = inputRef.current;
      if (!input?.form || event.target !== input.form) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        const current = String(latest.current.mergedValue ?? "");
        if (input.value !== current) input.value = current;
      }, 0);
      timers.add(timer);
    };
    const onPageShow = (event: Event) => {
      if ((event as PageTransitionEvent).persisted) mask();
    };
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("reset", onReset, true);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("reset", onReset, true);
      timers.forEach(clearTimeout);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const toggle = () => {
    const next = !isRevealed;
    if (!controlled) setInnerRevealed(next);
    onRevealedChange?.(next);
  };
  // Legacy forms submit on keyup or keypress as well as keydown.
  const stopEnter = (event: KeyboardEvent) => {
    if (event.key === "Enter") event.stopPropagation();
  };
  const toggleLabel = isRevealed
    ? (hidePasswordLabel ?? t("uic.PasswordInput.hidePassword"))
    : (showPasswordLabel ?? t("uic.PasswordInput.showPassword"));

  const props = {
    ...rest,
    ...field,
    ref: setInput,
    statusVariant: "detached",
    // The root takes the width, so the toggle sits at the field's end; the
    // field repeats a length and fills the root for a percentage.
    width: typeof width === "string" && width.includes("%") ? "100%" : width,
    value: mergedValue,
    onChange: handleChange,
    type: isRevealed ? "text" : "password",
    hasSpellCheck: false,
    hasAutoCorrect: false,
    autoCapitalize: "none",
    containerClassName,
    controlClassName: ["uic-password-input__control", controlClassName]
      .filter(Boolean)
      .join(" "),
  } as unknown as AstryxTextInputProps;

  return (
    <div
      className="uic-password-input"
      style={width === undefined ? undefined : { width }}
    >
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
        onKeyDown={stopEnter}
        onKeyUp={stopEnter}
        onKeyPress={stopEnter}
        onClick={toggle}
      />
    </div>
  );
}
