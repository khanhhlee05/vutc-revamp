/** All event times are entered and displayed in Villanova's time zone. */
export const APP_TIME_ZONE = "America/New_York";

function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asIfUtc - date.getTime();
}

/**
 * Converts a wall-clock date ("YYYY-MM-DD") and time ("HH:mm") in the given
 * zone to an instant. Handles DST by re-evaluating the offset once.
 */
export function zonedToUtc(
  date: string,
  time: string,
  timeZone: string = APP_TIME_ZONE,
): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  const first = new Date(naive - tzOffsetMs(new Date(naive), timeZone));
  const second = new Date(naive - tzOffsetMs(first, timeZone));
  return second;
}

/** "YYYY-MM-DD" of an instant in the app zone. */
export function toZonedDateString(
  date: Date,
  timeZone: string = APP_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Today's date string in the app zone. */
export function todayString(now: Date = new Date()): string {
  return toZonedDateString(now);
}

/** Adds whole days to a "YYYY-MM-DD" string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
