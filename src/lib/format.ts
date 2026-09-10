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

export function timeAgo(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy");
}

export function formatDayLabel(iso: string): string {
  const date = parseISO(iso);
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
