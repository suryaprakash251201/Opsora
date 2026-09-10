import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Severity } from "@/lib/attention/types";

interface SeverityMeta {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
  icon: LucideIcon;
  rank: number;
}

export const severityMeta: Record<Severity, SeverityMeta> = {
  critical: {
    label: "Critical",
    text: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/25",
    dot: "bg-danger",
    icon: TriangleAlert,
    rank: 0,
  },
  warning: {
    label: "Warning",
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/25",
    dot: "bg-warning",
    icon: CircleAlert,
    rank: 1,
  },
  info: {
    label: "Info",
    text: "text-info",
    bg: "bg-info/10",
    border: "border-info/25",
    dot: "bg-info",
    icon: Info,
    rank: 2,
  },
  success: {
    label: "Success",
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/25",
    dot: "bg-success",
    icon: CircleCheck,
    rank: 3,
  },
};

export const severityOrder = (
  a: Severity,
  b: Severity,
): number => severityMeta[a].rank - severityMeta[b].rank;
