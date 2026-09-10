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

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon | typeof GitHubIcon;
  shortcut?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/", label: "Home", icon: House, shortcut: "H" },
      { href: "/todos", label: "Todos", icon: ListTodo, shortcut: "T" },
      { href: "/calendar", label: "Calendar", icon: CalendarDays, shortcut: "C" },
    ],
  },
  {
    label: "DevOps",
    items: [
      { href: "/github", label: "GitHub", icon: GitHubIcon, shortcut: "G" },
      { href: "/docker", label: "Docker", icon: Container, shortcut: "D" },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { href: "/servers", label: "Servers", icon: Server, shortcut: "S" },
      { href: "/pihole", label: "Pi-hole", icon: ShieldCheck, shortcut: "P" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumn },
      { href: "/alerts", label: "Alerts", icon: Bell, shortcut: "A" },
    ],
  },
];

export const bottomNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
