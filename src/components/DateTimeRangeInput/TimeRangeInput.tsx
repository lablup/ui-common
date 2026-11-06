/**
 * TimeRangeInput
 *
 * A start and an end time of day, to the minute, modeled on Ant Design's
 * `TimePicker.RangePicker`. DateTimeRangeInput's time-only sibling: the same
 * box with one part per end (`09:00 → 18:00`) and the same hour and minute
 * columns, without the calendar. Clicking a part opens the popover on that
 * end; confirm moves from the start to the end, then commits both. The end
 * must be after the start: earlier hours and minutes are greyed while the
 * end is edited. Escape and a click outside drop the draft.
 *
 * A `Form.Item` control like DateTimeRangeInput: the item supplies the value,
 * the id (on the start part), `disabled` and the border status, and its label
 * names both parts. On its own, name it with `aria-label`.
 *
 * @example
 * <TimeRangeInput aria-label="Working hours" value={hours} onChange={setHours} />
 */
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEventHandler,
  type KeyboardEvent,
} from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import {
  InputClearButton,
  inputStatusBorderStyles,
  inputStatusFocusWithinStyles,
  inputStatusHoverShadowStyles,
  inputWrapperStyles,
} from "@astryxdesign/core/Field";
import { useLocale, useTranslator } from "@astryxdesign/core/i18n";
import { Icon } from "@astryxdesign/core/Icon";
import { usePopover } from "@astryxdesign/core/Popover";
import type { ISOTimeString } from "@astryxdesign/core/TimeInput";
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
import "./DateTimeRangeInput.css";

/** A start and an end, each a local `HH:MM` time of day. */
export interface TimeRangeInputValue {
  start: ISOTimeString;
  end: ISOTimeString;
}

export type TimeRangeInputSize = "sm" | "md";

export interface TimeRangeInputProps {
  /** The range, or null for none. Leave unset to let the control keep its own. */
  value?: TimeRangeInputValue | null;
  /** The starting range when `value` is not set (uncontrolled). */
  defaultValue?: TimeRangeInputValue | null;
  /** Fires with the committed range, or null when cleared. The end is always after the start. */
  onChange?: (range: TimeRangeInputValue | null) => void;
  /**
   * Shows a clear button while a range is set.
   * @default true
   */
  hasClear?: boolean;
  /**
   * `sm` fits a card header.
   * @default 'md'
   */
  size?: TimeRangeInputSize;
  /**
   * A 12-hour clock shows `9:00 AM` in the box and adds an AM / PM column
   * to the picker, as antd's `use12Hours`. The value stays `HH:MM`.
   * @default '24h'
   */
  hourFormat?: "12h" | "24h";
  isDisabled?: boolean;
  /** Set by `<Form disabled>` through `Form.Item`; same as `isDisabled`. */
  disabled?: boolean;
  /**
   * The border state. Inside a `Form.Item` it follows the item's validation
   * unless set here.
   */
  status?: FormControlStatus;
  /** Width of the box. Numbers are pixels. */
  width?: number | string;
  /** @default the catalog's uic.DateTimeRangeInput.startTime ("Start time") */
  startPlaceholder?: string;
  /** @default the catalog's uic.DateTimeRangeInput.endTime ("End time") */
  endPlaceholder?: string;
  /** @default the catalog's uic.common.ok ("OK") */
  confirmLabel?: string;
  /** Names the control outside a `Form.Item`. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** `Form.Item` sets it from a `required` rule. */
  "aria-required"?: boolean | "true" | "false";
  /** Id of the start part; `Form.Item` sets it. */
  id?: string;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  /**
   * Test id of the box. The parts, time columns and confirm button get
   * `<id>-start`, `-end`, `-hour`, `-minute` and `-confirm`.
   */
  "data-testid"?: string;
}

type Part = "start" | "end";

interface Draft {
  start: ISOTimeString | null;
  end: ISOTimeString | null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (time: string) => +time.slice(0, 2) * 60 + +time.slice(3, 5);
const fromMinutes = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}` as ISOTimeString;
/** The locale's names for AM and PM. */
function dayPeriods(locale: string): [string, string] {
  const period = (hour: number) =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true })
      .formatToParts(new Date(2000, 0, 1, hour))
      .find((p) => p.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM");
  return [period(9), period(21)];
}

/** An `HH:MM` time on a 12-hour clock in the locale's form: `9:00 AM`. */
function formatTime12(time: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2000, 0, 1, +time.slice(0, 2), +time.slice(3, 5)));
}

const sameRange = (a: TimeRangeInputValue | null, b: TimeRangeInputValue | null) =>
  a === b || (!!a && !!b && a.start === b.start && a.end === b.end);

export function TimeRangeInput({
  value,
  defaultValue,
  onChange,
  hasClear = true,
  size = "md",
  hourFormat = "24h",
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
}: TimeRangeInputProps) {
  const t = useUicTranslator();
  const astryxT = useTranslator();
  const locale = useLocale();
  const generatedId = useId();
  const requiredId = useId();
  const id = idProp ?? generatedId;
  const startRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLButtonElement>(null);

  const {
    required,
    field,
    width: mergedWidth,
  } = useFormControl({
    component: "TimeRangeInput",
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

  const [range, setRange] = useMergedValue<TimeRangeInputValue | null>(
    value,
    defaultValue,
    onChange,
    null,
  );
  const current = range ?? null;
  const [draft, setDraft] = useState<Draft>({ start: null, end: null });
  const [part, setPart] = useState<Part>("start");

  const popover = usePopover({
    dialogLabel: t("uic.TimeRangeInput.dialogLabel"),
    closeButtonLabel: astryxT("@astryx.dateInput.closeCalendar"),
  });

  const name = field.label;
  const startText = startPlaceholder ?? t("uic.DateTimeRangeInput.startTime");
  const endText = endPlaceholder ?? t("uic.DateTimeRangeInput.endTime");

  // As antd's does, the panel sits under the part being edited: while the
  // end is edited it moves along the box by how far in the end part starts.
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [panelShift, setPanelShift] = useState(0);
  // Stable, so the popover's anchor is not detached and reattached each render.
  const popoverTriggerRef = popover.triggerRef;
  const boxTriggerRef = useCallback(
    (el: HTMLDivElement | null) => {
      boxRef.current = el;
      popoverTriggerRef(el);
    },
    [popoverTriggerRef],
  );
  useLayoutEffect(() => {
    const box = boxRef.current;
    const end = endRef.current;
    if (!popover.isOpen || part !== "end" || !box || !end) {
      setPanelShift(0);
      return;
    }
    const isRtl = getComputedStyle(box).direction === "rtl";
    const b = box.getBoundingClientRect();
    const e = end.getBoundingClientRect();
    setPanelShift(Math.max(0, Math.round(isRtl ? b.right - e.right : e.left - b.left)));
  }, [popover.isOpen, part]);

  const close = (focus: Part = part) => {
    popover.hide();
    (focus === "end" ? endRef : startRef).current?.focus();
  };

  const commit = (next: TimeRangeInputValue | null) => {
    if (!sameRange(next, current)) setRange(next);
  };

  const openOn = (target: Part) => {
    if (isEffectivelyDisabled) return;
    if (popover.isOpen) {
      const next = target === "end" && draft.start ? "end" : "start";
      if (next === part) popover.hide();
      else setPart(next);
      return;
    }
    setDraft(current ? { ...current } : { start: null, end: null });
    setPart(target === "end" && current ? "end" : "start");
    popover.show();
  };

  // The minutes of the day the part being edited may take: any for the
  // start but the last one, and after the start for the end.
  const lo = part === "end" && draft.start ? toMinutes(draft.start) + 1 : 0;
  const hi = part === "start" ? 24 * 60 - 2 : 24 * 60 - 1;
  const editing = part === "start" ? draft.start : draft.end;
  // An end with no time yet starts from the first one allowed.
  const base = editing ?? (part === "end" ? fromMinutes(Math.min(lo, hi)) : "00:00");
  const [baseHour, baseMinute] = [toMinutes(base) / 60, toMinutes(base) % 60].map(
    Math.floor,
  );

  const isHourDisabled = (hour: number) => hour * 60 + 59 < lo || hour * 60 > hi;

  // The 12-hour clock: the hour column lists 12, 1 … 11 of the current
  // period, and a period column picks AM or PM.
  const is12h = hourFormat === "12h";
  const isPm = baseHour! >= 12;
  const periodNames = dayPeriods(locale);
  const hourOf12 = (n: number) => n + (isPm ? 12 : 0);
  const isPeriodDisabled = (period: number) =>
    Array.from({ length: 12 }, (_, n) => n + period * 12).every(isHourDisabled);
  const format = (time: string) => (is12h ? formatTime12(time, locale) : time);
  const isMinuteDisabled = (minute: number) => {
    const at = baseHour! * 60 + minute;
    return at < lo || at > hi;
  };

  const setTime = (hour: number | null, minute: number | null) => {
    // A part with no time yet fills the unpicked unit with 0, as antd does.
    const at =
      (hour ?? (editing ? baseHour! : 0)) * 60 +
      (minute ?? (editing ? baseMinute! : 0));
    const next = fromMinutes(Math.min(Math.max(at, lo), hi));
    setDraft((d) => {
      const updated = { ...d, [part]: next };
      // A start moved to or past the end drops the end, which no longer fits.
      if (
        part === "start" &&
        updated.end &&
        toMinutes(updated.end) <= toMinutes(next)
      ) {
        updated.end = null;
      }
      return updated;
    });
  };

  const canConfirm =
    part === "start"
      ? draft.start !== null
      : draft.start !== null &&
        draft.end !== null &&
        toMinutes(draft.end) > toMinutes(draft.start);

  const confirm = () => {
    if (!canConfirm) return;
    if (part === "start") {
      setPart("end");
      return;
    }
    commit({ start: draft.start!, end: draft.end! });
    close("end");
  };

  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    close();
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

  const testPart = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined);
  const describedBy =
    [required ? requiredId : null, ariaDescribedBy].filter(Boolean).join(" ") ||
    undefined;

  const endButton = (which: Part) => {
    // While the popover is open the part shows the draft, as antd's inputs do.
    const time = popover.isOpen ? draft[which] : current?.[which];
    const shown = time ? format(time) : "";
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
        ref={boxTriggerRef}
        className={[
          wrapper.className,
          "uic-date-time-range-input",
          `uic-date-time-range-input--${size}`,
          "uic-date-time-range-input--time-only",
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
        <Icon icon="clock" size="sm" color="secondary" />
        {endButton("start")}
        <span className="uic-date-time-range-input__separator" aria-hidden="true">
          →
        </span>
        {endButton("end")}
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
            className="uic-date-time-range-input__body"
            onKeyDownCapture={onPanelKeyDown}
          >
            <div className="uic-date-time-range-input__pickers">
              <div
                role="group"
                aria-label={t(
                  part === "start"
                    ? "uic.DateTimeRangeInput.startTime"
                    : "uic.DateTimeRangeInput.endTime",
                )}
                className="uic-date-time-range-input__time uic-date-time-range-input__time--alone"
              >
                {is12h ? (
                  <TimeColumn
                    label={t("uic.DateTimeRangeInput.hour")}
                    count={12}
                    value={editing ? baseHour! % 12 : null}
                    onChange={(n) => setTime(hourOf12(n), null)}
                    isValueDisabled={(n) => isHourDisabled(hourOf12(n))}
                    formatValue={(n) => pad(n === 0 ? 12 : n)}
                    data-testid={testPart("hour")}
                  />
                ) : (
                  <TimeColumn
                    label={t("uic.DateTimeRangeInput.hour")}
                    count={24}
                    value={editing ? baseHour! : null}
                    onChange={(hour) => setTime(hour, null)}
                    isValueDisabled={isHourDisabled}
                    data-testid={testPart("hour")}
                  />
                )}
                <TimeColumn
                  label={t("uic.DateTimeRangeInput.minute")}
                  count={60}
                  value={editing ? baseMinute! : null}
                  onChange={(minute) => setTime(null, minute)}
                  isValueDisabled={isMinuteDisabled}
                  data-testid={testPart("minute")}
                />
                {is12h ? (
                  <TimeColumn
                    label={t("uic.TimeRangeInput.period")}
                    count={2}
                    value={editing ? (isPm ? 1 : 0) : null}
                    onChange={(period) => setTime((baseHour! % 12) + period * 12, null)}
                    isValueDisabled={isPeriodDisabled}
                    formatValue={(period) => periodNames[period]!}
                    data-testid={testPart("period")}
                  />
                ) : null}
              </div>
            </div>
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
          </div>
        </NoFormItemContext>,
        {
          placement: "below",
          alignment: "start",
          style: panelShift ? { marginInlineStart: panelShift } : undefined,
        },
      )}
    </FormControlScope>
  );
}

TimeRangeInput.displayName = "TimeRangeInput";
