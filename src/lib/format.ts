import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  parseISO,
} from "date-fns";

export function formatBytes(bytes: number, digits = 1): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent > 2 ? digits : 0)} ${units[exponent]}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  if (Math.abs(value) >= 10_000) {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en").format(value);
}

export function formatDuration(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Defensive `parseISO` — returns `null` for empty / invalid input instead of
 * throwing `RangeError: Invalid time value`. The formatter helpers below
 * fall back to a safe placeholder string when given `null`.
 */
function safeParseISO(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const parsed = parseISO(value);
    // date-fns returns an Invalid Date for malformed strings; detect it.
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function timeAgo(iso: string | null | undefined): string {
  const date = safeParseISO(iso);
  if (!date) return "—";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatTime(iso: string | null | undefined): string {
  const date = safeParseISO(iso);
  if (!date) return "—";
  return format(date, "HH:mm");
}

export function formatDate(iso: string | null | undefined): string {
  const date = safeParseISO(iso);
  if (!date) return "—";
  return format(date, "d MMM yyyy");
}

export function formatDayLabel(iso: string | null | undefined): string {
  const date = safeParseISO(iso);
  if (!date) return "—";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE d MMM");
}

export function formatClock(date: Date): string {
  return format(date, "HH:mm");
}

export function formatLongDate(date: Date): string {
  return format(date, "EEE d MMM");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toPercent(value: number, total: number, digits = 0): number {
  if (total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(digits));
}
