/**
 * The date-time arithmetic behind DateTimeRangeInput. Values are Astryx's
 * local `YYYY-MM-DDTHH:MM` strings (DateTimeInput's), read at minute
 * precision: seconds are dropped.
 */
import type { ISODateString } from "@astryxdesign/core/Calendar";
import type { ISODateTimeString } from "@astryxdesign/core/DateTimeInput";

/** A start and an end, each a local date and time. */
export interface DateTimeRangeInputValue {
  start: ISODateTimeString;
  end: ISODateTimeString;
}

/** Why a range cannot be committed. */
export type DateTimeRangeProblem =
  "endBeforeStart" | "beforeMin" | "afterMax" | "tooLong";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** The start of the day, and the end a picked end day gets without `showTime`. */
export const DAY_START = "00:00";
export const DAY_END = "23:59";

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const pad = (n: number) => String(n).padStart(2, "0");

/** The local `Date` of a date-time string, or null when it does not parse. */
export function toDate(value: string | null | undefined): Date | null {
  const m = value ? PATTERN.exec(value) : null;
  if (!m) return null;
  const date = new Date(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A local `Date` as a date-time string, to the minute. */
export function fromDate(date: Date): ISODateTimeString {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}` as ISODateTimeString;
}

/** The date half of a date-time string. */
export function datePart(value: string): ISODateString {
  return value.slice(0, 10) as ISODateString;
}

/** Joins a date and a `HH:MM` time into a date-time string. */
export function combine(date: string, time: string): ISODateTimeString {
  return `${date}T${time.slice(0, 5)}` as ISODateTimeString;
}

/** The hour and the minute of a date-time string. */
export function hourMinute(value: string): [number, number] {
  return [+value.slice(11, 13), +value.slice(14, 16)];
}

/** A date-time string with its hour or minute replaced. */
export function withTime(
  value: ISODateTimeString,
  hour: number,
  minute: number,
): ISODateTimeString {
  return combine(datePart(value), `${pad(hour)}:${pad(minute)}`);
}

/** Whether a date-time comes before the earliest or after the latest allowed. */
export function outOfBounds(
  value: string,
  bounds: { min?: string; max?: string },
): boolean {
  const date = toDate(value);
  const min = toDate(bounds.min);
  const max = toDate(bounds.max);
  if (!date) return true;
  return (
    (min !== null && date.getTime() < min.getTime()) ||
    (max !== null && date.getTime() > max.getTime())
  );
}

/** The first thing wrong with a range, or null when it can be committed. */
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
 * The last day an end may fall on under a duration cap. With times it is the
 * day `maxDuration` after the start reaches, and the times decide the rest.
 * Without them a range runs from 00:00 on its first day to 23:59 on its last,
 * so it is the last day of the most whole days that fit.
 */
export function lastEndDay(
  start: string,
  maxDuration: number | undefined,
  showTime: boolean,
): ISODateString | undefined {
  const date = toDate(start);
  if (maxDuration == null || !date) return undefined;
  if (showTime) return datePart(fromDate(new Date(date.getTime() + maxDuration)));
  const days = Math.max(1, Math.floor((maxDuration + MINUTE_MS) / DAY_MS));
  date.setDate(date.getDate() + days - 1);
  return datePart(fromDate(date));
}

/**
 * The end a picked end day starts with: 23:59, or now when the day is today,
 * pulled back to `max` and to the longest range `maxDuration` allows.
 */
export function defaultEnd(
  day: ISODateString,
  start: ISODateTimeString,
  bounds: { max?: string; maxDuration?: number },
  now: Date,
): ISODateTimeString {
  let end = toDate(combine(day, DAY_END))!.getTime();
  if (day === datePart(fromDate(now))) end = Math.min(end, now.getTime());
  const max = toDate(bounds.max);
  if (max) end = Math.min(end, max.getTime());
  const startDate = toDate(start);
  if (startDate && bounds.maxDuration != null)
    end = Math.min(end, startDate.getTime() + bounds.maxDuration);
  const date = new Date(end);
  // The pull-backs above never leave the picked day, except to before it,
  // which the range check then refuses.
  return datePart(fromDate(date)) === day ? fromDate(date) : combine(day, DAY_END);
}

/** A date-time as the trigger shows it: `2026-11-05 09:00`, or the date alone. */
export function formatValue(value: string, showTime: boolean): string {
  return showTime ? value.slice(0, 16).replace("T", " ") : datePart(value);
}

/** Whether two ranges are the same, or both none. */
export function sameRange(
  a: DateTimeRangeInputValue | null | undefined,
  b: DateTimeRangeInputValue | null | undefined,
): boolean {
  return (
    (a ?? null) === (b ?? null) ||
    (!!a && !!b && a.start === b.start && a.end === b.end)
  );
}

/** How long a range is, in milliseconds. */
export function durationOf(range: DateTimeRangeInputValue): number {
  return (toDate(range.end)?.getTime() ?? 0) - (toDate(range.start)?.getTime() ?? 0);
}
