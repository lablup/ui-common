/**
 * The date-time arithmetic behind DateTimeRangeInput. Values are Astryx's
 * local `YYYY-MM-DDTHH:MM` strings (DateTimeInput's), read at minute
 * precision: seconds are dropped.
 */
import type { DateRange, ISODateString } from "@astryxdesign/core/Calendar";
import type { ISODateTimeString } from "@astryxdesign/core/DateTimeInput";
import type { ISOTimeString } from "@astryxdesign/core/TimeInput";

/** A start and an end, each a local date and time. */
export interface DateTimeRangeInputValue {
  start: ISODateTimeString;
  end: ISODateTimeString;
}

/** Why a range cannot be applied. */
export type DateTimeRangeProblem =
  "endBeforeStart" | "beforeMin" | "afterMax" | "tooLong";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/** The local `Date` of a date-time string, or null when it does not parse. */
export function toDate(value: string | null | undefined): Date | null {
  const m = value ? PATTERN.exec(value) : null;
  if (!m) return null;
  const date = new Date(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The date half of a date-time string. */
export function datePart(value: string): ISODateString {
  return value.slice(0, 10) as ISODateString;
}

/** The time half of a date-time string, to the minute. */
export function timePart(value: string): ISOTimeString {
  return value.slice(11, 16) as ISOTimeString;
}

/** Joins a date and a time into a date-time string, to the minute. */
export function combine(date: string, time: string): ISODateTimeString {
  return `${date}T${time.slice(0, 5)}` as ISODateTimeString;
}

/** The first thing wrong with a range, or null when it can be applied. */
export function rangeProblem(
  range: DateTimeRangeInputValue,
  bounds: {
    min?: string;
    max?: string;
    maxDuration?: number;
  },
): DateTimeRangeProblem | null {
  const start = toDate(range.start);
  const end = toDate(range.end);
  if (!start || !end || end.getTime() <= start.getTime()) return "endBeforeStart";
  const min = toDate(bounds.min);
  if (min && start.getTime() < min.getTime()) return "beforeMin";
  const max = toDate(bounds.max);
  if (max && end.getTime() > max.getTime()) return "afterMax";
  if (
    bounds.maxDuration != null &&
    end.getTime() - start.getTime() > bounds.maxDuration
  )
    return "tooLong";
  return null;
}

/**
 * The calendar's `maxRangeSpan` for a duration cap: the most calendar days a
 * range that fits can touch. The calendar only stops days no time of day
 * could reach; the times decide the rest.
 */
export function maxSpanDays(maxDuration: number | undefined): number | undefined {
  return maxDuration == null ? undefined : Math.ceil(maxDuration / DAY_MS) + 1;
}

/** `{ start, end }` as a `DateRange` of their dates. */
export function dateRangeOf(range: DateTimeRangeInputValue): DateRange {
  return { start: datePart(range.start), end: datePart(range.end) };
}

/** A duration in its largest whole unit, localized: "7 days", "2 hours". */
export function formatDuration(ms: number, locale: string): string {
  const [amount, unit] =
    ms % DAY_MS === 0
      ? [ms / DAY_MS, "day"]
      : ms % HOUR_MS === 0
        ? [ms / HOUR_MS, "hour"]
        : [Math.round(ms / MINUTE_MS), "minute"];
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "long",
  }).format(amount);
}

/**
 * A date-time for the trigger and the messages: month, day and time, with the
 * year when it is not the current one.
 */
export function formatDateTime(
  value: string,
  locale: string,
  hourFormat: "12h" | "24h" | undefined,
  withYear: boolean,
): string {
  const date = toDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(locale, {
    year: withYear ? "numeric" : undefined,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: hourFormat === "24h" ? "h23" : hourFormat === "12h" ? "h12" : undefined,
  }).format(date);
}

/** Whether a set of date-times needs its year shown: any is not this year. */
export function needsYear(values: ReadonlyArray<string>): boolean {
  const year = new Date().getFullYear();
  return values.some((v) => toDate(v)?.getFullYear() !== year);
}
