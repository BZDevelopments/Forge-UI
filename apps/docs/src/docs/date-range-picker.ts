import type { ComponentDoc } from "./types";
import basic from "../examples/date-range-basic.tsx?raw";
import booking from "../examples/date-range-booking.tsx?raw";
import single from "../examples/date-range-single.tsx?raw";
import DateRangeBasic from "../examples/date-range-basic";
import DateRangeBooking from "../examples/date-range-booking";
import DateRangeSingle from "../examples/date-range-single";

export const dateRangePicker: ComponentDoc = {
  slug: "date-range-picker",
  name: "Date-range picker",
  pkg: "date-range-picker",
  summary:
    "A date and date-range picker with min and max dates, disabled dates, range length limits, presets, month and year navigation, and full localization through Intl. No date library required.",
  keywords: ["date", "range", "calendar", "picker", "datepicker", "booking", "locale"],
  whenToUse: [
    "People choose a single date or a start and end date: reports, bookings, filters, deadlines.",
  ],
  usage: `import { DateRangePicker } from "@forge-ui/date-range-picker";

<DateRangePicker aria-label="Reporting period" value={range} onValueChange={setRange} />
<DateRangePicker mode="single" aria-label="Due date" value={date} onValueChange={setDate} />`,
  examples: [
    {
      id: "range",
      title: "Range with presets and a maximum date",
      description:
        "Pick a start, then an end (hover previews the range). Presets complete the range in one click. Incomplete selections are discarded when the calendar closes.",
      Component: DateRangeBasic,
      code: basic,
    },
    {
      id: "booking",
      title: "Constraints",
      description:
        "Minimum date, a disabled date, and a 2 to 7 night limit. Ranges that cross a blocked date are refused with an announced message.",
      Component: DateRangeBooking,
      code: booking,
    },
    {
      id: "single",
      title: "Single date and localization",
      description:
        "Month names, weekday names, the first day of the week, and the formatted value all follow the locale. A predicate disables weekends.",
      Component: DateRangeSingle,
      code: single,
    },
  ],
  api: [
    {
      title: "Shared props",
      rows: [
        {
          name: "mode",
          type: '"range" | "single"',
          default: '"range"',
          description:
            "Changes the value type. Range value is `{ from, to }` with `Date | null`; single is `Date | null`.",
        },
        {
          name: "value / defaultValue / onValueChange",
          type: "DateRangeValue | Date | null",
          description:
            "Controlled or uncontrolled. In range mode the callback fires when a range is complete or cleared.",
        },
        {
          name: "minDate / maxDate",
          type: "Date",
          description: "Inclusive bounds. Navigation stops at the bounds.",
        },
        {
          name: "disabledDates",
          type: "Date[] | (date) => boolean",
          description: "Dates that cannot be chosen.",
        },
        {
          name: "locale",
          type: "string",
          description: "BCP 47 tag. Defaults to the browser language.",
        },
        {
          name: "weekStartsOn",
          type: "0–6",
          description: "0 is Sunday. Defaults to the locale's first day of the week.",
        },
        {
          name: "formatDate / dateFormat",
          type: "(date, locale) => string / Intl.DateTimeFormatOptions",
          description: "Customize how dates read in the trigger.",
        },
        {
          name: "labels",
          type: "Partial<DatePickerLabels>",
          description: "Every piece of UI text, for translation.",
        },
        {
          name: "months",
          type: "1 | 2",
          description: "Visible months. Defaults to 2 for ranges on wide screens, 1 otherwise.",
        },
        { name: "clearable", type: "boolean", description: "Adds a clear button." },
        {
          name: "name",
          type: "string",
          description:
            "Posts ISO dates with a native form: `name` (single), or `name_from` and `name_to` (range).",
        },
        {
          name: "invalid",
          type: "boolean",
          description: "Styles the trigger as invalid. Also link an error with `aria-describedby`.",
        },
        {
          name: "today",
          type: "Date",
          description: "Override “today” for tests or server rendering.",
        },
        {
          name: "open / defaultOpen / onOpenChange",
          type: "boolean",
          description: "Controlled or uncontrolled popup.",
        },
        { name: "footer", type: "ReactNode", description: "Content under the calendar." },
      ],
    },
    {
      title: "Range-only props",
      rows: [
        {
          name: "presets",
          type: "{ label, value: DateRangeValue }[]",
          description: "Shortcut buttons. `lastNDays(n)` builds a common range.",
        },
        {
          name: "minRangeDays / maxRangeDays",
          type: "number",
          description: "Length limits, counting both ends.",
        },
      ],
    },
    {
      title: "Utilities",
      rows: [
        {
          name: "Calendar",
          type: "component",
          description: "The accessible month grid on its own, fully controlled.",
        },
        {
          name: "toISODate / parseISODate / addDays / addMonths / isSameDay …",
          type: "functions",
          description: "Local-time date helpers. `parseISODate` rejects impossible dates.",
        },
      ],
    },
  ],
  keyboard: [
    { keys: "← / →", action: "Previous or next day." },
    { keys: "↑ / ↓", action: "Previous or next week." },
    { keys: "Home / End", action: "Start or end of the week." },
    { keys: "Page Up / Page Down", action: "Previous or next month." },
    { keys: "Shift+Page Up / Page Down", action: "Previous or next year." },
    { keys: "Enter / Space", action: "Choose the focused date." },
    { keys: "Escape", action: "Close and return focus to the trigger." },
  ],
  accessibility: [
    "Follows the WAI-ARIA date picker dialog pattern: a named dialog, a grid with one tab stop, and roving focus between days.",
    "Each day is a button with its full date as the name (“Monday, March 3, 2025”), plus “today”, “start of range”, or “end of range” where relevant.",
    "Month and year selects are labelled, so people can jump without paging.",
    "Range progress, completed ranges, and rejected ranges are announced. Disabled dates are marked `aria-disabled` and also struck through, not only dimmed.",
  ],
  customization: [
    "Override `.forge-cal-*` and `.forge-dp-*` classes, or the `--forge-*` variables.",
    "Translate every string through `labels`, and format dates with `formatDate` or `dateFormat`.",
  ],
  mistakes: [
    "Passing UTC midnight dates. The picker works in local time, so build dates with `new Date(y, m, d)` or `parseISODate`.",
    "Treating `onValueChange` as fired on the first click in range mode. It fires when the range is complete.",
    "Relying on `disabledDates` for security. Validate dates on the server too.",
  ],
};
