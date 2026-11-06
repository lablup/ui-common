/**
 * One column of the time picker, hours or minutes: a listbox whose options
 * take focus themselves (roving tabindex). Arrow keys, Home and End move the
 * selection; a click picks. The selected option scrolls into view.
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
  isDisabled?: boolean;
  "data-testid"?: string;
}

export function TimeColumn({
  label,
  count,
  value,
  onChange,
  isDisabled,
  "data-testid": testId,
}: TimeColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && option) list.scrollTop = option.offsetTop - list.offsetTop;
  }, [value]);

  const select = (next: number) => {
    onChange(next);
    listRef.current?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isDisabled) return;
    const current = value ?? 0;
    const next =
      e.key === "ArrowDown"
        ? Math.min(count - 1, current + 1)
        : e.key === "ArrowUp"
          ? Math.max(0, current - 1)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? count - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    select(next);
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
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? undefined : n === (value ?? 0) ? 0 : -1}
          data-value={n}
          className="uic-date-time-range-input__time-option"
          onClick={() => {
            if (!isDisabled) select(n);
          }}
        >
          {pad(n)}
        </div>
      ))}
    </div>
  );
}
