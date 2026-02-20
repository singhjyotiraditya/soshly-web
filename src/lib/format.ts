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

/** Relative time for chat, e.g. "20 mins", "1 hr", "Yesterday" */
export function formatRelativeTime(isoOrTimestamp: string | number): string {
  const date = new Date(isoOrTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatTime(isoOrTimestamp);
}
