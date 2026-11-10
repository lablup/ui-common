// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.11, src/FileInput/FileInput.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * FileInput, ui-common's copy of Astryx's, with one upstream fix applied: the
 * ARIA props (`aria-describedby`, `aria-invalid`, `aria-required`, …) and the
 * focus handlers (`onFocus`, `onBlur`) reach the trigger button, the element
 * that takes focus, instead of the hidden file input, which is `aria-hidden`
 * and never focused. Without it `Form.Item`'s message and extra never
 * describe the control, its required state is not announced, and a blur
 * never validates it. `data-*` stays on the native input, as upstream's
 * tests require.
 *
 * Since 0.7.5 Astryx copies a caller's `aria-*` props to the trigger too, but
 * `onFocus` and `onBlur` still land on the hidden input, so the fork keeps
 * routing all of them.
 *
 * Everything else is upstream's, line for line. Two things differ in form
 * only: the style namespaces are Astryx's compiled output
 * (src/forks/compiled.ts), with the class strings its compiler folded in
 * place; `useFieldInputStyling`, `useResolvedRequired` and
 * `useListFormatter`, which Astryx does not export, are inlined;
 * `useBusyAnnouncement` is ../useBusyAnnouncement.ts, reduced to the public
 * `useAnnounce` route; strings come from the public `useTranslator`; and
 * `!`s satisfy ui-common's `noUncheckedIndexedAccess`.
 *
 * Delete this fork, and its provenance.json entry, once Astryx ships the fix
 * (CONTRIBUTING, "Forks of Astryx components").
 */

import {
  use,
  useId,
  useCallback,
  useMemo,
  useRef,
  useState,
  useOptimistic,
  useTransition,
  type DragEvent,
} from "react";
import * as stylex from "@stylexjs/stylex";
import {
  Field,
  InputClearButton,
  type InputStatus,
  type FieldStatusPlacement,
} from "@astryxdesign/core/Field";
import { Icon } from "@astryxdesign/core/Icon";
import { Spinner } from "@astryxdesign/core/Spinner";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
import { useAnnounce } from "@astryxdesign/core/hooks";
import { useInputStatusIcon } from "@astryxdesign/core/hooks";
import { useClickableContainer } from "@astryxdesign/core/hooks";
import { useTooltip } from "@astryxdesign/core/Tooltip";

export type {
  InputStatus as FileInputStatus,
  InputStatusType as FileInputStatusType,
} from "@astryxdesign/core/Field";
import { mergeProps } from "@astryxdesign/core/utils";
import type {
  FieldContainerStyleProps,
  FieldInputBaseProps,
} from "@astryxdesign/core/Field";
import { FormLayoutContext } from "@astryxdesign/core/FormLayout";
import { useInputGroup } from "@astryxdesign/core/InputGroup";
import { useDevWarning } from "@astryxdesign/core/hooks";
import type { SizeValue } from "@astryxdesign/core/utils";
import { themeProps } from "@astryxdesign/core/utils";
import type { TranslatorFn } from "@astryxdesign/core/i18n";

import { useMergedRefs } from "@astryxdesign/core/hooks";
import { InternationalizationContext, useTranslator } from "@astryxdesign/core/i18n";

import { compiledStyles } from "../compiled";
import * as compiled from "./FileInput.styles";
import { useBusyAnnouncement } from "../useBusyAnnouncement";

// @astryxdesign/core 0.7.11 src/i18n/useListFormatter.ts, which core does not
// export: joins items as a narrow conjunction in the active locale.
function useListFormatter(): (items: ReadonlyArray<string>) => string {
  const ctx = use(InternationalizationContext);
  return useMemo(() => {
    const format = new Intl.ListFormat(ctx.locale, {
      type: "conjunction",
      style: "narrow",
    });
    return (items: ReadonlyArray<string>) => format.format(items);
  }, [ctx.locale]);
}

// @astryxdesign/core 0.7.11 src/hooks/useResolvedRequired.ts, which core does
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

function formatFileSize(bytes: number, t: TranslatorFn): string {
  if (bytes < 1024) {
    return t("@astryx.fileInput.fileSize.bytes", { size: bytes });
  }
  if (bytes < 1024 * 1024) {
    return t("@astryx.fileInput.fileSize.kilobytes", { size: bytes / 1024 });
  }
  return t("@astryx.fileInput.fileSize.megabytes", {
    size: bytes / (1024 * 1024),
  });
}

function validateFiles(
  files: File[],
  accept: string | undefined,
  maxSize: number | undefined,
  maxFiles: number | undefined,
  isMultiple: boolean,
  t: TranslatorFn,
): { valid: File[]; errors: string[] } {
  const errors: string[] = [];
  let valid = files;

  if (accept) {
    const acceptedTypes = accept.split(",").map((s) => s.trim().toLowerCase());
    valid = valid.filter((file) => {
      const matches = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type);
        }
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type.toLowerCase() === type;
      });
      if (!matches) {
        errors.push(t("@astryx.fileInput.errorInvalidType", { fileName: file.name }));
      }
      return matches;
    });
  }

  if (maxSize != null) {
    valid = valid.filter((file) => {
      if (file.size > maxSize) {
        errors.push(
          t("@astryx.fileInput.errorMaxSize", {
            fileName: file.name,
            maxSize: formatFileSize(maxSize, t),
          }),
        );
        return false;
      }
      return true;
    });
  }

  if (isMultiple && maxFiles != null && valid.length > maxFiles) {
    errors.push(t("@astryx.fileInput.errorMaxFiles", { maxFiles }));
    valid = valid.slice(0, maxFiles);
  }

  return { valid, errors };
}

// dist/FileInput/FileInput.js. The compiler folded the text and hidden-input
// styles into class strings at their call sites; those are `folded` below.
const styles = compiledStyles(compiled.styles);

const statusBorderStyles = compiledStyles(compiled.statusBorderStyles);

// The class strings dist/FileInput/FileInput.js carries where its compiler
// folded a `stylex.props` call.
const folded = {
  fileNameDropzone: {
    className:
      "x9ynric xjm74w1 xf9zqsd xw6l6zx x1tgivj0 xb3r6kr xlyipyv x98rzlu xeuugli x2b8uid xeaf4i8",
  },
  placeholderDropzone: {
    className: "x9ynric xjm74w1 xf9zqsd xw6l6zx xv1l7n4 x2b8uid x87ps6o",
  },
  fileNameBusy: {
    className:
      "x9ynric xjm74w1 xf9zqsd xw6l6zx x1tgivj0 xb3r6kr xlyipyv xuxw1ft x98rzlu xeuugli",
  },
  fileNameCompact: {
    className:
      "x9ynric xjm74w1 xf9zqsd xw6l6zx x1tgivj0 xb3r6kr xlyipyv xuxw1ft x98rzlu xeuugli x1yc453h",
  },
  placeholderCompact: {
    className:
      "x9ynric xjm74w1 xf9zqsd xw6l6zx xv1l7n4 x87ps6o x1yc453h x98rzlu xeuugli",
  },
  hiddenInput: {
    className:
      "x10l6tqk x1i1rx1s xjm9jq1 x1717udv xkdpibf xb3r6kr xzpqnlu xuxw1ft xc342km",
  },
};

// @astryxdesign/core 0.7.11 src/Field/fieldParts.ts, which core does not
// export: drops root styling a Field-composed input does not accept, and
// styles the Field box only where one renders.
const ROOT_STYLING_MESSAGE =
  "`xstyle`, `className`, and `style` are not supported on Field-composed inputs and were ignored. " +
  "Style the field with `containerXstyle`/`containerClassName`/`containerStyle` and the control box with " +
  "`controlXstyle`/`controlClassName`/`controlStyle`. `astryx upgrade` rewrites existing usage.";

const CONTAINER_WITHOUT_FIELD_MESSAGE =
  "`containerXstyle`/`containerClassName`/`containerStyle` have no effect here because no Field box renders " +
  "(inside InputGroup or a `horizontal-labels` FormLayout). Inside InputGroup, style the InputGroup.";

function useFieldInputStyling<R extends object>(
  component: string,
  restProps: R,
  containerProps: FieldContainerStyleProps,
): {
  rest: R;
  hasFieldBox: boolean;
  container: {
    xstyle?: FieldContainerStyleProps["containerXstyle"];
    className?: string;
    style?: FieldContainerStyleProps["containerStyle"];
  };
} {
  const inputGroup = useInputGroup();
  const { direction } = use(FormLayoutContext);
  const hasFieldBox = inputGroup == null && direction !== "horizontal-labels";

  const untyped = restProps as R & {
    xstyle?: unknown;
    className?: unknown;
    style?: unknown;
  };
  const hasRootStyling =
    untyped.xstyle != null || untyped.className != null || untyped.style != null;
  let rest = restProps;
  if (hasRootStyling) {
    const {
      xstyle: _xstyle,
      className: _className,
      style: _style,
      ...remaining
    } = untyped;
    rest = remaining as R;
  }
  useDevWarning(component, ROOT_STYLING_MESSAGE, hasRootStyling);

  const { containerXstyle, containerClassName, containerStyle } = containerProps;
  const hasContainerStyling =
    containerXstyle != null || containerClassName != null || containerStyle != null;
  useDevWarning(
    component,
    CONTAINER_WITHOUT_FIELD_MESSAGE,
    hasContainerStyling && !hasFieldBox,
  );

  return {
    rest,
    hasFieldBox,
    container: hasFieldBox
      ? {
          xstyle: containerXstyle,
          className: containerClassName,
          style: containerStyle,
        }
      : {},
  };
}

/**
 * ui-common fix: the props that belong to the focusable control. Everything
 * else stays on the hidden file input (`name`, `form`, `data-*`, …).
 */
function splitControlProps<R extends object>(rest: R) {
  const control: Record<string, unknown> = {};
  const input: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith("aria-") || key === "onFocus" || key === "onBlur") {
      control[key] = value;
    } else {
      input[key] = value;
    }
  }
  return { control, input };
}

export interface FileInputProps extends Omit<
  FieldInputBaseProps,
  "onChange" | "defaultValue" | "value"
> {
  /**
   * Ref to the native file input.
   */
  ref?: React.Ref<HTMLInputElement>;
  /**
   * Accessible label for the file input.
   */
  label: string;
  /**
   * Whether to visually hide the label (still accessible to screen readers).
   * @default false
   */
  isLabelHidden?: boolean;
  /**
   * Currently selected file(s). Controlled component.
   */
  value: File | File[] | null;
  /**
   * Callback fired when files are selected or removed.
   */
  onChange: (files: File | File[] | null) => void;
  /**
   * Async change action (React 19 transitions pattern).
   * Use for immediate upload on file selection.
   */
  changeAction?: (files: File | File[] | null) => Promise<void>;
  /**
   * Accepted file types. Uses the HTML accept attribute format.
   * Examples: "image/*", ".pdf,.doc,.docx", "image/png,image/jpeg"
   */
  accept?: string;
  /**
   * Whether multiple files can be selected.
   * When true, `value` and `onChange` use `File[]` instead of `File`.
   * @default false
   */
  isMultiple?: boolean;
  /**
   * Maximum file size in bytes. Files exceeding this are rejected
   * with an error status.
   */
  maxSize?: number;
  /**
   * Maximum number of files (only applies when `isMultiple` is true).
   */
  maxFiles?: number;
  /**
   * Whether the input is disabled.
   * @default false
   */
  isDisabled?: boolean;
  /**
   * Explains why the input is disabled. When set together with `isDisabled`,
   * the file input shows a tooltip with this text on hover and keyboard focus,
   * and its trigger stays focusable (via `aria-disabled`) so the reason is
   * discoverable by keyboard and assistive technology. Opening the file picker
   * stays blocked.
   *
   * Use this instead of wrapping a disabled input in `Tooltip` — disabled
   * controls don't emit the pointer events an external tooltip needs.
   *
   * @example
   * ```
   * <FileInput
   *   label="Resume"
   *   value={file}
   *   isDisabled
   *   disabledMessage="Uploads are locked until your profile is verified"
   * />
   * ```
   */
  disabledMessage?: string;
  /**
   * Whether the input is required.
   * @default false
   */
  isRequired?: boolean;
  /**
   * Whether the input is in a loading state (e.g. uploading).
   * @default false
   */
  isLoading?: boolean;
  /**
   * Validation status for the input.
   */
  status?: InputStatus;
  /**
   * How the status message is placed relative to the input.
   * - 'attached': message overlaps directly below the input (bordered treatment)
   * - 'detached': message floats below as a separate element with spacing
   * - 'tooltip': no message box; the status icon becomes a focusable info-tip button that reveals the message on hover, keyboard focus, or tap
   *
   * Dropzone mode does not support 'attached': its tall surface cannot carry an
   * overlapping message. Use 'detached' or 'tooltip' there. From the next minor
   * release, a dropzone resolves 'attached' to 'detached' and defaults to it.
   * @default 'attached'
   */
  statusVariant?: FieldStatusPlacement;
  /**
   * Description text displayed below the label.
   */
  description?: string;
  /**
   * Placeholder text shown when no file is selected.
   * @default "Choose file" or "Choose files"
   */
  placeholder?: string;
  /**
   * Visual mode for the file input.
   * - 'input': compact inline style, similar to a text input
   * - 'dropzone': larger area with dashed border and drag-and-drop support
   * @default 'input'
   */
  mode?: "dropzone" | "input";
  /**
   * Whether the field is optional. Mutually exclusive with isRequired.
   * @default false
   */
  isOptional?: boolean;
  /**
   * Width of the field. Numbers are treated as pixels, strings are used as-is
   * (e.g. `'100%'`). Sizes the whole field (label, control, and status) so they
   * stay aligned, unlike setting width via `controlXstyle`/`controlClassName`/`controlStyle`.
   */
  width?: SizeValue;
  /**
   * Tooltip text to display in an info icon at the end of the label.
   */
  labelTooltip?: string;
}

/**
 * A file input component with optional drag-and-drop support.
 *
 * @example
 * ```
 * <FileInput label="Resume" value={file} onChange={setFile} accept=".pdf" />
 * ```
 */
export function FileInput({
  label,
  isLabelHidden = false,
  value,
  onChange,
  changeAction,
  accept,
  isMultiple = false,
  maxSize,
  maxFiles,
  isDisabled = false,
  disabledMessage,
  isRequired = false,
  isLoading = false,
  status: statusProp,
  statusVariant = "attached",
  description,
  placeholder,
  mode = "input",
  isOptional = false,
  labelTooltip,
  width,
  containerXstyle,
  containerClassName,
  containerStyle,
  controlXstyle,
  controlClassName,
  controlStyle,
  ref,
  id: idProp,
  ...restProps
}: FileInputProps) {
  const { rest: allRest, container } = useFieldInputStyling("FileInput", restProps, {
    containerXstyle,
    containerClassName,
    containerStyle,
  });
  // ui-common fix: describe, mark and focus the trigger, not the hidden input.
  const { control: controlProps, input: rest } = splitControlProps(allRest);
  const {
    "aria-describedby": ariaDescribedByProp,
    "aria-invalid": ariaInvalidProp,
    "aria-required": ariaRequiredProp,
    ...triggerProps
  } = controlProps;
  const t = useTranslator();
  const generatedID = useId();
  const id = idProp ?? generatedID;
  const descriptionID = useId();
  const statusMessageID = useId();
  const requiredID = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const formatList = useListFormatter();
  const [, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const isBusy = isLoading || optimisticValue !== value;
  const isSelectionDisabled = isDisabled || isBusy;
  if (isDragOver && isSelectionDisabled) {
    setIsDragOver(false);
  }
  // A pick is one user action, already announced as "file selected"; a busy
  // period it starts (changeAction, or a caller setting isLoading from
  // onChange) adds no second message (spec:AST-086 FR6). The mark lasts until
  // the field is idle again. Other busy starts announce; the Spinner stays
  // decorative (FR8).
  const [isPickAnnounced, setIsPickAnnounced] = useState(false);
  if (isPickAnnounced && !isBusy) {
    setIsPickAnnounced(false);
  }
  useBusyAnnouncement(isBusy && !isPickAnnounced, t("@astryx.spinner.loading"));

  // Announce successful file selection to screen readers via a persistent
  // live region (forms-17). Validation errors are announced (assertively) by
  // the FieldStatus that the derived error status mounts, so only the
  // successful attach needs an explicit announcement here.
  const announce = useAnnounce();

  // Disabled-reason tooltip. Disabled controls swallow pointer events, so the
  // tooltip listeners attach to the visible container (which stays hoverable)
  // and the trigger stays perceivable via aria-disabled instead of the native
  // disabled attribute. Opening the picker is blocked by the isDisabled guards
  // in the handlers.
  const showsDisabledMessage = isDisabled && !!disabledMessage;
  const disabledMessageTooltip = useTooltip({
    placement: "above",
    focusTrigger: "always",
    isEnabled: showsDisabledMessage,
  });

  const status =
    statusProp ??
    (validationError
      ? { type: "error" as const, message: validationError }
      : undefined);

  const { statusIcon, describedBy: statusTooltipDescribedBy } = useInputStatusIcon({
    status,
    statusVariant,
  });

  // Required state. The trigger is a real button, but AT does not reliably
  // announce aria-required, so the trigger instead points its aria-describedby
  // at a visually hidden "Required" span — mirroring the Field label's visible
  // indicator (where isOptional takes precedence) and the pattern Slider uses
  // for its thumbs.
  // A surrounding FormLayout's defaultOptionality="required" makes an unmarked
  // field required too (FormLayout FR5).
  const conveysRequired = useResolvedRequired({
    isRequired: isRequired || ariaRequiredProp === true || ariaRequiredProp === "true",
    isOptional,
  });

  const ariaDescribedBy =
    [
      typeof ariaDescribedByProp === "string" ? ariaDescribedByProp : null,
      description ? descriptionID : null,
      statusVariant !== "tooltip" && status?.message ? statusMessageID : null,
      // The tooltip variant renders no message box; describe the input by the
      // tooltip's content instead so the status is still announced.
      statusTooltipDescribedBy,
      conveysRequired ? requiredID : null,
      showsDisabledMessage ? disabledMessageTooltip.describedBy : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const defaultPlaceholder = isMultiple
    ? t("@astryx.fileInput.placeholderMultiple")
    : t("@astryx.fileInput.placeholder");
  const displayPlaceholder = placeholder ?? defaultPlaceholder;

  const handleFiles = useCallback(
    (fileList: File[]) => {
      if (isSelectionDisabled) {
        return;
      }

      const { valid, errors } = validateFiles(
        fileList,
        accept,
        maxSize,
        maxFiles,
        isMultiple,
        t,
      );

      if (errors.length > 0) {
        // Every rejected file is identified, in one status message
        // (WCAG 3.3.1), joined as a list in the active locale.
        setValidationError(formatList(errors));
      } else {
        setValidationError(null);
      }

      if (valid.length === 0) {
        onChange(null);
        return;
      }

      const result = isMultiple ? valid : valid[0]!;
      onChange(result);

      // Announce the successful selection politely. Validation errors are
      // announced assertively by the FieldStatus that the derived error
      // status mounts, so only announce the attach here (do not
      // double-announce errors).
      if (errors.length === 0) {
        setIsPickAnnounced(true);
        announce(
          valid.length === 1
            ? t("@astryx.fileInput.fileSelected", { fileName: valid[0]!.name })
            : t("@astryx.fileInput.filesSelected", { count: valid.length }),
        );
      }

      if (changeAction) {
        startTransition(async () => {
          setOptimisticValue(result);
          await changeAction(result);
        });
      }
    },
    [
      accept,
      isSelectionDisabled,
      isMultiple,
      maxFiles,
      maxSize,
      onChange,
      changeAction,
      startTransition,
      setOptimisticValue,
      announce,
      t,
      formatList,
    ],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = Array.from(e.target.files ?? []);
      handleFiles(fileList);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setValidationError(null);
      onChange(null);
      if (changeAction) {
        startTransition(async () => {
          setOptimisticValue(null);
          await changeAction(null);
        });
      }
      if (inputRef.current) {
        inputRef.current.value = "";
        // Focus returns to the trigger button, the control a person operates;
        // the native input is aria-hidden and outside the tab order.
        const trigger = triggerRef.current;
        if (e.detail === 0) {
          trigger?.focus();
        } else {
          // Defer focus restoration past the button's unmount task so iOS Safari
          // and touch browsers don't jump the page scroll to 0 on tap.
          requestAnimationFrame(() => {
            trigger?.focus({ preventScroll: true });
          });
        }
      }
    },
    [onChange, changeAction, startTransition, setOptimisticValue],
  );

  const handleClick = useCallback(() => {
    if (!isSelectionDisabled) {
      inputRef.current?.click();
    }
  }, [isSelectionDisabled]);

  // Explicit keyboard activation so Enter/Space open the picker even where a
  // synthetic keydown does not raise a native click. Disabled and busy triggers
  // also cancel the default activation while remaining focusable.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!isSelectionDisabled) {
          inputRef.current?.click();
        }
      }
    },
    [isSelectionDisabled],
  );

  // Make the surface clickable without giving it an interactive role. Clicks on
  // the nested clear/status controls are ignored by the hook, so those buttons
  // are plain siblings — no nested-interactive violation.
  const { onClick: onContainerClick, onMouseUp: onContainerMouseUp } =
    useClickableContainer({
      containerRef,
      onClick: handleClick,
      disabled: isSelectionDisabled,
    });

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSelectionDisabled) {
        // A cancelled dragover with the default effect makes the zone a drop
        // target.
        // The 'none' effect shows the no-drop cursor and stops the drop.
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "none";
        }
      } else if (mode === "dropzone") {
        setIsDragOver(true);
      }
    },
    [isSelectionDisabled, mode],
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSelectionDisabled) {
        // A cancelled dragover with the default effect makes the zone a drop
        // target.
        // The 'none' effect shows the no-drop cursor and stops the drop.
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "none";
        }
      } else if (mode === "dropzone") {
        setIsDragOver(true);
      }
    },
    [isSelectionDisabled, mode],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Moving over the dropzone's own children (icon, text) fires dragleave on
    // the container too — only a leave that actually exits the dropzone ends
    // the drag-over state, otherwise the highlight flickers mid-drag.
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (isSelectionDisabled || mode !== "dropzone") {
        return;
      }
      const fileList = Array.from(e.dataTransfer.files);
      if (fileList.length > 0) {
        handleFiles(fileList);
      }
    },
    [isSelectionDisabled, mode, handleFiles],
  );

  const hasFiles =
    optimisticValue != null &&
    (Array.isArray(optimisticValue) ? optimisticValue.length > 0 : true);
  const fileNames = hasFiles
    ? Array.isArray(optimisticValue)
      ? optimisticValue.map((f) => f.name).join(", ")
      : (optimisticValue?.name ?? "")
    : null;

  // The tooltip placement renders no message box: its focusable status button
  // is the only place the message lives, and the trigger's aria-describedby
  // points at that button's tooltip. Every content branch that can show a
  // status keeps it, so the message stays reachable in dropzone mode and while
  // busy (family:input-fields FR8).
  const tooltipStatus = statusTooltipDescribedBy != null ? statusIcon : null;

  const renderDropzoneContent = () => {
    if (isBusy) {
      return (
        <>
          <Spinner size="md" aria-hidden="true" />
          {tooltipStatus}
        </>
      );
    }
    if (hasFiles) {
      return (
        <>
          <div {...folded.fileNameDropzone}>{fileNames}</div>
          {tooltipStatus}
        </>
      );
    }
    return (
      <>
        <Icon
          icon="upload"
          size="md"
          color="secondary"
          {...themeProps("file-input-icon", { mode })}
        />
        <span {...folded.placeholderDropzone}>
          {isDragOver ? t("@astryx.fileInput.dropHint") : displayPlaceholder}
        </span>
        {tooltipStatus}
      </>
    );
  };

  const renderCompactContent = () => {
    if (isBusy) {
      return (
        <>
          <span {...folded.fileNameBusy}>{fileNames ?? displayPlaceholder}</span>
          <Spinner size="sm" aria-hidden="true" />
          {tooltipStatus}
        </>
      );
    }
    return (
      <>
        <Icon
          icon="upload"
          size="sm"
          color="secondary"
          {...themeProps("file-input-icon", { mode })}
        />
        <span {...(hasFiles ? folded.fileNameCompact : folded.placeholderCompact)}>
          {fileNames ?? displayPlaceholder}
        </span>
        {statusIcon}
      </>
    );
  };

  const isDropzone = mode === "dropzone";

  const dragDropProps = isDropzone
    ? {
        onDragEnter: handleDragEnter,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
      }
    : {};

  return (
    <Field
      {...container}
      label={label}
      isLabelHidden={isLabelHidden}
      description={description}
      inputID={id}
      descriptionID={description ? descriptionID : undefined}
      isOptional={isOptional}
      isRequired={isRequired}
      isDisabled={isDisabled}
      status={
        status
          ? {
              type: status.type,
              message: status.message,
              messageID: status.message ? statusMessageID : undefined,
            }
          : undefined
      }
      statusVariant={statusVariant}
      labelTooltip={labelTooltip}
      width={width}
    >
      <div
        ref={(el) => {
          containerRef.current = el;
          // Anchor + hover/focus listeners for the disabled-message tooltip on
          // the visible container (the focusable trigger is visually hidden, so
          // anchoring there would place the tooltip at a 1px box). focusin
          // bubbles from the trigger button, so the tooltip still opens on
          // keyboard focus. Handlers are gated internally by isEnabled.
          disabledMessageTooltip.ref(el);
        }}
        onClick={!isSelectionDisabled ? onContainerClick : undefined}
        onMouseUp={!isSelectionDisabled ? onContainerMouseUp : undefined}
        {...dragDropProps}
        {...mergeProps(
          themeProps("file-input", { mode, status: status?.type ?? null }),
          stylex.props(
            isDropzone ? styles.dropzone : styles.compact,
            isDropzone && !isSelectionDisabled && styles.dropzoneHover,
            isDropzone && !isSelectionDisabled && isDragOver && styles.dropzoneActive,
            isDropzone && isDisabled && styles.dropzoneDisabled,
            !isDropzone && isDisabled && styles.compactDisabled,
            isBusy && styles.busy,
            status && statusBorderStyles[status.type],
            controlXstyle,
          ),
          controlClassName,
          controlStyle,
        )}
      >
        {/* Visually hidden real button carrying the accessible role, name, and
            ARIA. Kept as a sibling of the clear/status controls inside a
            non-interactive container, so no interactive element nests inside
            another (WCAG 4.1.2). The visible focus feedback is the container's
            :focus-within border; the surface click is handled by the container
            (VisuallyHidden disables the button's own pointer events), and
            keyboard activation still fires here. */}
        <VisuallyHidden>
          <button
            {...triggerProps}
            ref={triggerRef}
            type="button"
            // A disabled trigger keeps its Tab stop (spec:AST-085 FR1).
            tabIndex={0}
            aria-disabled={isSelectionDisabled ? "true" : undefined}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            // aria-label suppresses child content from the accessible name, so
            // compose the selected filenames into it — otherwise a
            // screen-reader user refocusing the control hears only the field
            // label and cannot tell what (if anything) is attached.
            aria-label={
              hasFiles && fileNames
                ? t("@astryx.fileInput.triggerWithFiles", { label, fileNames })
                : label
            }
            aria-busy={isBusy || undefined}
            aria-invalid={
              status?.type === "error" ||
              ariaInvalidProp === true ||
              ariaInvalidProp === "true"
                ? "true"
                : undefined
            }
            aria-describedby={ariaDescribedBy}
          />
        </VisuallyHidden>
        <input
          {...rest}
          ref={useMergedRefs(ref, inputRef)}
          id={id}
          type="file"
          accept={accept}
          multiple={isMultiple}
          // Detached from its form while disabled, so selected files are not
          // submitted and `required` does not block submission (FR3).
          form={isDisabled ? "" : undefined}
          // A label or description click activates this input directly; cancel
          // it so a disabled or busy input never opens the picker (FR2).
          onClick={
            isSelectionDisabled
              ? (event) => event.preventDefault()
              : (rest.onClick as React.MouseEventHandler<HTMLInputElement> | undefined)
          }
          onChange={handleInputChange}
          // The visually-hidden native input is never focused (tabIndex={-1});
          // its describedby/required/invalid live on the trigger button.
          aria-hidden="true"
          tabIndex={-1}
          {...folded.hiddenInput}
        />
        {isDropzone ? renderDropzoneContent() : renderCompactContent()}
        {hasFiles && !isDisabled && !isBusy && (
          <InputClearButton
            label={t("@astryx.fileInput.clearLabel", { label })}
            onClick={handleClear}
          />
        )}
      </div>
      {conveysRequired && (
        <VisuallyHidden id={requiredID}>
          {t("@astryx.fileInput.required")}
        </VisuallyHidden>
      )}
      {showsDisabledMessage && disabledMessageTooltip.renderTooltip(disabledMessage)}
    </Field>
  );
}

FileInput.displayName = "FileInput";
