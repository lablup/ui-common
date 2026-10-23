// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.3, src/Switch/Switch.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * Switch, ui-common's copy of Astryx's, with one upstream fix applied: a
 * passed `id` lands on the native checkbox, as TextInput's and
 * CheckboxInput's do, instead of being replaced by `useId()` and spread onto
 * the row. Without it a `<label htmlFor>` outside the component, such as
 * `Form.Item`'s, points at nothing. (Its second fix, a passed
 * `aria-describedby` describing the checkbox, is upstream's since 0.7.2.)
 *
 * Everything else is upstream's, line for line. Two things differ in form
 * only: the style namespaces and the scope markers are Astryx's
 * compiled output (src/forks/compiled.ts), and `useResolvedRequired`, which
 * Astryx does not export, is inlined.
 *
 * Delete this fork, and its exports.exclude.json entry, once Astryx ships
 * the fix (CONTRIBUTING, "Forks of Astryx components").
 */

import {
  use,
  useId,
  useOptimistic,
  useTransition,
  useEffect,
  useRef,
  type ChangeEvent,
  type FocusEvent,
  type ReactNode,
} from "react";
import * as stylex from "@stylexjs/stylex";
import { FieldLabel } from "@astryxdesign/core/Field";
import { FieldStatus } from "@astryxdesign/core/FieldStatus";
import { FormLayoutContext } from "@astryxdesign/core/FormLayout";
import type { IconType } from "@astryxdesign/core/Icon";
import type { InputStatus } from "@astryxdesign/core/Field";
import { Spinner } from "@astryxdesign/core/Spinner";
import { useTooltip } from "@astryxdesign/core/Tooltip";
import { mergeProps, rtlStyles } from "@astryxdesign/core/utils";
import type { BaseProps } from "@astryxdesign/core/BaseProps";
import type { SizeValue } from "@astryxdesign/core/utils";
import { themeProps } from "@astryxdesign/core/utils";
import { useAnnounce } from "@astryxdesign/core/hooks";
import { useTranslator } from "@astryxdesign/core/i18n";

import { useMergedRefs } from "@astryxdesign/core/hooks";
import { usePressFeedback } from "@astryxdesign/core/hooks";

import { compiledStyles } from "../compiled";
import * as compiled from "./Switch.styles";

// dist/Switch/Switch.js, dist/Switch/switch.markers.stylex.js and
// dist/utils/interactionOverlay.stylex.js.
const wrapperSizeStyles = compiledStyles(compiled.wrapperSizeStyles);
const inputSizeStyles = compiledStyles(compiled.inputSizeStyles);
const trackSizeStyles = compiledStyles(compiled.trackSizeStyles);
const thumbOffSizeStyles = compiledStyles(compiled.thumbOffSizeStyles);
const thumbOnSizeStyles = compiledStyles(compiled.thumbOnSizeStyles);
const labelWrapperSizeStyles = compiledStyles(compiled.labelWrapperSizeStyles);
const styles = compiledStyles(compiled.styles);
const dynamicWidthStyles = compiled.dynamicWidthStyles as unknown as {
  width: (width: SizeValue | null) => stylex.StyleXStyles;
};
const switchScope = compiled.switchScope as unknown as stylex.StyleXStyles;
const switchFocusScope = compiled.switchFocusScope as unknown as stylex.StyleXStyles;
const interactionOverlayStyles = compiledStyles(compiled.interactionOverlayStyles);

// @astryxdesign/core 0.7.3 src/hooks/useResolvedRequired.ts, which core does
// not export: a field under `FormLayout defaultOptionality="required"` is
// required unless it opts out.
function useResolvedRequired({
  isRequired = false,
  isOptional = false,
}: {
  isRequired?: boolean;
  isOptional?: boolean;
}): boolean {
  const { defaultOptionality } = use(FormLayoutContext);
  return !isOptional && (isRequired || defaultOptionality === "required");
}

export type SwitchLabelPosition = "start" | "end";

export type SwitchLabelSpacing = "hug" | "spread";

export interface SwitchProps extends Omit<BaseProps, "onChange"> {
  /** Ref forwarded to the root element */
  ref?: React.Ref<HTMLInputElement>;
  /**
   * Label text for the switch (always rendered for accessibility).
   */
  label: string;
  /**
   * Whether to visually hide the label (still accessible to screen readers).
   * @default false
   */
  isLabelHidden?: boolean;
  /**
   * Description text displayed below the label.
   */
  description?: string;
  /**
   * Callback fired when the switch state changes.
   */
  onChange?: (checked: boolean, e: ChangeEvent<HTMLInputElement>) => void;
  /**
   * Async action on change. Fires after onChange if not prevented.
   */
  changeAction?: (
    checked: boolean,
    e: ChangeEvent<HTMLInputElement>,
  ) => void | Promise<void>;
  /**
   * Whether the switch is in a loading state.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Whether the switch is on or off.
   */
  value: boolean;
  /**
   * Whether the switch is disabled.
   * @default false
   */
  isDisabled?: boolean;

  /**
   * The HTML name attribute for the underlying checkbox input.
   * Useful for form submissions.
   */
  htmlName?: string;

  /**
   * Explains why the switch is disabled. When set together with `isDisabled`,
   * the switch shows a tooltip with this text on hover and keyboard focus, and
   * the control stays focusable (via `aria-disabled`) so the reason is
   * discoverable by keyboard and assistive technology. Activation stays
   * blocked.
   *
   * Use this instead of wrapping a disabled switch in `Tooltip` — disabled
   * controls don't emit the pointer events an external tooltip needs.
   *
   * @example
   * ```
   * <Switch
   *   label="Enable notifications"
   *   value={enabled}
   *   isDisabled
   *   disabledMessage="Notifications are turned off org-wide"
   * />
   * ```
   */
  disabledMessage?: string;
  /**
   * Whether the field is optional. Mutually exclusive with isRequired.
   * @default false
   */
  isOptional?: boolean;
  /**
   * Whether the switch is required. Mutually exclusive with isOptional.
   * @default false
   */
  isRequired?: boolean;
  /**
   * Callback fired when the switch receives focus.
   */
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  /**
   * Callback fired when the switch loses focus.
   */
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  /**
   * Icon to display before the label text.
   */
  labelIcon?: ReactNode | IconType;
  /**
   * Width of the field. Numbers are treated as pixels, strings are used as-is
   * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
   * stay aligned, unlike setting width via `xstyle`/`className`/`style`.
   */
  width?: SizeValue;
  /**
   * Tooltip text to display in an info icon at the end of the label.
   */
  labelTooltip?: string;
  /**
   * Which side of the switch the label appears on.
   * - 'start': Label appears before the switch
   * - 'end': Label appears after the switch
   * @default 'end'
   */
  labelPosition?: SwitchLabelPosition;
  /**
   * Spacing behavior between label and switch.
   * - 'hug': Label and switch are positioned next to each other
   * - 'spread': Label and switch are pushed to opposite ends
   * @default 'hug'
   */
  labelSpacing?: SwitchLabelSpacing;
  /**
   * Status indicator for the switch.
   * When set with a message, displays a colored message box below the switch.
   */
  status?: InputStatus;
  /**
   * Size variant controlling track and thumb dimensions.
   * - 'sm': 34x20px (matches sm checkbox/radio vertical rhythm)
   * - 'md': 40x24px (default, matches md checkbox/radio vertical rhythm)
   * @default 'md'
   */
  size?: "sm" | "md";
}

/**
 * A toggle switch component for boolean values.
 *
 * @example
 * ```
 * <Switch
 *   label="Enable notifications"
 *   value={enabled}
 *   onChange={setEnabled}
 * />
 * <Switch
 *   label="Dark mode"
 *   description="Switch to a darker color scheme"
 *   value={darkMode}
 *   onChange={setDarkMode}
 * />
 * ```
 */
export function Switch({
  label,
  isLabelHidden = false,
  description,
  onChange,
  changeAction,
  isLoading = false,
  value,
  isDisabled = false,
  htmlName,
  disabledMessage,
  isOptional = false,
  isRequired = false,
  onFocus,
  onBlur,
  labelIcon,
  labelTooltip,
  labelPosition = "end",
  labelSpacing = "hug",
  status,
  size = "md",
  width,
  xstyle,
  className,
  style,
  ref,
  "aria-describedby": ariaDescribedByProp,
  id: idProp,
  "aria-labelledby": ariaLabelledByProp,
  ...rest
}: SwitchProps) {
  const t = useTranslator();
  // ui-common fix: honour a passed `id`, as TextInput does.
  const generatedID = useId();
  const id = idProp ?? generatedID;
  // The row is the pressable: the input, the track and the label all sit
  // inside it, and the pressed arms above read the row's scope marker.
  const pressable = usePressFeedback();
  const descriptionID = useId();
  const statusMessageID = useId();
  // Announce the effective required state (form default included) while the
  // native `required` stays bound to the explicit `isRequired` so a layout
  // default never switches on browser validation.
  const isEffectivelyRequired = useResolvedRequired({ isRequired, isOptional });

  const [, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const isBusy = isLoading || optimisticValue !== value;

  const announce = useAnnounce();
  // One announcement per busy start (spec:AST-086 FR6). The ref outlives
  // StrictMode's effect replay and rerenders, so only a new busy start (busy
  // again after settling) speaks again.
  const announcedBusyRef = useRef(false);
  useEffect(() => {
    if (!isBusy) {
      announcedBusyRef.current = false;
      return;
    }
    if (announcedBusyRef.current) {
      return;
    }
    announcedBusyRef.current = true;
    announce(t("@astryx.switch.loading"));
  }, [announce, isBusy, t]);

  const isOn = optimisticValue === true;

  // Disabled-reason tooltip. Disabled controls swallow pointer events, so the
  // tooltip listeners attach to the switch row (which already exists) and the
  // native checkbox stays perceivable via aria-disabled instead of the disabled
  // attribute. Toggling is blocked by the isDisabled guard in onChange.
  const showsDisabledMessage = isDisabled && !!disabledMessage;
  const disabledMessageTooltip = useTooltip({
    placement: "above",
    // The container row is not naturally focusable; focusin bubbles up from the
    // native input, so always attach focus listeners.
    focusTrigger: "always",
    isEnabled: showsDisabledMessage,
  });

  // Build aria-describedby from description and status message
  // Only include descriptionID when the element actually renders.
  // FieldLabel renders the description (with descriptionID) even when the
  // label is visually hidden — it's sr-only, so keep it linked.
  // A consumer's own `aria-describedby` describes the control, so it comes
  // first here rather than landing on the field wrapper via `...rest`.
  const describedByParts: string[] = [];
  if (ariaDescribedByProp) {
    describedByParts.push(ariaDescribedByProp);
  }
  if (description) {
    describedByParts.push(descriptionID);
  }
  if (status?.message) {
    describedByParts.push(statusMessageID);
  }
  if (showsDisabledMessage) {
    describedByParts.push(disabledMessageTooltip.describedBy);
  }
  const ariaDescribedBy =
    describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

  const switchElement = (
    <div {...stylex.props(styles.switchWrapper, wrapperSizeStyles[size])}>
      <input
        ref={useMergedRefs(ref, disabledMessageTooltip.positionRef)}
        id={id}
        type="checkbox"
        role="switch"
        // Withhold the name while disabled: the input stays focusable (not
        // natively disabled), and a disabled control must not submit.
        name={isDisabled ? undefined : htmlName}
        checked={isOn}
        // Focusable but detached from the form while disabled (spec:AST-085).
        aria-disabled={isDisabled ? "true" : undefined}
        form={isDisabled ? "" : undefined}
        required={isRequired}
        aria-required={isEffectivelyRequired ? "true" : undefined}
        onChange={(e) => {
          if (isDisabled || isBusy) {
            return;
          }
          const checked = e.target.checked;
          onChange?.(checked, e);
          if (changeAction && !e.defaultPrevented) {
            startTransition(async () => {
              setOptimisticValue(checked);
              await changeAction(checked, e);
            });
          }
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        // A caller's `aria-labelledby` names the control (a visible title
        // elsewhere in the row, for example), so it reaches the input rather
        // than the field wrapper via `...rest`.
        aria-labelledby={ariaLabelledByProp}
        aria-describedby={ariaDescribedBy}
        aria-invalid={status?.type === "error" ? true : undefined}
        aria-busy={isBusy || undefined}
        {...stylex.props(
          styles.input,
          rtlStyles.centerInline("-50%"),
          styles.inputCoarse,
          inputSizeStyles[size],
          isDisabled && styles.inputDisabled,
          isBusy && styles.inputBusy,
        )}
      />
      <div
        aria-hidden="true"
        {...mergeProps(
          themeProps("switch", {
            checked: isOn ? "checked" : null,
            disabled: isDisabled ? "disabled" : null,
            size,
          }),
          stylex.props(
            styles.track,
            trackSizeStyles[size],
            isOn ? styles.trackOn : styles.trackOff,
            styles.trackFocus,
            isDisabled && styles.trackDisabled,
            isDisabled && !isOn && styles.trackDisabledOff,
          ),
        )}
      >
        <div
          {...mergeProps(
            themeProps("switch-thumb", {
              checked: isOn ? "checked" : null,
              size,
            }),
            stylex.props(
              styles.thumb,
              isOn ? thumbOnSizeStyles[size] : thumbOffSizeStyles[size],
              isOn ? styles.thumbOn : styles.thumbOff,
            ),
          )}
        >
          {isBusy && <Spinner size="sm" />}
        </div>
      </div>
    </div>
  );

  const labelElement = (
    <div {...stylex.props(styles.labelWrapper, labelWrapperSizeStyles[size])}>
      <FieldLabel
        // See CheckboxInput: the control names its own label target rather
        // than the label guessing at its placement.
        {...themeProps("switch-label")}
        label={label}
        inputID={id}
        isLabelHidden={isLabelHidden}
        isDisabled={isDisabled}
        isOptional={isOptional}
        isRequired={isRequired}
        labelIcon={labelIcon}
        labelTooltip={labelTooltip}
        description={description}
        descriptionID={descriptionID}
      />
    </div>
  );

  return (
    <div
      {...mergeProps(
        themeProps("switch-field", {
          labelPosition: labelPosition !== "end" ? labelPosition : undefined,
          labelSpacing: labelSpacing !== "hug" ? labelSpacing : undefined,
        }),
        stylex.props(width != null && dynamicWidthStyles.width(width), xstyle),
        className,
        style,
      )}
      {...rest}
      // Native `disabled` suppressed clicks on the switch (spec:AST-085 FR2).
      onClick={isDisabled ? undefined : rest.onClick}
    >
      <div
        ref={(el) => {
          // Interaction (hover/focus) listeners for the disabled-message
          // tooltip attach to the whole row for a larger trigger target;
          // positioning anchors on the switch itself (above) so the tooltip
          // appears next to the control, not the far edge of the row.
          // Handlers are gated internally by isEnabled, so attaching
          // unconditionally is safe.
          disabledMessageTooltip.interactionRef(el);
        }}
        {...(isDisabled ? undefined : pressable)}
        {...stylex.props(
          styles.container,
          isLabelHidden && styles.containerLabelHidden,
          labelSpacing === "spread" && styles.containerSpread,
          !isDisabled && switchScope,
          switchFocusScope,
          // The touch press's strength and release live on the row the
          // controller writes to; the track and thumb inherit and paint it.
          !isDisabled && interactionOverlayStyles.pressedAlpha,
        )}
      >
        {" "}
        {labelPosition === "start" ? (
          <>
            {labelElement}
            {switchElement}
          </>
        ) : (
          <>
            {switchElement}
            {labelElement}
          </>
        )}
      </div>
      {status?.message && (
        <FieldStatus
          type={status.type}
          message={status.message}
          id={statusMessageID}
          variant="detached"
          xstyle={styles.statusGap}
        />
      )}
      {showsDisabledMessage && disabledMessageTooltip.renderTooltip(disabledMessage)}
    </div>
  );
}

Switch.displayName = "Switch";
