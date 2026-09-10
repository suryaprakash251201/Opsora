import {
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  Container,
  House,
  ListTodo,
  Server,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/github";

export type NavAccent =
  | "home"
  | "todos"
  | "calendar"
  | "github"
  | "docker"
  | "servers"
  | "pihole"
  | "alerts"
  | "analytics"
  | "settings";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | typeof GitHubIcon;
  shortcut?: string;
  accent: NavAccent;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/", label: "Home", icon: House, shortcut: "H", accent: "home" },
      { href: "/todos", label: "Todos", icon: ListTodo, shortcut: "T", accent: "todos" },
      {
        href: "/calendar",
        label: "Calendar",
        icon: CalendarDays,
        shortcut: "C",
        accent: "calendar",
      },
    ],
  },
  {
    label: "DevOps",
    items: [
      {
        href: "/github",
        label: "GitHub",
        icon: GitHubIcon,
        shortcut: "G",
        accent: "github",
      },
      {
        href: "/docker",
        label: "Docker",
        icon: Container,
        shortcut: "D",
        accent: "docker",
      },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      {
        href: "/servers",
        label: "Servers",
        icon: Server,
        shortcut: "S",
        accent: "servers",
      },
      {
        href: "/pihole",
        label: "Pi-hole",
        icon: ShieldCheck,
        shortcut: "P",
        accent: "pihole",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/analytics",
        label: "Analytics",
        icon: ChartNoAxesColumn,
        accent: "analytics",
      },
      {
        href: "/alerts",
        label: "Alerts",
        icon: Bell,
        shortcut: "A",
        accent: "alerts",
      },
    ],
  },
];

export const bottomNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings, accent: "settings" },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Resolve an accent token to its CSS variable. */
export const accentVar: Record<NavAccent, string> = {
  home: "var(--accent-home)",
  todos: "var(--accent-todos)",
  calendar: "var(--accent-calendar)",
  github: "var(--accent-github)",
  docker: "var(--accent-docker)",
  servers: "var(--accent-servers)",
  pihole: "var(--accent-pihole)",
  alerts: "var(--accent-alerts)",
  analytics: "var(--accent-analytics)",
  settings: "var(--accent-settings)",
};
