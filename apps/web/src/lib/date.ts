import { format, fromUnixTime } from "date-fns";

/** "March 14, 2026" — navbar latest-data label */
export function formatDateLong(unixSeconds: number): string {
  return format(fromUnixTime(unixSeconds), "MMMM d, yyyy");
}

/** "Mar 14, 2026" — chart tooltip */
export function formatDateShort(unixSeconds: number): string {
  return format(fromUnixTime(unixSeconds), "MMM d, yyyy");
}

/** "2026" — chart x-axis ticks */
export function formatYear(unixSeconds: number): string {
  return format(fromUnixTime(unixSeconds), "yyyy");
}
