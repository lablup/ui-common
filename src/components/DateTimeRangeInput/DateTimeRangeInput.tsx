/**
 * DateTimeRangeInput
 *
 * A range whose start and end each carry a date and a time, to the minute.
 * Astryx has DateRangeInput (dates only) and DateTimeInput (one date and
 * time), not this. The trigger is Astryx's input box (its exported wrapper
 * styles and clear button); the popover holds Astryx's range `Calendar`, two
 * `TimeInput`s and the presets, beside them as in DateRangeInput.
 *
 * The popover edits a draft. Apply commits it; Cancel, Escape and a click
 * outside drop it. A draft that ends before it starts, leaves `min` / `max`
 * or is longer than `maxDuration` shows why in the popover and cannot be
 * applied, so `onChange` never reports it. A preset applies at once, and one
 * that breaks those bounds is disabled.
 *
 * It is a `Form.Item` control, like ui-common's form-control wrappers: the
 * item supplies the value, the id, `disabled` and the border status, and its
 * label names the trigger. On its own, name it with `aria-label`.
 *
 * @example
 * <DateTimeRangeInput
 *   aria-label="Period"
 *   value={range}
 *   onChange={setRange}
 *   presets={[{ label: "Last 24 hours", getRange: last24Hours }]}
 *   maxDuration={7 * 24 * 60 * 60 * 1000}
 * />
 */
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEventHandler,
} from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { Calendar, type DateRange } from "@astryxdesign/core/Calendar";
import type { ISODateTimeString } from "@astryxdesign/core/DateTimeInput";
import {
  InputClearButton,
  inputStatusBorderStyles,
  inputStatusFocusWithinStyles,
  inputStatusHoverShadowStyles,
  inputWrapperStyles,
} from "@astryxdesign/core/Field";
import { FieldStatus } from "@astryxdesign/core/FieldStatus";
import { useLocale, useTranslator } from "@astryxdesign/core/i18n";
import { Icon } from "@astryxdesign/core/Icon";
import { usePopover } from "@astryxdesign/core/Popover";
import { TimeInput, type ISOTimeString } from "@astryxdesign/core/TimeInput";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { NoFormItemContext } from "../Form/context";
import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type FormControlStatus,
} from "../../formControls/formControl";
import {
  combine,
  datePart,
  dateRangeOf,
  formatDateTime,
  formatDuration,
  maxSpanDays,
  needsYear,
  rangeProblem,
  timePart,
  type DateTimeRangeInputValue,
  type DateTimeRangeProblem,
} from "./dateTimeRange";
import "./DateTimeRangeInput.css";

export type { DateTimeRangeInputValue };

/** A quick pick shown beside the calendar, such as "Last 24 hours". */
export interface DateTimeRangeInputPreset {
  label: string;
  /** Called when the popover renders, so a relative range is computed fresh. */
  getRange: () => DateTimeRangeInputValue;
}

export type DateTimeRangeInputSize = "sm" | "md" | "lg";

export interface DateTimeRangeInputProps {
  /** The range, or null for none. Leave unset to let the control keep its own. */
  value?: DateTimeRangeInputValue | null;
  /** The starting range when `value` is not set (uncontrolled). */
  defaultValue?: DateTimeRangeInputValue | null;
  /**
   * Fires with the applied range, or null when cleared. A range that breaks
   * `min`, `max` or `maxDuration`, or ends before it starts, never reaches it.
   */
  onChange?: (range: DateTimeRangeInputValue | null) => void;
  /** Quick picks beside the calendar. One that breaks the bounds is disabled. */
  presets?: ReadonlyArray<DateTimeRangeInputPreset>;
  /** The earliest start allowed, `YYYY-MM-DDTHH:MM`. */
  min?: ISODateTimeString;
  /** The latest end allowed, `YYYY-MM-DDTHH:MM`. */
  max?: ISODateTimeString;
  /** The longest range allowed, in milliseconds. */
  maxDuration?: number;
  /**
   * Shows a clear button while a range is set.
   * @default true
   */
  hasClear?: boolean;
  /** @default 'md' */
  size?: DateTimeRangeInputSize;
  /** 12- or 24-hour clock. Unset, it follows the locale. */
  hourFormat?: "12h" | "24h";
  /**
   * Months the calendar shows.
   * @default 1
   */
  numberOfMonths?: 1 | 2;
  isDisabled?: boolean;
  /** Set by `<Form disabled>` through `Form.Item`; same as `isDisabled`. */
  disabled?: boolean;
  /**
   * The border state. Inside a `Form.Item` it follows the item's validation
   * unless set here.
   */
  status?: FormControlStatus;
  /** Width of the trigger. Numbers are pixels. */
  width?: number | string;
  /** @default the catalog's uic.DateTimeRangeInput.placeholder ("Select date and time range") */
  placeholder?: string;
  /** @default the catalog's uic.DateTimeRangeInput.startTime ("Start time") */
  startTimeLabel?: string;
  /** @default the catalog's uic.DateTimeRangeInput.endTime ("End time") */
  endTimeLabel?: string;
  /** @default the catalog's uic.common.apply ("Apply") */
  applyLabel?: string;
  /** @default the catalog's uic.common.cancel ("Cancel") */
  cancelLabel?: string;
  /** Names the control outside a `Form.Item`. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** `Form.Item` sets it from a `required` rule. */
  "aria-required"?: boolean | "true" | "false";
  /** Id of the trigger button; `Form.Item` sets it. */
  id?: string;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  /**
   * Test id of the trigger. The popover's calendar, time fields, presets,
   * apply and cancel buttons get `<id>-calendar`, `-start-time`, `-end-time`,
   * `-presets`, `-apply` and `-cancel`.
   */
  "data-testid"?: string;
}

const DEFAULT_START_TIME = "00:00" as ISOTimeString;
const DEFAULT_END_TIME = "23:59" as ISOTimeString;

interface Draft {
  dates: DateRange | null;
  startTime: ISOTimeString | undefined;
  endTime: ISOTimeString | undefined;
}

function draftOf(range: DateTimeRangeInputValue | null | undefined): Draft {
  return range
    ? {
        dates: dateRangeOf(range),
        startTime: timePart(range.start),
        endTime: timePart(range.end),
      }
    : { dates: null, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME };
}

function rangeOf(draft: Draft): DateTimeRangeInputValue | null {
  if (!draft.dates || !draft.startTime || !draft.endTime) return null;
  return {
    start: combine(draft.dates.start, draft.startTime),
    end: combine(draft.dates.end, draft.endTime),
  };
}

const sameRange = (
  a: DateTimeRangeInputValue | null,
  b: DateTimeRangeInputValue | null,
) => a === b || (!!a && !!b && a.start === b.start && a.end === b.end);

export function DateTimeRangeInput({
  value,
  defaultValue,
  onChange,
  presets,
  min,
  max,
  maxDuration,
  hasClear = true,
  size = "md",
  hourFormat,
  numberOfMonths = 1,
  isDisabled,
  disabled,
  status,
  width,
  placeholder,
  startTimeLabel,
  endTimeLabel,
  applyLabel,
  cancelLabel,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
  id: idProp,
  onFocus,
  onBlur,
  className,
  style,
  "data-testid": testId,
}: DateTimeRangeInputProps) {
  const t = useUicTranslator();
  const astryxT = useTranslator();
  const locale = useLocale();
  const generatedId = useId();
  const requiredId = useId();
  const id = idProp ?? generatedId;
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    required,
    field,
    width: mergedWidth,
  } = useFormControl({
    component: "DateTimeRangeInput",
    caller: {},
    status,
    disabled: disabled ?? isDisabled,
    ariaRequired,
    ariaLabel,
    namesItself: true,
    sizing: "DateRangeInput",
    width,
  });
  const isEffectivelyDisabled = !!field.isDisabled;
  const borderStatus = field.status?.type;

  const [range, setRange] = useMergedValue<DateTimeRangeInputValue | null>(
    value,
    defaultValue,
    onChange,
    null,
  );
  const current = range ?? null;
  const [draft, setDraft] = useState<Draft>(() => draftOf(current));

  const popover = usePopover({
    dialogLabel: t("uic.DateTimeRangeInput.dialogLabel"),
    closeButtonLabel: astryxT("@astryx.dateInput.closeCalendar"),
  });

  const bounds = { min, max, maxDuration };
  const withYear = needsYear(
    [current?.start, current?.end, min, max].filter((v) => v !== undefined),
  );
  const format = (v: string) => formatDateTime(v, locale, hourFormat, withYear);
  const display = current ? `${format(current.start)} - ${format(current.end)}` : "";
  const shownPlaceholder = placeholder ?? t("uic.DateTimeRangeInput.placeholder");
  const name = field.label;
  const triggerName = name
    ? `${name}: ${display || shownPlaceholder}`
    : display || shownPlaceholder;

  const commit = (next: DateTimeRangeInputValue | null) => {
    if (!sameRange(next, current)) setRange(next);
  };

  const open = () => {
    if (isEffectivelyDisabled) return;
    if (popover.isOpen) {
      popover.hide();
      return;
    }
    setDraft(draftOf(current));
    popover.show();
  };

  const draftRange = rangeOf(draft);
  const problem: DateTimeRangeProblem | null = draftRange
    ? rangeProblem(draftRange, bounds)
    : null;
  const problemMessage = (() => {
    switch (problem) {
      case "endBeforeStart":
        return t("uic.DateTimeRangeInput.endBeforeStart");
      case "beforeMin":
        return t("uic.DateTimeRangeInput.beforeMin", { min: format(min!) });
      case "afterMax":
        return t("uic.DateTimeRangeInput.afterMax", { max: format(max!) });
      case "tooLong":
        return t("uic.DateTimeRangeInput.tooLong", {
          duration: formatDuration(maxDuration!, locale),
        });
      default:
        return null;
    }
  })();

  const apply = () => {
    if (!draftRange || problem) return;
    commit(draftRange);
    popover.hide();
    triggerRef.current?.focus();
  };

  const cancel = () => {
    popover.hide();
    triggerRef.current?.focus();
  };

  // Astryx's own input box: border, hover ring, focus ring, status, disabled.
  const wrapper = stylex.props(
    inputWrapperStyles.base,
    isEffectivelyDisabled && inputWrapperStyles.disabled,
    borderStatus && inputStatusBorderStyles[borderStatus],
    borderStatus &&
      !isEffectivelyDisabled &&
      inputStatusHoverShadowStyles[borderStatus],
    borderStatus && inputStatusFocusWithinStyles[borderStatus],
  );

  const part = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined);

  return (
    <FormControlScope required={required}>
      <div
        ref={popover.triggerRef}
        className={[
          wrapper.className,
          "uic-date-time-range-input",
          `uic-date-time-range-input--${size}`,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...wrapper.style,
          ...style,
          ...(mergedWidth === undefined
            ? null
            : {
                width:
                  typeof mergedWidth === "number" ? `${mergedWidth}px` : mergedWidth,
              }),
        }}
        data-status={borderStatus}
        data-disabled={isEffectivelyDisabled || undefined}
      >
        <Icon icon="calendar" size="sm" color="secondary" />
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className={[
            "uic-date-time-range-input__trigger",
            display ? null : "uic-date-time-range-input__trigger--placeholder",
          ]
            .filter(Boolean)
            .join(" ")}
          data-testid={testId}
          aria-label={triggerName}
          aria-haspopup="dialog"
          aria-expanded={popover.isOpen}
          aria-controls={popover.isOpen ? popover.id : undefined}
          aria-disabled={isEffectivelyDisabled || undefined}
          aria-invalid={borderStatus === "error" || undefined}
          aria-describedby={
            [required ? requiredId : null, ariaDescribedBy].filter(Boolean).join(" ") ||
            undefined
          }
          onClick={open}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {display || shownPlaceholder}
        </button>
        {hasClear && current && !isEffectivelyDisabled ? (
          <InputClearButton
            label={astryxT("@astryx.dateInput.clear", {
              label: name || shownPlaceholder,
            })}
            onClick={(e) => {
              e.stopPropagation();
              commit(null);
              if (e.detail === 0) triggerRef.current?.focus();
            }}
          />
        ) : null}
        {required ? (
          <VisuallyHidden id={requiredId}>
            {astryxT("@astryx.field.required")}
          </VisuallyHidden>
        ) : null}
      </div>
      {popover.render(
        <NoFormItemContext>
          <div className="uic-date-time-range-input__panel">
            {presets && presets.length > 0 ? (
              <div
                role="group"
                aria-label={t("uic.DateTimeRangeInput.presets")}
                className="uic-date-time-range-input__presets"
                data-testid={part("presets")}
              >
                {presets.map((preset) => {
                  const presetRange = preset.getRange();
                  const isActive = sameRange(presetRange, current);
                  const isPresetDisabled = rangeProblem(presetRange, bounds) !== null;
                  return (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      label={preset.label}
                      isDisabled={isPresetDisabled}
                      aria-current={isActive ? "true" : undefined}
                      className={
                        isActive
                          ? "uic-date-time-range-input__preset uic-date-time-range-input__preset--active"
                          : "uic-date-time-range-input__preset"
                      }
                      onClick={() => {
                        if (isPresetDisabled) return;
                        commit(presetRange);
                        popover.hide();
                        triggerRef.current?.focus();
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
            <div className="uic-date-time-range-input__editor">
              {popover.isOpen ? (
                <Calendar
                  mode="range"
                  value={draft.dates}
                  onChange={(dates) => setDraft((d) => ({ ...d, dates }))}
                  min={min ? datePart(min) : undefined}
                  max={max ? datePart(max) : undefined}
                  maxRangeSpan={maxSpanDays(maxDuration)}
                  numberOfMonths={numberOfMonths}
                  data-testid={part("calendar")}
                />
              ) : null}
              <div className="uic-date-time-range-input__times">
                <TimeInput
                  label={startTimeLabel ?? t("uic.DateTimeRangeInput.startTime")}
                  size="sm"
                  hourFormat={hourFormat}
                  value={draft.startTime}
                  onChange={(startTime) => setDraft((d) => ({ ...d, startTime }))}
                  data-testid={part("start-time")}
                />
                <TimeInput
                  label={endTimeLabel ?? t("uic.DateTimeRangeInput.endTime")}
                  size="sm"
                  hourFormat={hourFormat}
                  value={draft.endTime}
                  onChange={(endTime) => setDraft((d) => ({ ...d, endTime }))}
                  data-testid={part("end-time")}
                />
              </div>
              {problemMessage ? (
                <FieldStatus type="error" message={problemMessage} variant="detached" />
              ) : null}
              <div className="uic-date-time-range-input__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  label={cancelLabel ?? t("uic.common.cancel")}
                  onClick={cancel}
                  data-testid={part("cancel")}
                />
                <Button
                  variant="primary"
                  size="sm"
                  label={applyLabel ?? t("uic.common.apply")}
                  isDisabled={!draftRange || problem !== null}
                  onClick={apply}
                  data-testid={part("apply")}
                />
              </div>
            </div>
          </div>
        </NoFormItemContext>,
        { placement: "below", alignment: "start" },
      )}
    </FormControlScope>
  );
}

DateTimeRangeInput.displayName = "DateTimeRangeInput";
