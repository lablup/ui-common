/**
 * One column of the time picker, hours or minutes, as in Ant Design's time
 * panel: a column as tall as the picker beside it (at least antd's 224px)
 * that scrolls freely (wheel, scrollbar, touch),
 * with the selected value scrolled to its top. A listbox whose options take
 * focus themselves (roving tabindex): arrow keys, Home and End move the
 * selection, skipping disabled values; a click picks. A disabled value (one
 * the bounds rule out) is greyed and cannot be picked.
 */
import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export interface TimeColumnProps {
  label: string;
  /** How many values, from 0: 24 for hours, 60 for minutes. */
  count: number;
  /** The selected value, or null when the column has nothing to edit yet. */
  value: number | null;
  onChange: (value: number) => void;
  /** The whole column is off (nothing to edit yet). */
  isDisabled?: boolean;
  /** Values the bounds rule out. */
  isValueDisabled?: (value: number) => boolean;
  /** How a value reads. @default two digits, `07` */
  formatValue?: (value: number) => string;
  "data-testid"?: string;
}

export function TimeColumn({
  label,
  count,
  value,
  onChange,
  isDisabled,
  isValueDisabled,
  formatValue = pad,
  "data-testid": testId,
}: TimeColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !option) return;
    const top = option.offsetTop - list.offsetTop;
    // Opening jumps there; a pick glides, as antd's columns do.
    if (hasScrolled.current && typeof list.scrollTo === "function") {
      list.scrollTo({ top, behavior: "smooth" });
    } else {
      list.scrollTop = top;
    }
    hasScrolled.current = true;
  }, [value]);

  const isOff = (n: number) => !!isDisabled || !!isValueDisabled?.(n);

  const select = (next: number) => {
    onChange(next);
    listRef.current?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus();
  };

  /** The nearest enabled value from `from`, stepping by `step`. */
  const seek = (from: number, step: 1 | -1) => {
    for (let n = from; n >= 0 && n < count; n += step) if (!isOff(n)) return n;
    return null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isDisabled) return;
    const current = value ?? 0;
    const next =
      e.key === "ArrowDown"
        ? seek(current + 1, 1)
        : e.key === "ArrowUp"
          ? seek(current - 1, -1)
          : e.key === "Home"
            ? seek(0, 1)
            : e.key === "End"
              ? seek(count - 1, -1)
              : undefined;
    if (next === undefined) return;
    e.preventDefault();
    if (next !== null) select(next);
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      aria-disabled={isDisabled || undefined}
      className="uic-date-time-range-input__time-column"
      onKeyDown={onKeyDown}
      data-testid={testId}
    >
      {Array.from({ length: count }, (_, n) => (
        <div
          key={n}
          role="option"
          aria-selected={n === value}
          aria-disabled={isOff(n) || undefined}
          tabIndex={isDisabled ? undefined : n === (value ?? 0) ? 0 : -1}
          data-value={n}
          className="uic-date-time-range-input__time-option"
          onClick={() => {
            if (!isOff(n)) select(n);
          }}
        >
          {formatValue(n)}
        </div>
      ))}
    </div>
  );
}
