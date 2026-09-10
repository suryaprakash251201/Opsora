"use client";

import {
  CalendarDays,
  Container,
  ListTodo,
  Server,
  ShieldCheck,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/github";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSnapshot } from "@/hooks/use-snapshot";
import { timeAgo } from "@/lib/format";
import type { ActivityEvent } from "@/lib/mock/activity";

const sourceIcons = {
  github: GitHubIcon,
  docker: Container,
  pihole: ShieldCheck,
  servers: Server,
  calendar: CalendarDays,
  todos: ListTodo,
} as const;

const kindTone: Record<ActivityEvent["kind"], string> = {
  commit: "text-info",
  ci: "text-danger",
  deploy: "text-success",
  docker: "text-muted",
  dns: "text-warning",
  server: "text-muted",
  backup: "text-success",
  release: "text-success",
  todo: "text-muted",
};

export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const { data, isLoading } = useDashboardSnapshot();
  const events = (data?.activity ?? []).slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <ol className="relative flex flex-col gap-1">
            {events.map((event) => {
              const Icon = sourceIcons[event.source] ?? Server;
              return (
                <li
                  key={event.id}
                  className="flex items-start gap-2.5 rounded-md px-1 py-1.5"
                >
                  <Icon className="text-subtle mt-0.5 size-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">
                      {event.title}
                    </p>
                    {event.detail ? (
                      <p
                        className={`truncate text-[11px] ${kindTone[event.kind]}`}
                      >
                        {event.detail}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-subtle shrink-0 text-[11px]">
                    {timeAgo(event.at)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
