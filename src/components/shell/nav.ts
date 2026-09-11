import type { ComponentType } from "react";
import {
  LiveAnalytics,
  LiveBell,
  LiveCalendar,
  LiveDocker,
  LiveGithub,
  LiveHome,
  LiveServer,
  LiveSettings,
  LiveShield,
  LiveTodo,
  type LiveIconProps,
} from "@/components/icons/live";

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

/** Any icon the shell can render — live animated icons or lucide icons. */
export type NavIcon = ComponentType<LiveIconProps>;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
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
      { href: "/", label: "Home", icon: LiveHome, shortcut: "H", accent: "home" },
      { href: "/todos", label: "Todos", icon: LiveTodo, shortcut: "T", accent: "todos" },
      {
        href: "/calendar",
        label: "Calendar",
        icon: LiveCalendar,
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
        icon: LiveGithub,
        shortcut: "G",
        accent: "github",
      },
      {
        href: "/docker",
        label: "Docker",
        icon: LiveDocker,
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
        icon: LiveServer,
        shortcut: "S",
        accent: "servers",
      },
      {
        href: "/pihole",
        label: "Pi-hole",
        icon: LiveShield,
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
        icon: LiveAnalytics,
        accent: "analytics",
      },
      {
        href: "/alerts",
        label: "Alerts",
        icon: LiveBell,
        shortcut: "A",
        accent: "alerts",
      },
    ],
  },
];

export const bottomNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: LiveSettings, accent: "settings" },
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

/** Pathname → nav item, used by the topbar to show the current page. */
export function navItemForPath(pathname: string): NavItem | undefined {
  const all = [...navGroups.flatMap((g) => g.items), ...bottomNav];
  return all.find((item) => isActivePath(pathname, item.href));
}
