// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.3, src/SegmentedControl/SegmentedControl.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * SegmentedControl, ui-common's copy of Astryx's, with one upstream fix
 * applied: a passed `aria-describedby` is merged into the radiogroup's own, as
 * CheckboxInput's is, instead of being overwritten by it. Without it
 * `Form.Item`'s message and extra never describe the control.
 *
 * Everything else is upstream's, line for line. Two things differ in form
 * only: the style namespaces are Astryx's compiled output
 * (src/forks/compiled.ts), and the context is the fork's own
 * (./SegmentedControlContext.ts), since Astryx does not export it; which is
 * also why SegmentedControlItem is forked.
 *
 * Delete this fork, and its provenance.json entries, once Astryx ships the fix
 * (CONTRIBUTING, "Forks of Astryx components").
 */

import React, { useMemo, useCallback, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { SegmentedControlContext } from "./SegmentedControlContext";
import { useListFocus } from "@astryxdesign/core/hooks";
import { useKeyboardHint } from "@astryxdesign/core/hooks";
import { useTooltip } from "@astryxdesign/core/Tooltip";
import type {
  SegmentedControlSize,
  SegmentedControlLayout,
} from "./SegmentedControlContext";
import { mergeProps, composeEventHandlers } from "@astryxdesign/core/utils";
import { useSize } from "@astryxdesign/core/SizeContext";
import type { BaseProps } from "@astryxdesign/core/BaseProps";
import { themeProps } from "@astryxdesign/core/utils";

import { useMergedRefs } from "@astryxdesign/core/hooks";

import { compiledStyles } from "../compiled";
import * as compiled from "./SegmentedControl.styles";

export interface SegmentedControlProps extends Omit<
  BaseProps<HTMLDivElement>,
  "onChange"
> {
  ref?: React.Ref<HTMLDivElement>;
  /**
   * The currently selected value (controlled).
   */
  value: string;
  /**
   * Callback fired when a segment is selected.
   */
  onChange: (value: string) => void;
  /**
   * Accessible label for the radio group (used as aria-label, never rendered visually).
   */
  label: string;
  /**
   * Size variant for the control.
   * @default 'md'
   */
  size?: SegmentedControlSize;
  /**
   * Layout mode for segment sizing.
   * - `'hug'` (default): the control and each segment hug their content width,
   *   capped at the container (segment labels truncate when it is too narrow).
   * - `'fill'`: segments stretch equally to fill the container width.
   * @default 'hug'
   */
  layout?: SegmentedControlLayout;
  /**
   * Whether the entire control is disabled.
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Explains why the control is disabled. Applies to the whole-group disabled
   * state (`isDisabled`), not individual segments. When set together with
   * `isDisabled`, the control shows a tooltip with this text on hover and
   * keyboard focus, and stays focusable (via `aria-disabled`) so the reason is
   * discoverable by keyboard and assistive technology. Selection stays blocked.
   *
   * Use this instead of wrapping a disabled control in `Tooltip` — disabled
   * controls don't emit the pointer events an external tooltip needs.
   */
  disabledMessage?: string;
  /**
   * SegmentedControlItem children.
   */
  children: ReactNode;
}

// dist/SegmentedControl/SegmentedControl.js.
const styles = compiledStyles(compiled.styles);
const sizeStyles = compiledStyles(compiled.sizeStyles);

/**
 * Segmented button group for single selection (radio group semantics).
 * Visually resembles a tab bar but controls a value, not a view.
 *
 * @example
 * ```
 * <SegmentedControl value={view} onChange={setView} label="View mode">
 *   <SegmentedControlItem value="grid" label="Grid" />
 *   <SegmentedControlItem value="list" label="List" />
 *   <SegmentedControlItem value="table" label="Table" />
 * </SegmentedControl>
 * ```
 */
export function SegmentedControl({
  ref,
  value,
  onChange,
  label,
  size: sizeProp,
  layout = "hug",
  isDisabled = false,
  disabledMessage,
  children,
  xstyle,
  className,
  style,
  onKeyDown: onKeyDownProp,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  // ui-common: merged below instead of being overwritten.
  "aria-describedby": ariaDescribedByProp,
  ...rest
}: SegmentedControlProps) {
  const size = useSize(sizeProp, "md");

  // Disabled-reason tooltip. Applies to the whole-group disabled state. Disabled
  // controls swallow pointer events, so the tooltip listeners attach to the
  // radiogroup container (and the container keeps pointer events on in this
  // mode) while the radios stay perceivable via aria-disabled. Selection is
  // blocked by the isDisabled guards in the click/focus handlers.
  const showsDisabledMessage = isDisabled && !!disabledMessage;
  const disabledMessageTooltip = useTooltip({
    placement: "above",
    // The radiogroup container is not naturally focusable; focusin bubbles up
    // from the radios, so always attach focus listeners.
    focusTrigger: "always",
    isEnabled: showsDisabledMessage,
  });

  // Roving tabindex + arrow/Home/End navigation is owned by the shared
  // useListFocus primitive: it stamps a single tab stop (tabIndex 0/-1) across
  // the radios, skips disabled ones, wraps at the ends, handles Home/End, and
  // repairs the tab stop on mount and whenever items mount/disable — replacing
  // the component's former inline keyboard handler and tab-stop repair effect.
  const { listRef, handleKeyDown, handleFocus } = useListFocus<HTMLDivElement>({
    itemSelector: '[role="radio"]:not([aria-disabled="true"])',
    hasRovingTabIndex: true,
    wrap: true,
    orientation: "horizontal",
  });

  const hint = useKeyboardHint({
    orientation: "horizontal",
    isEnabled: !isDisabled,
  });

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDownProp?.(e);
      if (e.defaultPrevented) {
        return;
      }
      hint.onKeyDown(e);
      handleKeyDown(e);
    },
    [onKeyDownProp, hint, handleKeyDown],
  );

  // Selection-follows-focus (APG radiogroup): useListFocus only *moves* focus,
  // so whenever it lands focus on a new radio (arrow/Home/End, or a click) we
  // select that radio's value. Reading the focused element's data-value here
  // keeps selection in lockstep with focus without duplicating the navigation
  // logic. Disabled radios are ignored (they should never become the value),
  // and the already-selected value is skipped so an initial Tab-in (or a click
  // on the current segment) is a no-op, matching click behavior.
  const handleContainerFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onFocusProp?.(e);
      if (e.defaultPrevented) {
        return;
      }
      hint.onFocus(e);
      handleFocus(e);
      if (isDisabled) {
        return;
      }
      // Only select when focus moved WITHIN the group (arrow/Home/End — APG
      // selection-follows-focus). When focus is entering from outside, Tab
      // must stay a pure focus move: with an unmatched or disabled-selected
      // value the roving tab stop falls back to the first enabled radio, and
      // selecting it here would rewrite the form value on mere traversal.
      // Clicks are unaffected: the item's own handleClick selects.
      if (!e.currentTarget.contains(e.relatedTarget)) {
        return;
      }
      const focused = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[role="radio"][data-value]',
      );
      if (!focused || focused.getAttribute("aria-disabled") === "true") {
        return;
      }
      const nextValue = focused.dataset.value;
      if (nextValue != null && nextValue !== value) {
        onChange(nextValue);
      }
    },
    [onFocusProp, hint, handleFocus, isDisabled, onChange, value],
  );

  const contextValue = useMemo(
    () => ({
      value,
      onChange,
      size,
      layout,
      isDisabled,
      hasDisabledMessage: showsDisabledMessage,
    }),
    [value, onChange, size, layout, isDisabled, showsDisabledMessage],
  );

  return (
    <SegmentedControlContext value={contextValue}>
      <div
        ref={useMergedRefs(ref, listRef, disabledMessageTooltip.ref)}
        {...rest}
        role="radiogroup"
        aria-label={label}
        aria-disabled={isDisabled || undefined}
        aria-describedby={
          [
            ariaDescribedByProp,
            showsDisabledMessage ? disabledMessageTooltip.describedBy : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onKeyDown={handleContainerKeyDown}
        onFocus={handleContainerFocus}
        onBlur={composeEventHandlers(onBlurProp, hint.onBlur)}
        {...mergeProps(
          themeProps("segmented-control", { size }),
          stylex.props(
            styles.container,
            sizeStyles[size],
            layout === "fill" && styles.fill,
            isDisabled &&
              (showsDisabledMessage ? styles.disabledWithMessage : styles.disabled),
            xstyle,
          ),
          className,
          style,
        )}
      >
        {children}
        {hint.hintElement}
      </div>
      {showsDisabledMessage && disabledMessageTooltip.renderTooltip(disabledMessage)}
    </SegmentedControlContext>
  );
}

SegmentedControl.displayName = "SegmentedControl";
