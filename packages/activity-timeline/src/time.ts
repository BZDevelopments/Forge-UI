const DAY = 86_400_000;

export function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayLabel(date: Date, now: Date, locale: string): string {
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / DAY);
  if (diff === 0 || diff === 1) {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const text = formatter.format(-diff, "day");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

export function relativeLabel(date: Date, now: Date, locale: string): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 45) return formatter.format(0, "second");
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return formatter.format(Math.round(seconds / 3600), "hour");
  if (abs < 86_400 * 30) return formatter.format(Math.round(seconds / 86_400), "day");
  if (abs < 86_400 * 365) return formatter.format(Math.round(seconds / (86_400 * 30)), "month");
  return formatter.format(Math.round(seconds / (86_400 * 365)), "year");
}

export const clockLabel = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);

export const fullLabel = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(date);
