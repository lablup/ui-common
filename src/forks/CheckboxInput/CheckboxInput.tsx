// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.0, src/CheckboxInput/CheckboxInput.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * CheckboxInput, ui-common's copy of Astryx's, with one upstream fix applied:
 * a passed `id` lands on the native checkbox, as TextInput's does, instead of
 * being overwritten by `useId()`. Without it a `<label htmlFor>` outside the
 * component, such as `Form.Item`'s, points at nothing.
 *
 * Everything else is upstream's, line for line, with three differences in
 * form only: the style namespaces and the `indicatorScope` marker are
 * Astryx's compiled output (src/forks/compiled.ts); `useResolvedRequired`,
 * which Astryx does not export, is inlined; and `CheckboxListContext`, which
 * Astryx does not export either, is read as absent. Astryx's CheckboxList
 * renders its own CheckboxInput through CheckboxListItem, so the fork never
 * sits under that context.
 *
 * Delete this fork, and its exports.exclude.json entry, once Astryx ships
 * the fix (CONTRIBUTING, "Forks of Astryx components").
 */

import {
  useId,
  useCallback,
  use,
  useOptimistic,
  useRef,
  useTransition,
  type ChangeEvent,
  type FocusEvent,
  type ReactNode,
} from "react";
import * as stylex from "@stylexjs/stylex";
import type { BaseProps } from "@astryxdesign/core/BaseProps";
import type { SizeValue } from "@astryxdesign/core/utils";
import { FieldLabel } from "@astryxdesign/core/Field";
import { FieldStatus } from "@astryxdesign/core/FieldStatus";
import { FormLayoutContext } from "@astryxdesign/core/FormLayout";
import type { IconType } from "@astryxdesign/core/Icon";
import type { InputStatus } from "@astryxdesign/core/Field";
import { Spinner } from "@astryxdesign/core/Spinner";
import { useTooltip } from "@astryxdesign/core/Tooltip";
import { mergeProps, rtlStyles } from "@astryxdesign/core/utils";
import { useIndicatorFocusRing } from "@astryxdesign/core/hooks";
import { usePressFeedback } from "@astryxdesign/core/hooks";
import { useIndicator } from "@astryxdesign/core/Indicator";
import { themeProps } from "@astryxdesign/core/utils";

import { useMergedRefs } from "@astryxdesign/core/hooks";

import { compiledStyles } from "../compiled";
import * as compiled from "./CheckboxInput.styles";

// dist/CheckboxInput/CheckboxInput.js, dist/Indicator/indicator.markers.stylex.js
// and dist/utils/interactionOverlay.stylex.js.
const styles = compiledStyles(compiled.styles);
const wrapperSizeStyles = compiledStyles(compiled.wrapperSizeStyles);
const dynamicWidthStyles = compiled.dynamicWidthStyles as unknown as {
  width: (width: SizeValue | null) => stylex.StyleXStyles;
};
const indicatorScope = compiled.indicatorScope as unknown as stylex.StyleXStyles;
const interactionOverlayStyles = compiledStyles(compiled.interactionOverlayStyles);

// @astryxdesign/core 0.7.0 src/hooks/useResolvedRequired.ts, which core does
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

export type CheckboxInputSize = keyof typeof compiled.wrapperSizeStyles;

export interface CheckboxInputProps extends Omit<BaseProps, "onChange"> {
  /** Ref forwarded to the underlying `<input>` element */
  ref?: React.Ref<HTMLInputElement>;
  /**
   * Label text for the checkbox (always rendered for accessibility).
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
   * Callback fired when the checkbox state changes.
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
   * Whether the checkbox is in a loading state.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Whether the checkbox is checked, unchecked, or indeterminate.
   */
  value: boolean | "indeterminate";
  /**
   * Whether the checkbox is disabled.
   * @default false
   */
  isDisabled?: boolean;

  /**
   * The HTML name attribute for the underlying checkbox input.
   * Useful for form submissions.
   */
  htmlName?: string;
  /**
   * Explains why the checkbox is disabled. When set together with
   * `isDisabled`, the checkbox shows a tooltip with this text on hover and
   * keyboard focus, and the control stays focusable (via `aria-disabled`) so
   * the reason is discoverable by keyboard and assistive technology.
   * Activation stays blocked.
   *
   * Use this instead of wrapping a disabled checkbox in `Tooltip` — disabled
   * controls don't emit the pointer events an external tooltip needs.
   *
   * @example
   * ```
   * <CheckboxInput
   *   label="Accept terms"
   *   value={accepted}
   *   isDisabled
   *   disabledMessage="Terms are managed by your administrator"
   * />
   * ```
   */
  disabledMessage?: string;
  /**
   * Whether the checkbox is read-only.
   * Displays the current state at full opacity but prevents interaction.
   * Unlike `isDisabled`, read-only checkboxes are not visually dimmed.
   * @default false
   */
  isReadOnly?: boolean;
  /**
   * Whether the field is optional. Mutually exclusive with isRequired.
   * @default false
   */
  isOptional?: boolean;
  /**
   * Whether the checkbox is required. Mutually exclusive with isOptional.
   * @default false
   */
  isRequired?: boolean;
  /**
   * Width of the field. Numbers are treated as pixels, strings are used as-is
   * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
   * stay aligned, unlike setting width via `xstyle`/`className`/`style`.
   */
  width?: SizeValue;
  /**
   * The size of the checkbox.
   * - 'sm': Compact size (28px row height)
   * - 'md': Default size (36px row height)
   * @default 'md'
   */
  size?: CheckboxInputSize;
  /**
   * Callback fired when the checkbox receives focus.
   */
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  /**
   * Callback fired when the checkbox loses focus.
   */
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  /**
   * Icon to display before the label text.
   */
  labelIcon?: ReactNode | IconType;
  /**
   * Status indicator for the checkbox.
   * When set with a message, displays a colored message box below the checkbox.
   */
  status?: InputStatus;
}

/**
 * A checkbox input component for toggling boolean values.
 *
 * @example
 * ```
 * <CheckboxInput
 *   label="Accept terms"
 *   value={accepted}
 *   onChange={setAccepted}
 * />
 * <CheckboxInput
 *   label="Subscribe"
 *   description="Receive weekly updates"
 *   value={subscribed}
 *   onChange={setSubscribed}
 * />
 * ```
 */
export function CheckboxInput({
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
  isReadOnly = false,
  isOptional = false,
  isRequired = false,
  size = "md",
  onFocus,
  onBlur,
  labelIcon,
  status,
  width,
  xstyle,
  className,
  style,
  ref,
  "aria-describedby": ariaDescribedByProp,
  id: idProp,
  ...rest
}: CheckboxInputProps) {
  // The row is the pressable: the overlay's pressed arm reads the row's
  // scope marker, the way the indicator's hover tint does.
  const pressable = usePressFeedback();
  // ui-common fix: honour a passed `id`, as TextInput does.
  const generatedID = useId();
  const id = idProp ?? generatedID;
  const descriptionID = useId();
  const statusMessageID = useId();
  // Announce the effective required state (form default included) while the
  // native `required` stays bound to the explicit `isRequired` so a layout
  // default never switches on browser validation.
  const isEffectivelyRequired = useResolvedRequired({ isRequired, isOptional });

  const [, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const isBusy = isLoading || optimisticValue !== value;

  // Disabled-reason tooltip. Disabled controls swallow pointer events, so the
  // tooltip listeners attach to the checkbox row (which already exists) and the
  // native checkbox stays perceivable via aria-disabled instead of the disabled
  // attribute. Value mutation is blocked by the isDisabled guard in onChange.
  const showsDisabledMessage = isDisabled && !!disabledMessage;
  // Keep the native checkbox focusable via aria-disabled either when it renders
  // its own reason tooltip, or when it sits in a CheckboxList whose whole-group
  // `disabledMessage` (shown on the group container) needs each checkbox to
  // stay keyboard-perceivable. The group signals this through context rather
  // than a public prop.
  // CheckboxListContext is not exported by Astryx; see the header.
  const checkboxListContext = null as { hasDisabledMessage?: boolean } | null;
  const isFocusableDisabled =
    isDisabled &&
    (showsDisabledMessage || (checkboxListContext?.hasDisabledMessage ?? false));
  const disabledMessageTooltip = useTooltip({
    placement: "above",
    // The container row is not naturally focusable; focusin bubbles up from the
    // native checkbox, so always attach focus listeners.
    focusTrigger: "always",
    isEnabled: showsDisabledMessage,
  });

  // The checkbox visual is an indicator: a theme can restyle it through the
  // canonical `checkbox-indicator` target or replace the component outright.
  const CheckboxControl = useIndicator("checkbox");
  // The ring is drawn on the indicator itself: the native input is
  // `opacity: 0`, and only the indicator's own element can shape the outline
  // to match it. See useIndicatorFocusRing.
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const { focusProps } = useIndicatorFocusRing(indicatorRef, isDisabled);

  const isIndeterminate = optimisticValue === "indeterminate";
  const isChecked = optimisticValue === true;

  // Sync the native indeterminate DOM property (can't be set via JSX
  // attribute). On a native checkbox this is the authoritative way to expose
  // the mixed state — a separate aria-checked="mixed" would be redundant and
  // can desync from / override the native state (forms-16), so it is omitted.
  const indeterminateRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) {
        el.indeterminate = isIndeterminate;
      }
    },
    [isIndeterminate],
  );

  // Build aria-describedby from description and status message
  // Only include descriptionID when the element actually renders.
  // FieldLabel renders the description (with descriptionID) even when the
  // label is visually hidden — it's sr-only, so keep it linked.
  // A consumer's own `aria-describedby` (CheckboxListItem points the control
  // at its visible row description) comes first, then the input's own ids —
  // the explicit attribute below would otherwise replace it via `...rest`.
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

  return (
    <div
      {...mergeProps(
        themeProps("checkbox-input", { size }),
        stylex.props(width != null && dynamicWidthStyles.width(width), xstyle),
        className,
        style,
      )}
    >
      <div
        ref={(el) => {
          // Interaction (hover/focus) listeners for the disabled-message
          // tooltip attach to the whole row for a larger trigger target;
          // positioning anchors on the checkbox itself (below) so the tooltip
          // appears next to the control, not the far edge of the row.
          // Handlers are gated internally by isEnabled, so attaching
          // unconditionally is safe.
          disabledMessageTooltip.interactionRef(el);
        }}
        {...(isDisabled ? undefined : pressable)}
        {...stylex.props(
          styles.container,
          isLabelHidden && styles.containerLabelHidden,
          // Hover and focus reach the checkbox visual through this ancestor
          // marker rather than props, so the whole row drives it.
          !isDisabled && indicatorScope,
          // The touch press's strength and release live on the row the
          // controller writes to; the layer over the checkbox box inherits
          // and paints it.
          !isDisabled && interactionOverlayStyles.pressedAlpha,
        )}
      >
        <div
          {...stylex.props(
            styles.checkboxWrapper,
            wrapperSizeStyles[size],
            !isDisabled && styles.indicatorPressOverlay,
          )}
          {...focusProps}
        >
          <input
            {...rest}
            ref={useMergedRefs(
              ref,
              indeterminateRef,
              disabledMessageTooltip.positionRef,
            )}
            id={id}
            type="checkbox"
            // Withhold the name while disabled: with a disabledMessage the
            // input stays focusable (not natively disabled), and a disabled
            // control must not submit.
            name={isDisabled ? undefined : htmlName}
            checked={isChecked}
            // With a disabledMessage the checkbox keeps focusability via
            // aria-disabled so the reason is focus-discoverable; toggling is
            // still blocked by the isDisabled guard in onChange below.
            disabled={isDisabled && !isFocusableDisabled}
            aria-disabled={isFocusableDisabled ? "true" : undefined}
            form={isFocusableDisabled ? "" : undefined}
            readOnly={isReadOnly}
            required={isRequired}
            aria-required={isEffectivelyRequired ? "true" : undefined}
            onChange={(e) => {
              if (isDisabled || isBusy || isReadOnly) {
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
            aria-readonly={isReadOnly || undefined}
            aria-describedby={ariaDescribedBy}
            aria-invalid={status?.type === "error" ? true : undefined}
            aria-busy={isBusy || undefined}
            {...stylex.props(
              styles.input,
              rtlStyles.centerInline("-50%"),
              styles.inputCoarse,
              wrapperSizeStyles[size],
              isDisabled && styles.inputDisabled,
            )}
          />
          {/*
           * A container holding ONLY the indicator, so the focus ring has an
           * unambiguous target whatever a theme renders. `display: contents`
           * keeps it out of layout entirely.
           */}
          {/* Astryx's compiler folded `stylex.props(styles.indicatorSlot)` into this class. */}
          <span ref={indicatorRef} className="xjp7ctv">
            <CheckboxControl
              state={
                isIndeterminate ? "indeterminate" : isChecked ? "checked" : "unchecked"
              }
              size={size}
              isDisabled={isDisabled}
            >
              {isBusy ? <Spinner size="sm" shade="inherit" /> : null}
            </CheckboxControl>
          </span>
        </div>
        {/* Astryx's compiler folded `stylex.props(styles.labelWrapper)` into this class. */}
        <div className="x78zum5 xdt5ytf">
          <FieldLabel
            // A checkbox's label shares a row with its control, unlike a form
            // field's label above its input. Naming the label rather than the
            // arrangement means a theme asks for the thing it wants, and the
            // component that actually knows what this is says so.
            {...themeProps("checkbox-label")}
            label={label}
            inputID={id}
            isLabelHidden={isLabelHidden}
            isDisabled={isDisabled}
            isOptional={isOptional}
            isRequired={isRequired}
            labelIcon={labelIcon}
            description={description}
            descriptionID={descriptionID}
          />
        </div>
      </div>
      {status?.message && (
        <FieldStatus
          type={status.type}
          message={status.message}
          id={statusMessageID}
          variant="detached"
        />
      )}
      {showsDisabledMessage && disabledMessageTooltip.renderTooltip(disabledMessage)}
    </div>
  );
}

CheckboxInput.displayName = "CheckboxInput";
