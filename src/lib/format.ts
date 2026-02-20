/**
 * Stable date/time formatting so server and client render the same string (avoids hydration mismatch).
 * Uses UTC and fixed locale so output is deterministic.
 */
const EN_US = "en-US";

export function formatDateTime(isoOrTimestamp: string | number): string {
  const date = new Date(isoOrTimestamp);
  return date.toLocaleString(EN_US, {
    timeZone: "UTC",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatTime(isoOrTimestamp: string | number): string {
  const date = new Date(isoOrTimestamp);
  return date.toLocaleTimeString(EN_US, {
    timeZone: "UTC",
    timeStyle: "short",
  });
}
