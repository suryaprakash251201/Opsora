"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ListPlus, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

interface ActionProps {
  href?: string;
  onClick?: () => void;
  icon: typeof ListPlus;
  label: string;
  shortcut?: string;
  accent: string;
}

function Action({ href, onClick, icon: Icon, label, shortcut, accent }: ActionProps) {
  const content = (
    <>
      <span
        className="flex size-7 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-110"
        style={{
          background: `color-mix(in oklab, ${accent} 16%, transparent)`,
          borderColor: `color-mix(in oklab, ${accent} 30%, transparent)`,
          color: accent,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 20%, transparent)`,
        }}
      >
        <Icon className="size-3.5" strokeWidth={2.2} />
      </span>
      <span className="text-xs font-semibold text-foreground tracking-tight">{label}</span>
      {shortcut ? (
        <kbd className="text-subtle group-hover:text-muted rounded border border-border/60 bg-surface/60 px-1 font-mono text-[9px]">
          {shortcut}
        </kbd>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Button
        variant="secondary"
        className="kpi-card group relative h-20 flex-col justify-center gap-1.5 overflow-hidden rounded-xl border border-border/75 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong"
        asChild
      >
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      className="kpi-card group relative h-20 flex-col justify-center gap-1.5 overflow-hidden rounded-xl border border-border/75 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong"
      onClick={onClick}
    >
      {content}
    </Button>
  );
}

export function QuickActions() {
  const queryClient = useQueryClient();
  const openTodoDialog = useUiStore((state) => state.openTodoDialog);

  return (
    <Card>
      <CardHeader className="pb-2.5">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-subtle">
          Quick actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2.5 pt-0">
        <Action
          onClick={() => openTodoDialog()}
          icon={ListPlus}
          label="New task"
          shortcut="N"
          accent="var(--accent-todos)"
        />
        <Action
          href="/calendar"
          icon={CalendarPlus}
          label="Calendar"
          shortcut="C"
          accent="var(--accent-calendar)"
        />
        <Action
          onClick={() => {
            void queryClient.invalidateQueries();
          }}
          icon={RefreshCw}
          label="Refresh"
          shortcut="R"
          accent="var(--accent-analytics)"
        />
      </CardContent>
    </Card>
  );
}