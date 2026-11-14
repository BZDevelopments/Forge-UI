import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { cn } from "@forge-ui/core";
import {
  addDays,
  addMonths,
  clampDate,
  daysInMonth,
  endOfWeek,
  formatter,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "./date-utils";
import { defaultLabels } from "./labels";
import type { DatePickerLabels } from "./types";

export interface CalendarProps {
  locale: string;
  weekStartsOn: number;
  /** First visible month. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** The day that receives keyboard focus. */
  focusedDate: Date;
  onFocusedDateChange: (date: Date) => void;
  /** Selected day, or the start of a range. */
  from: Date | null;
  to?: Date | null;
  /** Day under the pointer or focus while a range is being chosen. */
  hoverDate?: Date | null;
  onHoverDateChange?: (date: Date | null) => void;
  onDayClick: (date: Date) => void;
  isDisabled: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  today: Date;
  numberOfMonths?: 1 | 2;
  labels?: Partial<DatePickerLabels>;
  /** Move DOM focus to the active day. The picker sets this when the popup opens. */
  focusOnMount?: boolean;
  className?: string;
}

function monthDays(month: Date, weekStartsOn: number): (Date | null)[][] {
  const first = startOfMonth(month);
  const total = daysInMonth(first.getFullYear(), first.getMonth());
  const leading = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= total; day++)
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * An accessible month grid following the WAI-ARIA date picker pattern.
 * It is fully controlled; `DateRangePicker` wires up selection rules on top of it.
 */
export function Calendar({
  locale,
  weekStartsOn,
  month,
  onMonthChange,
  focusedDate,
  onFocusedDateChange,
  from,
  to = null,
  hoverDate = null,
  onHoverDateChange,
  onDayClick,
  isDisabled,
  minDate,
  maxDate,
  today,
  numberOfMonths = 1,
  labels: labelOverrides,
  focusOnMount,
  className,
}: CalendarProps) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const rootRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(Boolean(focusOnMount));

  const months = useMemo(
    () => Array.from({ length: numberOfMonths }, (_, i) => addMonths(startOfMonth(month), i)),
    [month, numberOfMonths],
  );
  const monthName = formatter(locale, { month: "long" });
  const fullDay = formatter(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const monthTitle = formatter(locale, { month: "long", year: "numeric" });
  const weekdayLong = formatter(locale, { weekday: "long" });
  const weekdayShort = formatter(locale, { weekday: "short" });

  const weekdays = useMemo(() => {
    const start = startOfWeek(new Date(2024, 0, 7), weekStartsOn); // 7 Jan 2024 was a Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekStartsOn]);

  // Pull focus onto the active day after keyboard moves and when the popup opens.
  useEffect(() => {
    if (!shouldFocus.current) return;
    const button = rootRef.current?.querySelector<HTMLButtonElement>(
      'button[data-day][tabindex="0"]',
    );
    if (button) {
      button.focus();
      shouldFocus.current = false;
    }
  });

  // The focused day must always be inside the visible months.
  const visibleStart = months[0]!;
  const visibleEnd = addMonths(months[months.length - 1]!, 1);
  const focusedVisible = !isBefore(focusedDate, visibleStart) && isBefore(focusedDate, visibleEnd);
  const tabbableDate = focusedVisible ? focusedDate : visibleStart;

  const moveFocus = (next: Date) => {
    const clamped = clampDate(next, minDate, maxDate);
    shouldFocus.current = true;
    onFocusedDateChange(clamped);
    if (isBefore(clamped, visibleStart)) onMonthChange(startOfMonth(clamped));
    else if (!isBefore(clamped, visibleEnd))
      onMonthChange(startOfMonth(addMonths(clamped, -(numberOfMonths - 1))));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("button[data-day]");
    if (!target) return;
    const current = startOfDay(new Date(Number(target.dataset.day)));
    const keyMap: Record<string, Date> = {
      ArrowLeft: addDays(current, -1),
      ArrowRight: addDays(current, 1),
      ArrowUp: addDays(current, -7),
      ArrowDown: addDays(current, 7),
      Home: startOfWeek(current, weekStartsOn),
      End: endOfWeek(current, weekStartsOn),
      PageUp: addMonths(current, event.shiftKey ? -12 : -1),
      PageDown: addMonths(current, event.shiftKey ? 12 : 1),
    };
    const next = keyMap[event.key];
    if (!next) return;
    event.preventDefault();
    moveFocus(next);
  };

  const previewEnd = to ?? hoverDate;
  const rangeLow = from && previewEnd ? (isBefore(previewEnd, from) ? previewEnd : from) : null;
  const rangeHigh = from && previewEnd ? (isBefore(previewEnd, from) ? from : previewEnd) : null;

  const canGoPrev = !minDate || isAfter(visibleStart, startOfMonth(minDate));
  const canGoNext =
    !maxDate ||
    isBefore(addMonths(months[months.length - 1]!, 1), startOfDay(maxDate)) ||
    isSameDay(addMonths(months[months.length - 1]!, 1), maxDate);

  const years = useMemo(() => {
    const thisYear = today.getFullYear();
    const first = minDate ? minDate.getFullYear() : thisYear - 100;
    const last = maxDate ? maxDate.getFullYear() : thisYear + 20;
    const list: number[] = [];
    for (let y = first; y <= last; y++) list.push(y);
    if (!list.includes(visibleStart.getFullYear())) list.push(visibleStart.getFullYear());
    return list.sort((a, b) => a - b);
  }, [minDate, maxDate, today, visibleStart]);

  return (
    <div ref={rootRef} className={cn("forge-cal", className)} data-months={numberOfMonths}>
      <div className="forge-cal-header">
        <button
          type="button"
          className="forge-cal-nav"
          aria-label={labels.previousMonth}
          disabled={!canGoPrev}
          onClick={() => onMonthChange(addMonths(visibleStart, -1))}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="forge-cal-selects">
          <select
            className="forge-cal-select"
            aria-label={labels.month}
            value={visibleStart.getMonth()}
            onChange={(event) =>
              onMonthChange(new Date(visibleStart.getFullYear(), Number(event.target.value), 1))
            }
          >
            {Array.from({ length: 12 }, (_, m) => (
              <option key={m} value={m}>
                {monthName.format(new Date(2024, m, 1))}
              </option>
            ))}
          </select>
          <select
            className="forge-cal-select"
            aria-label={labels.year}
            value={visibleStart.getFullYear()}
            onChange={(event) =>
              onMonthChange(new Date(Number(event.target.value), visibleStart.getMonth(), 1))
            }
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="forge-cal-nav"
          aria-label={labels.nextMonth}
          disabled={!canGoNext}
          onClick={() => onMonthChange(addMonths(visibleStart, 1))}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="forge-cal-months">
        {months.map((monthStart, monthIndex) => (
          <div key={monthStart.getTime()} className="forge-cal-month">
            {numberOfMonths > 1 && monthIndex > 0 ? (
              <div className="forge-cal-title" aria-hidden="true">
                {monthTitle.format(monthStart)}
              </div>
            ) : null}
            <table
              role="grid"
              className="forge-cal-grid"
              aria-label={monthTitle.format(monthStart)}
              onKeyDown={onKeyDown}
            >
              <thead>
                <tr>
                  {weekdays.map((day) => (
                    <th key={day.getDay()} scope="col" abbr={weekdayLong.format(day)}>
                      {weekdayShort.format(day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthDays(monthStart, weekStartsOn).map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((date, dayIndex) => {
                      if (!date) return <td key={dayIndex} aria-hidden="true" />;
                      const outOfBounds = Boolean(
                        (minDate && isBefore(date, minDate)) || (maxDate && isAfter(date, maxDate)),
                      );
                      const disabled = outOfBounds || isDisabled(date);
                      const isStart = isSameDay(date, from);
                      const isEnd = isSameDay(date, to);
                      const selected = isStart || isEnd;
                      const inRange = Boolean(
                        rangeLow &&
                        rangeHigh &&
                        !isBefore(date, rangeLow) &&
                        !isAfter(date, rangeHigh),
                      );
                      const isToday = isSameDay(date, today);
                      const tabbable = isSameDay(date, tabbableDate);
                      const suffix = [
                        isToday ? labels.today : null,
                        isStart ? (to ? labels.rangeStart : null) : null,
                        isEnd ? labels.rangeEnd : null,
                      ].filter(Boolean);
                      return (
                        <td
                          key={dayIndex}
                          role="gridcell"
                          aria-selected={selected || (inRange && Boolean(to)) || undefined}
                        >
                          <button
                            type="button"
                            data-day={date.getTime()}
                            className="forge-cal-day"
                            tabIndex={tabbable ? 0 : -1}
                            aria-label={
                              suffix.length
                                ? `${fullDay.format(date)}, ${suffix.join(", ")}`
                                : fullDay.format(date)
                            }
                            aria-disabled={disabled || undefined}
                            aria-current={isToday ? "date" : undefined}
                            data-selected={selected || undefined}
                            data-range-start={(rangeLow && isSameDay(date, rangeLow)) || undefined}
                            data-range-end={
                              (rangeHigh &&
                                isSameDay(date, rangeHigh) &&
                                !isSameDay(rangeLow, rangeHigh)) ||
                              undefined
                            }
                            data-in-range={(inRange && !selected) || undefined}
                            data-today={isToday || undefined}
                            data-disabled={disabled || undefined}
                            onClick={() => !disabled && onDayClick(date)}
                            onFocus={() => {
                              if (!isSameDay(date, focusedDate)) onFocusedDateChange(date);
                              if (!disabled) onHoverDateChange?.(date);
                            }}
                            onPointerEnter={() => !disabled && onHoverDateChange?.(date)}
                          >
                            {date.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
