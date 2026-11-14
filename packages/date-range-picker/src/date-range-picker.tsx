import { useEffect, useId, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Button,
  announce,
  cn,
  resolveLocale,
  useControllableState,
  useMediaQuery,
} from "@forge-ui/core";
import { Calendar } from "./calendar";
import {
  clampDate,
  differenceInDays,
  eachDay,
  formatDate as intlFormat,
  getWeekStart,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
  toISODate,
} from "./date-utils";
import { defaultLabels } from "./labels";
import type { DateRangePickerProps, DateRangeValue } from "./types";

const EMPTY_RANGE: DateRangeValue = { from: null, to: null };

/**
 * Date and date-range picker. Pass `mode="single"` for one date; ranges are the default.
 * Works controlled (`value`) or uncontrolled (`defaultValue`).
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const {
    minDate,
    maxDate,
    disabledDates,
    formatDate,
    dateFormat,
    clearable,
    disabled,
    name,
    id,
    invalid,
    className,
    footer,
  } = props;
  const locale = useMemo(() => resolveLocale(props.locale), [props.locale]);
  const isRange = props.mode !== "single";
  const labels = { ...defaultLabels, ...props.labels };
  const weekStartsOn = props.weekStartsOn ?? getWeekStart(locale);
  const today = useMemo(() => startOfDay(props.today ?? new Date()), [props.today]);
  const wide = useMediaQuery("(min-width: 700px)");
  const numberOfMonths = props.months ?? (isRange && wide ? 2 : 1);

  const [open, setOpen] = useControllableState({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });

  // Normalise single and range values into one shape internally.
  const [rawValue, setRawValue] = useControllableState<Date | null | DateRangeValue>({
    value: props.value as Date | null | DateRangeValue | undefined,
    defaultValue:
      (props.defaultValue as Date | null | DateRangeValue | undefined) ??
      (isRange ? EMPTY_RANGE : null),
  });
  const value: DateRangeValue = isRange
    ? ((rawValue as DateRangeValue | null) ?? EMPTY_RANGE)
    : { from: (rawValue as Date | null) ?? null, to: null };

  const [draft, setDraft] = useState<DateRangeValue>(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value.from ?? today));
  const [focusedDate, setFocusedDate] = useState(() =>
    clampDate(value.from ?? today, minDate, maxDate),
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const labelId = useId();
  const valueId = useId();

  // Start every opening from the committed value.
  useEffect(() => {
    if (!open) return;
    const start = value.from ?? today;
    setDraft(value);
    setViewMonth(startOfMonth(start));
    setFocusedDate(clampDate(start, minDate, maxDate));
    setHoverDate(null);
    setMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isDisabled = useMemo(() => {
    if (!disabledDates) return () => false;
    if (typeof disabledDates === "function") return disabledDates;
    return (date: Date) => disabledDates.some((blocked) => isSameDay(blocked, date));
  }, [disabledDates]);

  const outOfBounds = (date: Date) =>
    Boolean((minDate && isBefore(date, minDate)) || (maxDate && isAfter(date, maxDate)));
  const blocked = (date: Date) => outOfBounds(date) || isDisabled(date);

  const format = (date: Date) =>
    formatDate ? formatDate(date, locale) : intlFormat(date, locale, dateFormat);

  const commit = (next: Date | null | DateRangeValue) => {
    setRawValue(next);
    if (props.mode === "single") {
      (props.onValueChange as ((v: Date | null) => void) | undefined)?.(next as Date | null);
    } else {
      (props.onValueChange as ((v: DateRangeValue) => void) | undefined)?.(next as DateRangeValue);
    }
  };

  const rangeProps = isRange ? (props as Extract<DateRangePickerProps, { mode?: "range" }>) : null;

  const onDayClick = (date: Date) => {
    if (props.mode === "single") {
      commit(date);
      announce(`${format(date)} selected`);
      setOpen(false);
      return;
    }
    const { from, to } = draft;
    // First click, or starting over after a finished range.
    if (!from || to) {
      setDraft({ from: date, to: null });
      setMessage(null);
      announce(labels.chooseEnd(format(date)));
      return;
    }
    const [low, high] = isBefore(date, from) ? [date, from] : [from, date];
    const length = differenceInDays(high, low) + 1;
    const { minRangeDays, maxRangeDays } = rangeProps!;
    const problem =
      minRangeDays && length < minRangeDays
        ? labels.rangeTooShort(minRangeDays)
        : maxRangeDays && length > maxRangeDays
          ? labels.rangeTooLong(maxRangeDays)
          : eachDay(low, high).some(blocked)
            ? labels.rangeBlocked
            : null;
    if (problem) {
      // Keep the start so the user can try another end date.
      setMessage(problem);
      announce(problem, "assertive");
      return;
    }
    const next = { from: low, to: high };
    setDraft(next);
    commit(next);
    announce(`${format(low)} ${labels.separator} ${format(high)} selected`);
    setOpen(false);
  };

  const clear = () => {
    commit(isRange ? EMPTY_RANGE : null);
    setDraft(EMPTY_RANGE);
    announce("Selection cleared");
  };

  const hasValue = Boolean(value.from);
  const triggerText = !value.from
    ? (props.placeholder ?? (isRange ? labels.placeholderRange : labels.placeholderSingle))
    : value.to
      ? `${format(value.from)} ${labels.separator} ${format(value.to)}`
      : format(value.from);

  return (
    <Popover.Root open={open && !disabled} onOpenChange={setOpen}>
      <div className={cn("forge-dp", className)} data-disabled={disabled || undefined}>
        <Popover.Trigger asChild>
          <button
            type="button"
            id={id}
            className="forge-input forge-dp-trigger"
            disabled={disabled}
            aria-haspopup="dialog"
            // The visible value must be part of the accessible name (WCAG 2.5.3), so the name is "label value".
            aria-labelledby={
              props["aria-label"] || props["aria-labelledby"]
                ? `${props["aria-labelledby"] ?? labelId} ${valueId}`
                : undefined
            }
            aria-describedby={props["aria-describedby"]}
            data-invalid={invalid || undefined}
            data-empty={!hasValue || undefined}
          >
            <span className="forge-dp-icon" aria-hidden="true">
              📅
            </span>
            <span id={valueId} className="forge-dp-value">
              {triggerText}
            </span>
            {props["aria-label"] && !props["aria-labelledby"] ? (
              <span id={labelId} className="forge-sr-only">
                {props["aria-label"]}
              </span>
            ) : null}
          </button>
        </Popover.Trigger>
        {clearable && hasValue && !disabled ? (
          <button
            type="button"
            className="forge-dp-clear"
            aria-label={labels.clear}
            onClick={clear}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>

      {name && value.from ? (
        isRange ? (
          <>
            <input type="hidden" name={`${name}_from`} value={toISODate(value.from)} />
            {value.to ? (
              <input type="hidden" name={`${name}_to`} value={toISODate(value.to)} />
            ) : null}
          </>
        ) : (
          <input type="hidden" name={name} value={toISODate(value.from)} />
        )
      ) : null}

      <Popover.Portal>
        <Popover.Content
          className="forge-popover forge-dp-content"
          align="start"
          sideOffset={6}
          collisionPadding={8}
          aria-label={labels.dialog}
          onOpenAutoFocus={(event) => {
            // Let the calendar move focus to the active day instead.
            event.preventDefault();
          }}
        >
          <div className="forge-dp-layout">
            {rangeProps?.presets?.length ? (
              <ul className="forge-dp-presets" aria-label="Presets">
                {rangeProps.presets.map((preset) => (
                  <li key={preset.label}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        commit(preset.value);
                        announce(`${preset.label} selected`);
                        setOpen(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <Calendar
                focusOnMount
                locale={locale}
                weekStartsOn={weekStartsOn}
                month={viewMonth}
                onMonthChange={setViewMonth}
                focusedDate={focusedDate}
                onFocusedDateChange={setFocusedDate}
                from={draft.from}
                to={draft.to}
                hoverDate={isRange && draft.from && !draft.to ? hoverDate : null}
                onHoverDateChange={setHoverDate}
                onDayClick={onDayClick}
                isDisabled={isDisabled}
                minDate={minDate}
                maxDate={maxDate}
                today={today}
                numberOfMonths={numberOfMonths}
                labels={props.labels}
              />
              {message ? (
                <p role="alert" className="forge-dp-message">
                  {message}
                </p>
              ) : null}
              {footer}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Convenience: a range ending today and starting `days - 1` days earlier. */
export function lastNDays(days: number, today: Date = new Date()): DateRangeValue {
  const end = startOfDay(today);
  return { from: new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1)), to: end };
}
