import type { ReactNode } from "react";

export interface DateRangeValue {
  from: Date | null;
  to: Date | null;
}

export interface DatePickerLabels {
  previousMonth: string;
  nextMonth: string;
  month: string;
  year: string;
  clear: string;
  /** Accessible name of the calendar popup. */
  dialog: string;
  placeholderSingle: string;
  placeholderRange: string;
  rangeStart: string;
  rangeEnd: string;
  today: string;
  /** Spoken after the first click in range mode. */
  chooseEnd: (start: string) => string;
  /** Spoken when a range cannot be completed. */
  rangeTooShort: (min: number) => string;
  rangeTooLong: (max: number) => string;
  rangeBlocked: string;
  separator: string;
}

export interface DateRangePreset {
  label: string;
  value: DateRangeValue;
}

export interface DatePickerCommonProps {
  /** BCP 47 tag used for month names, weekday names, week start, and formatting. Defaults to the browser locale. */
  locale?: string;
  minDate?: Date;
  maxDate?: Date;
  /** Dates that cannot be chosen: an array of dates or a predicate. */
  disabledDates?: Date[] | ((date: Date) => boolean);
  /** 0 = Sunday ... 6 = Saturday. Defaults to the locale's first day of the week. */
  weekStartsOn?: number;
  /** Override how dates read in the trigger. */
  formatDate?: (date: Date, locale: string) => string;
  /** Intl options used when `formatDate` is not provided. Defaults to a medium date. */
  dateFormat?: Intl.DateTimeFormatOptions;
  labels?: Partial<DatePickerLabels>;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  /** 1 or 2 visible months. Defaults to 2 for ranges on wide screens, otherwise 1. */
  months?: 1 | 2;
  /** Replace "today", for tests and server rendering. */
  today?: Date;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Posts ISO dates with a native form. Range mode adds `<name>_from` and `<name>_to`. */
  name?: string;
  id?: string;
  /**
   * Styles the trigger as invalid. A button cannot carry `aria-invalid`, so also point
   * `aria-describedby` at the error message to tell screen reader users.
   */
  invalid?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  className?: string;
  /** Extra content under the calendar, such as a hint or an apply button. */
  footer?: ReactNode;
}

export interface SingleDatePickerProps extends DatePickerCommonProps {
  mode: "single";
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
}

export interface RangeDatePickerProps extends DatePickerCommonProps {
  mode?: "range";
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onValueChange?: (value: DateRangeValue) => void;
  /** Shortcut buttons such as "Last 7 days". */
  presets?: DateRangePreset[];
  /** Minimum and maximum length of a range, in days (inclusive of both ends). */
  minRangeDays?: number;
  maxRangeDays?: number;
}

export type DateRangePickerProps = SingleDatePickerProps | RangeDatePickerProps;
