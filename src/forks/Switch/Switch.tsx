// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.7, src/Switch/Switch.tsx
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
 * One part of upstream is left out: 0.7.7's touch presentation
 * (`useSwitchTouch`: the iOS-style lift, drag-to-flip and spring, and the
 * hit-area observers that grow the target toward 44 px under a coarse
 * pointer). It runs on core's private gesture, motion and hit-area modules,
 * which no public subpath exports. Its touch-only CSS is left out with it
 * (`TOUCH_ONLY_ATOMS`, with `touch-action: pan-y` and the press-holds-drag
 * mark), so a coarse pointer gets the mouse presentation, CSS transitions
 * included, plus a 24 px minimum target (`coarseMinTarget`), as in 0.7.3.
 *
 * Delete this fork, and its exports.exclude.json entry, once Astryx ships
 * the fix (CONTRIBUTING, "Forks of Astryx components").
 */

import {
  use,
  Fragment,
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

import { compiledStyles, type CompiledStyle } from "../compiled";
import * as compiled from "./Switch.styles";

/**
 * ui-common: the atoms of upstream's touch presentation, the rules astryx.css
 * holds only under `@media (pointer: coarse)` (and not for reduced motion).
 * They position the thumb by insets for the JS animator, add the press and
 * colour-fade layers it drives, and size the input by the hit-area observers,
 * none of which the fork copies. Without them a coarse pointer gets the mouse
 * presentation: the thumb slides and the track fades on CSS transitions.
 * `Switch.fork.test.tsx` checks the list against astryx.css on every bump.
 */
export const TOUCH_ONLY_ATOMS: ReadonlySet<string> = new Set([
  "x13kxlb5",
  "xhyyqqw",
  "xsprn4g",
  "xskqmzm",
  "x1syr3z6",
  "x1pxz8w1",
  "x6su2wr",
  "x1uj43hb",
  "xgjkl26",
  "x1xdvw9q",
  "xrxqdxo",
  "xsmms64",
  "xouc37c",
  "xowtp19",
  "xpxppvc",
  "x15cra4q",
  "x2huugr",
  "x1ccaw7f",
  "xxhzo2e",
  "xvym4rz",
  "xigdn9b",
  "xgq6fxe",
  "xq2jpp1",
  "x1ep27e9",
  "xqycr0j",
  "x8imsj1",
  "x1s6gw0t",
  "xfmjvo4",
  "x1e8ofxz",
  "x1bjav06",
  "xiz4dsw",
]);

function withoutTouchAtoms<K extends string>(
  namespace: Record<K, CompiledStyle>,
): Record<K, CompiledStyle> {
  const out = {} as Record<K, CompiledStyle>;
  for (const name of Object.keys(namespace) as K[]) {
    const entry: Record<string, string | boolean | null> = {};
    for (const [key, value] of Object.entries(namespace[name])) {
      if (typeof value !== "string") {
        entry[key] = value;
        continue;
      }
      const kept = value.split(" ").filter((atom) => !TOUCH_ONLY_ATOMS.has(atom));
      // null still resets the property, as an empty upstream value would.
      entry[key] = kept.length > 0 ? kept.join(" ") : null;
    }
    out[name] = entry as CompiledStyle;
  }
  return out;
}

/**
 * ui-common: a 24 px minimum target under a coarse pointer (WCAG 2.5.8), as
 * the 0.7.3 fork had, in place of upstream's hit-area observers. Both atoms
 * are core's own (`min-width` / `min-height: 24px` under `(pointer: coarse)`)
 * and already in astryx.css.
 */
export const coarseMinTarget = {
  kjFi6P: "xkagaj0",
  kHzOjL: "x80b3aj",
  $$css: true,
} as const;

// dist/Switch/Switch.js, dist/Switch/switch.markers.stylex.js and
// dist/utils/interactionOverlay.stylex.js, less the touch-only atoms.
const wrapperSizeStyles = compiledStyles(withoutTouchAtoms(compiled.wrapperSizeStyles));
const trackSizeStyles = compiledStyles(withoutTouchAtoms(compiled.trackSizeStyles));
const thumbOffSizeStyles = compiledStyles(
  withoutTouchAtoms(compiled.thumbOffSizeStyles),
);
const thumbOnSizeStyles = compiledStyles(withoutTouchAtoms(compiled.thumbOnSizeStyles));
const labelWrapperSizeStyles = compiledStyles(
  withoutTouchAtoms(compiled.labelWrapperSizeStyles),
);
const styles = compiledStyles(withoutTouchAtoms(compiled.styles));
const coarseMinTargetStyle = coarseMinTarget as unknown as stylex.StyleXStyles;
const dynamicWidthStyles = compiled.dynamicWidthStyles as unknown as {
  width: (width: SizeValue | null) => stylex.StyleXStyles;
};
const switchScope = compiled.switchScope as unknown as stylex.StyleXStyles;
const switchFocusInput = compiled.switchFocusInput as unknown as stylex.StyleXStyles;
const pressOwnerStyles = compiledStyles(withoutTouchAtoms(compiled.pressOwnerStyles));
const interactionOverlayStyles = compiledStyles(compiled.interactionOverlayStyles);

// @astryxdesign/core 0.7.7 src/hooks/useResolvedRequired.ts, which core does
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
   * - 'sm': 32x20px (matches sm checkbox/radio vertical rhythm)
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

  // ui-common: upstream's touch presentation (useSwitchTouch, the hit area
  // observers) is not copied, and neither are its touch-only atoms
  // (TOUCH_ONLY_ATOMS), so its refs are gone too.
  // The track in a state: its theme target and fill. The other state's, for
  // the fade layer's colour (switchFill.ts).
  const trackPropsFor = (on: boolean) =>
    mergeProps(
      themeProps("switch", {
        checked: on ? "checked" : null,
        disabled: isDisabled ? "disabled" : null,
        size,
      }),
      stylex.props(
        styles.track,
        trackSizeStyles[size],
        on ? styles.trackOn : styles.trackOff,
        styles.trackFocus,
        isDisabled && styles.trackDisabled,
        isDisabled && !on && styles.trackDisabledOff,
      ),
    );
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
        // Chromium reports an unchecked native-required checkbox invalid before
        // any interaction; the invalid state follows status instead.
        aria-invalid={status?.type === "error" ? true : isRequired ? false : undefined}
        aria-busy={isBusy || undefined}
        {...stylex.props(
          styles.input,
          rtlStyles.centerInline("-50%"),
          styles.inputCoarse,
          coarseMinTargetStyle,
          isDisabled && styles.inputDisabled,
          isBusy && styles.inputBusy,
          switchFocusInput,
        )}
      />
      <div aria-hidden="true" {...trackPropsFor(isOn)}>
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
      // Native `disabled` suppressed clicks and key events on the switch; the
      // switch is no longer natively disabled, so withhold the caller's
      // handlers while disabled (spec:AST-085 FR2).
      onClick={isDisabled ? undefined : rest.onClick}
      onKeyDown={isDisabled ? undefined : rest.onKeyDown}
      onKeyUp={isDisabled ? undefined : rest.onKeyUp}
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
          // The touch press's strength and release live on the row the
          // controller writes to; the track and thumb inherit and paint it.
          !isDisabled && interactionOverlayStyles.pressedAlpha,
          !isDisabled && pressOwnerStyles.pressedAlphaLayered,
        )}
      >
        {" "}
        {/* Keyed, so a labelPosition change moves the nodes instead of
            rebuilding them: the touch controller stays on the input, track
            and thumb it attached to. */}
        {labelPosition === "start"
          ? [
              <Fragment key="label">{labelElement}</Fragment>,
              <Fragment key="switch">{switchElement}</Fragment>,
            ]
          : [
              <Fragment key="switch">{switchElement}</Fragment>,
              <Fragment key="label">{labelElement}</Fragment>,
            ]}
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
