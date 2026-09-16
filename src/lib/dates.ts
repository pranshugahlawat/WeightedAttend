import { format } from "date-fns";

export function toISODateUTC(d: Date) {
  // store/display as YYYY-MM-DD
  return format(d, "yyyy-MM-dd");
}

export function parseISODateUTC(s: string) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd));
}

export function weekday0Sun(date: Date) {
  return date.getUTCDay(); // 0..6
}