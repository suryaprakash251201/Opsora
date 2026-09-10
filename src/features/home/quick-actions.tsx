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
  accent: string;
}

function Action({ href, onClick, icon: Icon, label, accent }: ActionProps) {
  const content = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, ${accent} 25%, transparent), transparent 70%)`,
        }}
      />
      <Icon
        className="relative size-4 transition-transform group-hover:scale-110"
        style={{ color: accent }}
      />
      <span className="relative text-xs">{label}</span>
    </>
  );

  if (href) {
    return (
      <Button
        variant="secondary"
        className="group relative h-16 flex-col gap-1.5 overflow-hidden"
        asChild
      >
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      className="group relative h-16 flex-col gap-1.5 overflow-hidden"
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
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 pt-0">
        <Action
          onClick={() => openTodoDialog()}
          icon={ListPlus}
          label="New todo"
          accent="var(--accent-todos)"
        />
        <Action
          href="/calendar"
          icon={CalendarPlus}
          label="Calendar"
          accent="var(--accent-calendar)"
        />
        <Action
          onClick={() => {
            void queryClient.invalidateQueries();
          }}
          icon={RefreshCw}
          label="Refresh"
          accent="var(--accent-analytics)"
        />
      </CardContent>
    </Card>
  );
}
