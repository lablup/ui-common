// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.3, src/SegmentedControl/SegmentedControlItem.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * SegmentedControlItem, upstream's unchanged. It is forked only because it
 * reads the control's context, which Astryx does not export, so the
 * SegmentedControl fork (./SegmentedControl.tsx) needs its own copy of both.
 * The style namespaces are Astryx's compiled output (src/forks/compiled.ts),
 * with the class string its compiler folded in place.
 */

import React, { type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { useSegmentedControlContext } from "./SegmentedControlContext";
import type { SegmentedControlSize } from "./SegmentedControlContext";
import { mergeProps, composeEventHandlers } from "@astryxdesign/core/utils";
import type { BaseProps } from "@astryxdesign/core/BaseProps";
import { themeProps } from "@astryxdesign/core/utils";
import { focusOutlineProps } from "@astryxdesign/core/utils";
import { usePressFeedback } from "@astryxdesign/core/hooks";

import { compiledStyles } from "../compiled";
import * as compiled from "./SegmentedControlItem.styles";

export interface SegmentedControlItemProps extends BaseProps<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
  /**
   * Unique value for this segment. Matched against the parent's value.
   */
  value: string;
  /**
   * Accessible label for this segment (required for accessibility).
   * Used as visible text, or as aria-label when isLabelHidden is true.
   */
  label: string;
  /**
   * Whether the label is visually hidden. When true, only the icon is
   * displayed and the label is used as aria-label for accessibility.
   * @default false
   */
  isLabelHidden?: boolean;
  /**
   * Icon element displayed before the label.
   */
  icon?: ReactNode;
  /**
   * Whether this individual item is disabled.
   * @default false
   */
  isDisabled?: boolean;
}

// dist/SegmentedControl/SegmentedControlItem.js and
// dist/utils/interactionOverlay.stylex.js.
const styles = compiledStyles(compiled.styles);
const sizeStyles = compiledStyles(compiled.sizeStyles);
const iconSizeStyles = compiledStyles(compiled.iconSizeStyles);
const interactionOverlayStyles = compiledStyles(compiled.interactionOverlayStyles);
// Upstream's `styles.labelText`, which its compiler folded into the call site.
const folded = { labelText: { className: "xb3r6kr xlyipyv xeuugli" } };

/**
 * Individual segment item within an SegmentedControl.
 * Renders as a radio button with visual segment styling.
 *
 * @example
 * ```
 * <SegmentedControlItem value="grid" label="Grid" icon={<GridIcon />} />
 * ```
 */
export function SegmentedControlItem({
  ref,
  value,
  label,
  isLabelHidden = false,
  icon,
  isDisabled = false,
  onClick: onClickProp,
  xstyle,
  ...rest
}: SegmentedControlItemProps) {
  const pressable = usePressFeedback();
  const ctx = useSegmentedControlContext();

  const isSelected = ctx.value === value;
  const isItemDisabled = isDisabled || ctx.isDisabled;
  // When the whole group is disabled with a disabledMessage, keep the selected
  // segment focusable so the group's reason tooltip is keyboard-discoverable.
  // Per-item disabling (`isDisabled` on the item) always drops out of the tab
  // order. Activation stays blocked by the isItemDisabled guard in handleClick.
  const keepsSelectedFocusable =
    isSelected && (ctx.hasDisabledMessage ?? false) && !isDisabled;
  const size: SegmentedControlSize = ctx.size;
  const isFill = ctx.layout === "fill";

  // Consumer-first: a consumer onClick can call preventDefault() to opt out of
  // selection; otherwise selection proceeds when enabled and not selected.
  const handleClick = composeEventHandlers(onClickProp, () => {
    if (!isItemDisabled && !isSelected) {
      ctx.onChange(value);
    }
  });

  const iconElement = icon ? (
    <span {...stylex.props(styles.icon, iconSizeStyles[size])}>{icon}</span>
  ) : null;

  return (
    <button
      ref={ref}
      {...rest}
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isItemDisabled || undefined}
      aria-label={isLabelHidden ? label : undefined}
      data-value={value}
      {...(!isSelected && !isItemDisabled ? pressable : undefined)}
      // Disabled items (including when the whole group is disabled) are not tab
      // stops — otherwise the selected segment stays keyboard-focusable but is
      // silently dead (arrows and activation are no-ops) (navigation-13). The
      // exception is a whole-group disabledMessage, where the selected segment
      // stays focusable so the reason tooltip is keyboard-discoverable.
      tabIndex={(isSelected && !isItemDisabled) || keepsSelectedFocusable ? 0 : -1}
      onClick={handleClick}
      {...mergeProps(
        themeProps("segmented-control-item", {
          size,
          selected: isSelected ? "selected" : null,
          disabled: isItemDisabled ? "disabled" : null,
        }),
        focusOutlineProps.focusVisible(
          styles.base,
          sizeStyles[size],
          isFill && styles.fill,
          isLabelHidden && styles.iconOnly,
          isSelected && styles.selected,
          // The shared hover and pressed overlay, on the segments a press can
          // change: the selected segment keeps its raised surface as it is.
          !isSelected && !isItemDisabled && interactionOverlayStyles.backgroundColor,
          isItemDisabled && styles.disabled,
          xstyle,
        ),
      )}
    >
      {iconElement}
      {!isLabelHidden && <span {...folded.labelText}>{label}</span>}
    </button>
  );
}

SegmentedControlItem.displayName = "SegmentedControlItem";
