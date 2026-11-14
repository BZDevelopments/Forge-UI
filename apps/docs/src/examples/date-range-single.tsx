import { useState } from "react";
import { DateRangePicker } from "@forge-ui/date-range-picker";

const locales = [
  { tag: "en-US", name: "English (US)" },
  { tag: "de-DE", name: "Deutsch" },
  { tag: "ja-JP", name: "日本語" },
  { tag: "ar-EG", name: "العربية" },
];

export default function DateRangeSingle() {
  const [locale, setLocale] = useState("en-US");
  const [date, setDate] = useState<Date | null>(null);
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        Language
        <select
          className="forge-input w-auto"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
        >
          {locales.map((l) => (
            <option key={l.tag} value={l.tag}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <DateRangePicker
        mode="single"
        aria-label="Due date"
        locale={locale}
        value={date}
        onValueChange={setDate}
        // No weekends.
        disabledDates={(d) => d.getDay() === 0 || d.getDay() === 6}
        dateFormat={{ dateStyle: "full" }}
        clearable
      />
    </div>
  );
}
