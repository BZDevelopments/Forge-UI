import { useState } from "react";
import { DateRangePicker, lastNDays, type DateRangeValue } from "@forge-ui/date-range-picker";

export default function DateRangeBasic() {
  const [range, setRange] = useState<DateRangeValue>({ from: null, to: null });
  const today = new Date();
  return (
    <div className="space-y-3">
      <DateRangePicker
        aria-label="Reporting period"
        value={range}
        onValueChange={setRange}
        clearable
        maxDate={today}
        presets={[
          { label: "Last 7 days", value: lastNDays(7) },
          { label: "Last 30 days", value: lastNDays(30) },
          { label: "Last 90 days", value: lastNDays(90) },
        ]}
        name="period"
      />
      <p className="text-sm text-forge-muted">
        {range.from && range.to
          ? `${range.from.toDateString()} to ${range.to.toDateString()}`
          : "No range chosen"}
      </p>
    </div>
  );
}
