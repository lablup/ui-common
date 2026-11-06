/**
 * DateTimeRangeInput
 *
 * A range whose start and end each carry a date and a time, to the minute,
 * modeled on Ant Design's `RangePicker` with `showTime`. Astryx has
 * DateRangeInput (dates only) and DateTimeInput (one date and time), not
 * this. The trigger is Astryx's input box (its exported wrapper styles and
 * clear button) holding one button per end; the popover holds the presets,
 * Astryx's range `Calendar` over two months, hour and minute columns and a
 * confirm button.
 *
 * Picking goes one end at a time, as in antd. A day click sets the end being
 * edited, at 00:00 for the start and at 23:59 (or now, on today) for the
 * end; the columns change its time; confirm moves from the start to the end,
 * then commits both. Without `showTime` there are no columns and no confirm:
 * the second day click commits. Once a start is picked, days before it and
 * beyond `maxDuration` from it are disabled, and a draft that is not a
 * valid range never reaches `onChange`. A preset commits at once. Escape and
 * a click outside drop the draft.
 *
 * It is a `Form.Item` control, like ui-common's form-control wrappers: the
 * item supplies the value, the id (on the start button), `disabled` and the
 * border status, and its label names both ends. On its own, name it with
 * `aria-label`.
 *
 * @example
 * <DateTimeRangeInput
 *   aria-label="Period"
 *   showTime
 *   value={range}
 *   onChange={setRange}
 *   presets={[{ label: "Last 24 hours", getRange: last24Hours, isRelative: true }]}
 *   max={now}
 *   maxDuration={7 * 24 * 60 * 60 * 1000}
 * />
 */
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEventHandler,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { Calendar, type ISODateString } from "@astryxdesign/core/Calendar";
import type { ISODateTimeString } from "@astryxdesign/core/DateTimeInput";
import {
  InputClearButton,
  inputStatusBorderStyles,
  inputStatusFocusWithinStyles,
  inputStatusHoverShadowStyles,
  inputWrapperStyles,
} from "@astryxdesign/core/Field";
import { useTranslator } from "@astryxdesign/core/i18n";
import { Icon } from "@astryxdesign/core/Icon";
import { usePopover } from "@astryxdesign/core/Popover";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { NoFormItemContext } from "../Form/context";
import {
  FormControlScope,
  useFormControl,
  useMergedValue,
  type FormControlStatus,
} from "../../formControls/formControl";
import { TimeColumn } from "./TimeColumn";
import {
  DAY_START,
  combine,
  datePart,
  defaultEnd,
  durationOf,
  formatValue,
  fromDate,
  hourMinute,
  lastEndDay,
  outOfBounds,
  rangeProblem,
  sameRange,
  toDate,
  withTime,
  type DateTimeRangeInputValue,
} from "./dateTimeRange";
import "./DateTimeRangeInput.css";

export type { DateTimeRangeInputValue };

/** A quick pick shown beside the calendar, such as "Last 24 hours". */
export interface DateTimeRangeInputPreset {
  label: string;
  /** Called when the popover renders and on a click, so a relative range is computed fresh. */
  getRange: () => DateTimeRangeInputValue;
  /**
   * A range relative to now, such as "Last 24 hours". While it is the value,
   * a trigger with `isCompactLabel` shows this label instead of the dates, so
   * the caller can keep the range rolling.
   */
  isRelative?: boolean;
}

export type DateTimeRangeInputSize = "sm" | "md";

export interface DateTimeRangeInputProps {
  /** The range, or null for none. Leave unset to let the control keep its own. */
  value?: DateTimeRangeInputValue | null;
  /** The starting range when `value` is not set (uncontrolled). */
  defaultValue?: DateTimeRangeInputValue | null;
  /**
   * Fires with the committed range, or null when cleared, and the preset when
   * one was clicked. A range that is not after its start, breaks `min` or
   * `max`, or is longer than `maxDuration` never reaches it.
   */
  onChange?: (
    range: DateTimeRangeInputValue | null,
    preset?: DateTimeRangeInputPreset,
  ) => void;
  /**
   * Hour and minute columns beside the calendar, and a confirm button for
   * each end. Without it the range is dates only: the start gets 00:00, the
   * end 23:59, and the second day click commits.
   * @default false
   */
  showTime?: boolean;
  /** Quick picks beside the calendar. One that breaks the bounds is disabled. */
  presets?: ReadonlyArray<DateTimeRangeInputPreset>;
  /** The earliest start allowed, `YYYY-MM-DDTHH:MM`. */
  min?: ISODateTimeString;
  /** The latest end allowed, `YYYY-MM-DDTHH:MM`; usually now. */
  max?: ISODateTimeString;
  /** The longest range allowed, in milliseconds. */
  maxDuration?: number;
  /**
   * Shows a clear button while a range is set.
   * @default true
   */
  hasClear?: boolean;
  /**
   * `sm` fits a card header.
   * @default 'md'
   */
  size?: DateTimeRangeInputSize;
  /**
   * While the value came from a preset marked `isRelative`, the trigger shows
   * that preset's label instead of the dates.
   * @default false
   */
  isCompactLabel?: boolean;
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
  /** @default the catalog's uic.DateTimeRangeInput.startPlaceholder ("Start date") */
  startPlaceholder?: string;
  /** @default the catalog's uic.DateTimeRangeInput.endPlaceholder ("End date") */
  endPlaceholder?: string;
  /** @default the catalog's uic.common.ok ("OK") */
  confirmLabel?: string;
  /** Names the control outside a `Form.Item`. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** `Form.Item` sets it from a `required` rule. */
  "aria-required"?: boolean | "true" | "false";
  /** Id of the start button; `Form.Item` sets it. */
  id?: string;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  /**
   * Test id of the box. The ends, the popover's calendar, presets, time
   * columns and confirm button get `<id>-start`, `-end`, `-calendar`,
   * `-presets`, `-hour`, `-minute` and `-confirm`.
   */
  "data-testid"?: string;
}

type Part = "start" | "end";

interface Draft {
  start: ISODateTimeString | null;
  end: ISODateTimeString | null;
}

const EMPTY_DRAFT: Draft = { start: null, end: null };

/** The month the two-month calendar starts on, as its `focusDate`. */
function firstMonth(draft: Draft, maxDay: ISODateString | undefined): ISODateString {
  const shown = datePart(draft.start ?? maxDay ?? fromDate(new Date()));
  const date = toDate(combine(shown, DAY_START))!;
  date.setDate(1);
  // Keep the last month a range may reach on the right, as antd does, so
  // the right month is not one of all-disabled days.
  if (maxDay && shown.slice(0, 7) === maxDay.slice(0, 7)) {
    date.setMonth(date.getMonth() - 1);
  }
  return datePart(fromDate(date));
}

export function DateTimeRangeInput({
  value,
  defaultValue,
  onChange,
  showTime = false,
  presets,
  min,
  max,
  maxDuration,
  hasClear = true,
  size = "md",
  isCompactLabel = false,
  isDisabled,
  disabled,
  status,
  width,
  startPlaceholder,
  endPlaceholder,
  confirmLabel,
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
  const generatedId = useId();
  const requiredId = useId();
  const id = idProp ?? generatedId;
  const startRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [part, setPart] = useState<Part>("start");
  const [focusDate, setFocusDate] = useState<ISODateString | undefined>();
  const [relativeLabel, setRelativeLabel] = useState<string | null>(null);

  // Astryx's range Calendar keeps the day of a half-made range (its anchor,
  // which drives the hover preview) to itself and toggles it on every day
  // click. `anchor` mirrors it. When the anchor must change in a way a
  // click would not, the calendar remounts (`calendarKey`), and is seeded
  // with a click on the day the anchor must be (`seed`).
  const anchor = useRef<ISODateString | null>(null);
  const seed = useRef<ISODateString | null>(null);
  const refocus = useRef<ISODateString | null>(null);
  const isSeeding = useRef(false);
  const [calendarKey, setCalendarKey] = useState(0);

  const popover = usePopover({
    dialogLabel: t("uic.DateTimeRangeInput.dialogLabel"),
    closeButtonLabel: astryxT("@astryx.dateInput.closeCalendar"),
  });

  const bounds = { min, max, maxDuration };
  const maxDay = max ? datePart(max) : undefined;
  const minDay = min ? datePart(min) : undefined;
  const name = field.label;
  const startText = startPlaceholder ?? t("uic.DateTimeRangeInput.startPlaceholder");
  const endText = endPlaceholder ?? t("uic.DateTimeRangeInput.endPlaceholder");

  // The relative preset the value came from, while the value still spans as
  // long as it: a caller that keeps the range rolling moves both ends.
  const relativePreset =
    isCompactLabel && current
      ? presets?.find(
          (p) =>
            p.isRelative &&
            (relativeLabel === p.label || sameRange(p.getRange(), current)) &&
            durationOf(p.getRange()) === durationOf(current),
        )
      : undefined;

  useLayoutEffect(() => {
    const calendar = calendarRef.current;
    const seedDay = seed.current;
    const focusDay = refocus.current;
    seed.current = null;
    refocus.current = null;
    if (!calendar) return;
    const dayButton = (day: string) =>
      calendar.querySelector<HTMLElement>(`[data-date="${day}"]`);
    if (seedDay) {
      const button = dayButton(seedDay);
      if (button) {
        isSeeding.current = true;
        button.click();
        isSeeding.current = false;
      } else {
        anchor.current = null;
      }
    }
    if (focusDay) dayButton(focusDay)?.focus();
  }, [calendarKey]);

  /** Brings the calendar's anchor to `day` (or none), focusing `focusDay` after. */
  const syncAnchor = (day: ISODateString | null, focusDay: ISODateString | null) => {
    if (anchor.current === day) return;
    anchor.current = day;
    seed.current = day;
    refocus.current = focusDay;
    setCalendarKey((k) => k + 1);
  };

  const close = (focus: Part = part) => {
    popover.hide();
    (focus === "end" ? endRef : startRef).current?.focus();
  };

  const commit = (
    next: DateTimeRangeInputValue | null,
    preset?: DateTimeRangeInputPreset,
  ) => {
    setRelativeLabel(preset?.isRelative ? preset.label : null);
    if (sameRange(next, current)) return;
    if (preset) setRange(next, preset);
    else setRange(next);
  };

  const openOn = (target: Part) => {
    if (isEffectivelyDisabled) return;
    if (popover.isOpen) {
      const next = target === "end" && draft.start ? "end" : "start";
      if (next === part) {
        popover.hide();
        return;
      }
      setPart(next);
      if (next === "end") syncAnchor(draft.end ? null : datePart(draft.start!), null);
      return;
    }
    const start = current ? { start: current.start, end: current.end } : EMPTY_DRAFT;
    setDraft(start);
    setPart(target === "end" && current ? "end" : "start");
    setFocusDate(firstMonth(start, maxDay));
    // The calendar mounts with the popover, with no anchor.
    anchor.current = null;
    popover.show();
  };

  const pickDay = (day: ISODateString) => {
    if (part === "start") {
      let start = combine(day, DAY_START);
      if (min && toDate(min)!.getTime() > toDate(start)!.getTime() && day === minDay) {
        start = min;
      }
      setDraft({ start, end: null });
      if (!showTime) setPart("end");
      syncAnchor(day, day);
      return;
    }
    const next = {
      start: draft.start!,
      end: defaultEnd(day, draft.start!, bounds, new Date()),
    };
    if (!showTime && rangeProblem(next, bounds) === null) {
      commit(next);
      close("end");
      return;
    }
    setDraft(next);
    syncAnchor(null, day);
  };

  const onCalendarClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isSeeding.current) return;
    const button = (e.target as Element).closest("[data-date]");
    if (!button || button.getAttribute("aria-disabled") === "true") return;
    const day = button.getAttribute("data-date") as ISODateString;
    // What the calendar itself just did with its anchor.
    anchor.current = anchor.current === null ? day : null;
    pickDay(day);
  };

  // Escape closes the popover even while the calendar holds a half-made
  // range, which Astryx's calendar would otherwise only drop.
  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    close();
  };

  const editing = part === "start" ? draft.start : draft.end;
  const canConfirm =
    part === "start"
      ? draft.start !== null && !outOfBounds(draft.start, bounds)
      : draft.start !== null &&
        draft.end !== null &&
        rangeProblem({ start: draft.start, end: draft.end }, bounds) === null;

  const confirm = () => {
    if (!canConfirm) return;
    if (part === "start") {
      setPart("end");
      syncAnchor(draft.end ? null : datePart(draft.start!), null);
      return;
    }
    commit({ start: draft.start!, end: draft.end! });
    close("end");
  };

  const setTime = (hour: number | null, minute: number | null) => {
    if (!editing) return;
    const [h, m] = hourMinute(editing);
    const next = withTime(editing, hour ?? h, minute ?? m);
    setDraft((d) => ({ ...d, [part]: next }));
  };

  // The calendar's bounds for the end being edited: the end may not come
  // before the start, nor beyond `maxDuration` from it.
  const endCap = draft.start
    ? lastEndDay(draft.start, maxDuration, showTime)
    : undefined;
  const calendarMin = part === "end" && draft.start ? datePart(draft.start) : minDay;
  const calendarMax =
    part === "end" && endCap && (!maxDay || endCap < maxDay) ? endCap : maxDay;
  const calendarValue = draft.start
    ? { start: datePart(draft.start), end: datePart(draft.end ?? draft.start) }
    : null;

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

  const testPart = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined);
  const describedBy =
    [required ? requiredId : null, ariaDescribedBy].filter(Boolean).join(" ") ||
    undefined;

  const endButton = (which: Part) => {
    const shown = current ? formatValue(current[which], showTime) : "";
    const placeholder = which === "start" ? startText : endText;
    const isActive = popover.isOpen && part === which;
    return (
      <button
        ref={which === "start" ? startRef : endRef}
        id={which === "start" ? id : undefined}
        type="button"
        className={[
          "uic-date-time-range-input__end",
          shown ? null : "uic-date-time-range-input__end--placeholder",
          isActive ? "uic-date-time-range-input__end--active" : null,
        ]
          .filter(Boolean)
          .join(" ")}
        data-testid={testPart(which)}
        aria-label={`${name ? `${name}, ` : ""}${placeholder}${shown ? `: ${shown}` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isActive}
        aria-controls={isActive ? popover.id : undefined}
        aria-disabled={isEffectivelyDisabled || undefined}
        aria-invalid={borderStatus === "error" || undefined}
        aria-describedby={describedBy}
        onClick={() => openOn(which)}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {shown || placeholder}
      </button>
    );
  };

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
        data-testid={testId}
        data-status={borderStatus}
        data-disabled={isEffectivelyDisabled || undefined}
      >
        <Icon icon="calendar" size="sm" color="secondary" />
        {relativePreset ? (
          <button
            ref={startRef}
            id={id}
            type="button"
            className="uic-date-time-range-input__end"
            data-testid={testPart("start")}
            aria-label={`${name ? `${name}: ` : ""}${relativePreset.label}`}
            aria-haspopup="dialog"
            aria-expanded={popover.isOpen}
            aria-controls={popover.isOpen ? popover.id : undefined}
            aria-disabled={isEffectivelyDisabled || undefined}
            aria-invalid={borderStatus === "error" || undefined}
            aria-describedby={describedBy}
            onClick={() => openOn("start")}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            {relativePreset.label}
          </button>
        ) : (
          <>
            {endButton("start")}
            <span className="uic-date-time-range-input__separator" aria-hidden="true">
              →
            </span>
            {endButton("end")}
          </>
        )}
        {hasClear && current && !isEffectivelyDisabled ? (
          <InputClearButton
            label={astryxT("@astryx.dateInput.clear", { label: name || startText })}
            onClick={(e) => {
              e.stopPropagation();
              commit(null);
              if (e.detail === 0) startRef.current?.focus();
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
          <div
            className="uic-date-time-range-input__panel"
            onKeyDownCapture={onPanelKeyDown}
          >
            {presets && presets.length > 0 ? (
              <div
                role="group"
                aria-label={t("uic.DateTimeRangeInput.presets")}
                className="uic-date-time-range-input__presets"
                data-testid={testPart("presets")}
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
                        commit(preset.getRange(), preset);
                        close("start");
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
            <div className="uic-date-time-range-input__body">
              <div className="uic-date-time-range-input__pickers">
                {/* The calendar's day buttons are the targets; this only listens. */}
                <div ref={calendarRef} onClick={onCalendarClick}>
                  {popover.isOpen ? (
                    <Calendar
                      key={calendarKey}
                      mode="range"
                      numberOfMonths={2}
                      hasOutsideDays={false}
                      value={calendarValue}
                      min={calendarMin}
                      max={calendarMax}
                      focusDate={focusDate}
                      onFocusDateChange={setFocusDate}
                      data-testid={testPart("calendar")}
                    />
                  ) : null}
                </div>
                {showTime ? (
                  <div
                    role="group"
                    aria-label={t(
                      part === "start"
                        ? "uic.DateTimeRangeInput.startTime"
                        : "uic.DateTimeRangeInput.endTime",
                    )}
                    className="uic-date-time-range-input__time"
                  >
                    <TimeColumn
                      label={t("uic.DateTimeRangeInput.hour")}
                      count={24}
                      value={editing ? hourMinute(editing)[0] : null}
                      onChange={(hour) => setTime(hour, null)}
                      isDisabled={!editing}
                      data-testid={testPart("hour")}
                    />
                    <TimeColumn
                      label={t("uic.DateTimeRangeInput.minute")}
                      count={60}
                      value={editing ? hourMinute(editing)[1] : null}
                      onChange={(minute) => setTime(null, minute)}
                      isDisabled={!editing}
                      data-testid={testPart("minute")}
                    />
                  </div>
                ) : null}
              </div>
              {showTime ? (
                <div className="uic-date-time-range-input__footer">
                  <Button
                    variant="primary"
                    size="sm"
                    label={confirmLabel ?? t("uic.common.ok")}
                    isDisabled={!canConfirm}
                    onClick={confirm}
                    data-testid={testPart("confirm")}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </NoFormItemContext>,
        { placement: "below", alignment: "start" },
      )}
    </FormControlScope>
  );
}

DateTimeRangeInput.displayName = "DateTimeRangeInput";
