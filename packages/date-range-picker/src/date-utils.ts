/** Calendar math in local time. Every function returns a new Date at local midnight. */

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

/** Adds months and clamps the day, so Jan 31 plus one month is Feb 28 or 29. */
export function addMonths(date: Date, amount: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  target.setDate(Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth())));
  return target;
}

export const isSameDay = (a: Date | null | undefined, b: Date | null | undefined): boolean =>
  Boolean(a && b) &&
  a!.getFullYear() === b!.getFullYear() &&
  a!.getMonth() === b!.getMonth() &&
  a!.getDate() === b!.getDate();

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** Negative when `a` is before `b`, ignoring time of day. */
export const compareDays = (a: Date, b: Date): number =>
  startOfDay(a).getTime() - startOfDay(b).getTime();

export const isBefore = (a: Date, b: Date): boolean => compareDays(a, b) < 0;
export const isAfter = (a: Date, b: Date): boolean => compareDays(a, b) > 0;

export function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (min && isBefore(date, min)) return startOfDay(min);
  if (max && isAfter(date, max)) return startOfDay(max);
  return startOfDay(date);
}

/** Inclusive number of calendar days between two dates, immune to daylight-saving shifts. */
export function differenceInDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / 86_400_000);
}

export function startOfWeek(date: Date, weekStartsOn: number): Date {
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -diff);
}

export const endOfWeek = (date: Date, weekStartsOn: number): Date =>
  addDays(startOfWeek(date, weekStartsOn), 6);

/** `YYYY-MM-DD` in local time, for form posts and APIs. */
export function toISODate(date: Date): string {
  const pad = (n: number, size = 2) => String(n).padStart(size, "0");
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Strict parser for `YYYY-MM-DD`. Returns `null` for anything else, including impossible dates like Feb 30. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
}

/** First day of the week for a locale (0 = Sunday ... 6 = Saturday), using Intl where the browser supports it. */
export function getWeekStart(locale: string): number {
  try {
    const intl = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const info = intl.getWeekInfo?.() ?? intl.weekInfo;
    if (info) return info.firstDay % 7;
    const region = intl.maximize().region;
    return region === "US" ||
      region === "CA" ||
      region === "JP" ||
      region === "BR" ||
      region === "IL" ||
      region === "IN"
      ? 0
      : 1;
  } catch {
    return 0;
  }
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
export function formatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let cached = formatterCache.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, cached);
  }
  return cached;
}

export const formatDate = (
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string => formatter(locale, options).format(date);

/** Every day from `from` to `to`, inclusive. */
export function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  for (let d = startOfDay(from); !isAfter(d, to); d = addDays(d, 1)) days.push(d);
  return days;
}
