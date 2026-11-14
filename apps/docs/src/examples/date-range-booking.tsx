import { DateRangePicker } from "@forge-ui/date-range-picker";

const today = new Date();
const booked = [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6)];

export default function DateRangeBooking() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-forge-muted">
        Stays are 2 to 7 nights, start today or later, and one date is already booked.
      </p>
      <DateRangePicker
        aria-label="Check-in and check-out"
        placeholder="Add dates"
        minDate={today}
        disabledDates={booked}
        minRangeDays={2}
        maxRangeDays={7}
        labels={{
          rangeTooShort: (min) => `Stay at least ${min} nights.`,
          rangeTooLong: (max) => `Stay at most ${max} nights.`,
        }}
      />
    </div>
  );
}
