export type SourceId =
  | "servers"
  | "github"
  | "pihole"
  | "docker"
  | "calendar"
  | "todos";

export type Severity = "critical" | "warning" | "info" | "success";

export interface AttentionItem {
  id: string;
  source: SourceId;
  severity: Severity;
  title: string;
  detail?: string;
  href: string;
  score: number;
  createdAt: string;
  /** Short label for where it came from, e.g. "atlas", "cloud-dock" */
  context?: string;
  /** Short right-aligned value, e.g. "91%" */
  meta?: string;
}
