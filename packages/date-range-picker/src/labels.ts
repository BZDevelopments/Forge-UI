import type { DatePickerLabels } from "./types";

export const defaultLabels: DatePickerLabels = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  month: "Month",
  year: "Year",
  clear: "Clear dates",
  dialog: "Choose dates",
  placeholderSingle: "Select a date",
  placeholderRange: "Select dates",
  rangeStart: "start of range",
  rangeEnd: "end of range",
  today: "today",
  chooseEnd: (start) => `Start date ${start}. Choose an end date.`,
  rangeTooShort: (min) => `Choose at least ${min} ${min === 1 ? "day" : "days"}.`,
  rangeTooLong: (max) => `Choose at most ${max} ${max === 1 ? "day" : "days"}.`,
  rangeBlocked: "That range includes dates that are not available.",
  separator: "–",
};
