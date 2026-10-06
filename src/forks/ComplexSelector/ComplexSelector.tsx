// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.6.5, src/ComplexSelector/ComplexSelector.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * ComplexSelector, ui-common's copy of Astryx's, with one upstream fix
 * applied: `hasClear` / `onClear`, a clear button between the loading spinner
 * and the chevron, as `Selector`'s `hasClear` has (facebook/astryx#6362, open).
 *
 * Everything else is upstream's, line for line. Two things differ in form
 * only: the style namespaces are Astryx's compiled output (src/forks/compiled.ts),
 * and the two internals Astryx does not export are inlined —
 * `useResolvedRequired` (read through the public `FormLayoutContext`) and
 * `interactionOverlayStyles` (compiled, like the rest).
 *
 * Delete this fork, and its exports.exclude.json entry, once Astryx ships
 * the fix (CONTRIBUTING, "Forks of Astryx components").
 */

import React, {
  use,
  useCallback,
  useId,
  useImperativeHandle,
  useOptimistic,
  useRef,
  useTransition,
  type ReactNode,
} from "react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { BaseProps } from "@astryxdesign/core/BaseProps";
import {
  Field,
  InputClearButton,
  inputWrapperStyles,
  type FieldStatusVariant,
} from "@astryxdesign/core/Field";
import { FormLayoutContext } from "@astryxdesign/core/FormLayout";
import { Icon, renderIconSlot, type IconType } from "@astryxdesign/core/Icon";
import { Spinner } from "@astryxdesign/core/Spinner";
import { useTranslator } from "@astryxdesign/core/i18n";
import {
  layerAnimations,
  type LayerAlignment,
  type LayerPlacement,
} from "@astryxdesign/core/Layer";
import { usePopover } from "@astryxdesign/core/Popover";
import { spacingVars } from "@astryxdesign/core/theme/tokens.stylex";
import {
  composeEventHandlers,
  focusOutlineStyles,
  isRenderable,
  mergeProps,
  themeProps,
  type SizeValue,
} from "@astryxdesign/core/utils";

import { compiledStyles } from "../compiled";
import * as compiled from "./ComplexSelector.styles";

// dist/ComplexSelector/ComplexSelector.js `styles`, and
// dist/utils/interactionOverlay.stylex.js, which core does not export.
const styles = compiledStyles(compiled.styles);
const interactionOverlayStyles = compiledStyles(compiled.interactionOverlayStyles);

// @astryxdesign/core 0.6.5 src/hooks/useResolvedRequired.ts, which core does
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

export type ComplexSelectorVariant = "input" | "ghost";

export type ComplexSelectorSize = "sm" | "md" | "lg";

export interface ComplexSelectorRenderState {
  /** Whether the selector surface is open. */
  isOpen: boolean;
  /** Whether changeAction/isLoading is pending. */
  isBusy: boolean;
  /** ID of the trigger button. */
  triggerId: string;
  /** ID of the popup content container. */
  contentId: string;
}

/**
 * Imperative control surface for ComplexSelector, accessed via the `handleRef`
 * prop. Methods drive the same popover machinery as the built-in trigger, so
 * they respect focus restoration, light dismiss, and Escape. Prefer these
 * callbacks over mirroring open state in the parent — the selector owns its
 * visibility, and imperative calls avoid the focus-management pitfalls of
 * syncing an external `isOpen` prop. Pair with `onOpenChange` to observe every
 * open and close, including the ones the selector performs itself.
 */
export interface ComplexSelectorHandle {
  /** Open the selector surface. No-op when disabled or already open. */
  open(): void;
  /** Close the selector surface. Restores focus to the trigger. */
  close(): void;
  /** Toggle the selector surface open or closed. */
  toggle(): void;
  /** Whether the selector surface is currently open. Reads live state. */
  isOpen(): boolean;
}

export interface ComplexSelectorStatus {
  type: "warning" | "error" | "success";
  message?: string;
}

export interface ComplexSelectorProps<Value> extends Omit<
  BaseProps<HTMLDivElement>,
  "children" | "onChange"
> {
  /** Label text for accessibility and the field label. */
  label: string;
  /** Current controlled value. */
  value: Value;
  /** Called when custom content commits a new value. */
  onChange?: (value: Value) => void;
  /** Optional async action after onChange; drives optimistic UI. */
  changeAction?: (value: Value) => void | Promise<void>;
  /** Custom selector surface content rendered inside a dialog popover. */
  children: (
    value: Value,
    onChange: (value: Value) => void,
    close: () => void,
    state: ComplexSelectorRenderState,
  ) => ReactNode;
  /** Label/content shown in the closed trigger. */
  triggerLabel?: ReactNode;
  /** Placeholder shown when triggerLabel is omitted. */
  placeholder?: ReactNode;
  /** Whether to visually hide the field label. */
  isLabelHidden?: boolean;
  /** Helper text displayed below the label. */
  description?: string;
  /** Marks the field optional. */
  isOptional?: boolean;
  /** Marks the field required. */
  isRequired?: boolean;
  /** Disables the selector. */
  isDisabled?: boolean;
  /** Shows loading state on the trigger. */
  isLoading?: boolean;
  /**
   * Shows a clear button between the loading spinner and the chevron while
   * `triggerLabel` is set, as `Selector`'s `hasClear` does. Activating it
   * calls `onClear`, or `onChange(undefined)` when `onClear` is not given.
   */
  hasClear?: boolean;
  /** Called when the clear button is activated. */
  onClear?: () => void;
  /** Validation status. */
  status?: ComplexSelectorStatus;
  /** Status placement. */
  statusVariant?: FieldStatusVariant;
  /** Tooltip text displayed next to the label. */
  labelTooltip?: string;
  /** Trigger and field size. */
  size?: ComplexSelectorSize;
  /** Visual trigger style. Ghost matches toolbar buttons. */
  variant?: ComplexSelectorVariant;
  /** Icon displayed at the start of the trigger. */
  startIcon?: ReactNode | IconType;
  /** Width of the field. */
  width?: SizeValue;
  /** Popup placement. */
  placement?: LayerPlacement;
  /** Popup alignment along the placement axis. */
  alignment?: LayerAlignment;
  /**
   * Imperative handle for programmatic open/close control. Exposes open,
   * close, toggle, and the isOpen query. Use this instead of mirroring open
   * state in the parent — the selector owns its visibility.
   */
  handleRef?: React.Ref<ComplexSelectorHandle>;
  /**
   * Called whenever the selector surface opens or closes, however it happened
   * — the trigger, the keyboard, a light dismiss, Escape, content that calls
   * `close()`, or the imperative handle. Pair it with `handleRef` to drive the
   * surface from outside without mirroring its state.
   */
  onOpenChange?: (isOpen: boolean) => void;
  /** StyleX styles for the popup content container. */
  contentXstyle?: StyleXStyles;
  /** Test ID for the trigger container. */
  "data-testid"?: string;
}

/**
 * A selector shell for rich, custom selection surfaces.
 *
 * ComplexSelector owns the field, trigger, popover, focus restore, and async
 * change action flow. Consumers provide the dialog content as a render function,
 * using the supplied `value`, `onChange`, and `close` helpers to compose the
 * right accessible structure for the custom selector.
 *
 * @example
 * ```
 * <ComplexSelector
 *   label="Fruit"
 *   value={value}
 *   onChange={setValue}
 *   triggerLabel={`${value.fruit} ${value.ripeness}`}>
 *   {(value, onChange, close) => (
 *     <FruitGrid
 *       value={value}
 *       onChange={nextValue => {
 *         onChange(nextValue);
 *         close();
 *       }}
 *     />
 *   )}
 * </ComplexSelector>
 * ```
 */
export function ComplexSelector<Value>({
  label,
  value,
  onChange,
  changeAction,
  children,
  triggerLabel,
  placeholder: placeholderFromProps,
  isLabelHidden = false,
  description,
  isOptional = false,
  isRequired = false,
  isDisabled = false,
  isLoading = false,
  hasClear = false,
  onClear,
  status,
  statusVariant = "attached",
  labelTooltip,
  size = "md",
  variant = "input",
  startIcon,
  width,
  placement = "below",
  alignment = "start",
  handleRef,
  onOpenChange,
  contentXstyle,
  xstyle,
  className,
  style,
  "data-testid": testId,
  onClick: onClickProp,
  ...props
}: ComplexSelectorProps<Value>) {
  const t = useTranslator();
  const isEffectivelyRequired = useResolvedRequired({ isRequired, isOptional });
  const placeholder = placeholderFromProps ?? t("@astryx.selector.placeholder");
  const effectiveStatusVariant =
    variant === "ghost" && statusVariant === "attached" ? "detached" : statusVariant;

  const triggerId = useId();
  const labelId = useId();
  const contentId = useId();
  const descriptionId = useId();
  const statusMessageId = useId();
  const ariaDescribedBy =
    [description ? descriptionId : null, status?.message ? statusMessageId : null]
      .filter((id): id is string => id != null)
      .join(" ") || undefined;

  const triggerRef = useRef<HTMLButtonElement>(null);

  const [isPending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const isBusy = isLoading || isPending;

  const handlePopoverShow = useCallback(() => {
    onOpenChange?.(true);
  }, [onOpenChange]);

  const handlePopoverHide = useCallback(() => {
    // Focus is restored first so a consumer that moves focus elsewhere from
    // the callback wins, instead of being overwritten a line later.
    triggerRef.current?.focus();
    onOpenChange?.(false);
  }, [onOpenChange]);

  const popover = usePopover({
    dialogLabel: label,
    hasCloseButton: false,
    hasAutoFocus: true,
    surfaceTarget: "complex-selector-popup",
    onShow: handlePopoverShow,
    onHide: handlePopoverHide,
  });

  const isOpen = popover.isOpen;

  const handleTriggerClick = useCallback(() => {
    if (isDisabled) {
      return;
    }
    if (popover.isOpen) {
      popover.hide();
    } else {
      popover.show();
    }
  }, [isDisabled, popover]);

  const close = useCallback(() => {
    popover.hide();
  }, [popover]);

  useImperativeHandle(
    handleRef,
    () => ({
      open: () => {
        if (!isDisabled) {
          popover.show();
        }
      },
      close: () => popover.hide(),
      toggle: () => {
        if (isDisabled) {
          return;
        }
        if (popover.isOpen) {
          popover.hide();
        } else {
          popover.show();
        }
      },
      isOpen: () => popover.isOpen,
    }),
    [isDisabled, popover],
  );

  const commitValue = useCallback(
    (nextValue: Value) => {
      onChange?.(nextValue);
      if (changeAction) {
        startTransition(async () => {
          setOptimisticValue(nextValue);
          await changeAction(nextValue);
        });
      }
    },
    [changeAction, onChange, setOptimisticValue, startTransition],
  );

  const triggerContent = triggerLabel ?? placeholder;

  const startIconSlot = renderIconSlot(startIcon, {
    size: "sm",
    color: "secondary",
  });

  const content = (
    <div id={contentId} {...stylex.props(styles.content, contentXstyle)}>
      {children(optimisticValue, commitValue, close, {
        isOpen,
        isBusy,
        triggerId,
        contentId,
      })}
    </div>
  );

  const selectorContent = (
    <>
      <div
        ref={popover.triggerRef}
        data-testid={testId}
        {...props}
        onClick={composeEventHandlers(onClickProp, handleTriggerClick)}
        {...mergeProps(
          themeProps("complex-selector", {
            variant,
            size,
            status: status?.type ?? null,
          }),
          stylex.props(
            inputWrapperStyles.base,
            styles.triggerContainer,
            styles[size],
            // The ring belongs to the wrapper (the focusable `<button>` sits
            // inside it), but it must still be a KEYBOARD ring: `:focus-within`
            // matched a mouse click on the trigger and drew the outline for
            // pointer users too. `focusWithin` here is `:has(:focus-visible)`.
            focusOutlineStyles.focusWithin,
            variant === "ghost" && styles.triggerGhost,
            variant === "ghost" && interactionOverlayStyles.backgroundImage,
            isDisabled && inputWrapperStyles.disabled,
            variant === "ghost" && isDisabled && styles.triggerGhostDisabled,
            isDisabled && styles.disabled,
            triggerLabel == null && styles.placeholder,
            xstyle,
          ),
          className,
          style,
        )}
      >
        {isRenderable(startIconSlot) && startIconSlot}
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-describedby={ariaDescribedBy}
          aria-labelledby={labelId}
          aria-required={isEffectivelyRequired ? "true" : undefined}
          aria-invalid={status?.type === "error" ? "true" : undefined}
          aria-busy={isBusy || undefined}
          disabled={isDisabled}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && !isOpen && !isDisabled) {
              event.preventDefault();
              popover.show();
            }
          }}
          {...stylex.props(styles.trigger)}
        >
          <span {...stylex.props(styles.triggerText)}>{triggerContent}</span>
        </button>
        {isBusy && <Spinner size="sm" />}
        {/* ui-common: the clear button (facebook/astryx#6362). */}
        {hasClear && triggerLabel != null && !isDisabled && (
          <InputClearButton
            label={t("@astryx.selector.clearLabel", { label })}
            // The container's own click opens the popover; a clear must not.
            onClick={(event) => {
              event.stopPropagation();
              if (onClear) {
                onClear();
              } else {
                // Clearing hands back "no value", which `Value` may not name.
                onChange?.(undefined as Value);
              }
            }}
          />
        )}
        <Icon
          icon="chevronDown"
          size="sm"
          color="secondary"
          // No wrapper: Icon's own span already provides the 16px box (`sm`)
          // and the secondary icon color the wrapper used to set, so the glyph
          // IS the trigger's icon element — one node carrying the box, the
          // color, the rotation, and the theme target.
          xstyle={[
            styles.triggerIcon,
            styles.triggerIconRotation,
            isOpen && styles.triggerIconOpen,
          ]}
          {...themeProps("complex-selector-indicator-icon", {
            state: isOpen ? "expanded" : "collapsed",
          })}
        />
      </div>

      {popover.render(content, {
        placement,
        alignment,
        offset: spacingVars["--spacing-1"],
        xstyle: [styles.popover, layerAnimations[placement]],
      })}
    </>
  );

  return (
    <Field
      label={label}
      isLabelHidden={isLabelHidden}
      description={description}
      inputID={triggerId}
      descriptionID={description ? descriptionId : undefined}
      labelID={labelId}
      isOptional={isOptional}
      isRequired={isRequired}
      isDisabled={isDisabled}
      status={
        status
          ? {
              type: status.type,
              message: status.message,
              messageID: status.message ? statusMessageId : undefined,
            }
          : undefined
      }
      statusVariant={effectiveStatusVariant}
      labelTooltip={labelTooltip}
      width={width}
    >
      {selectorContent}
    </Field>
  );
}

ComplexSelector.displayName = "ComplexSelector";
