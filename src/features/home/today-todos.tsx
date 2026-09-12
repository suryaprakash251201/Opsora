"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { isToday, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTodoStore } from "@/features/todos/store";
import { priorityMeta } from "@/features/todos/types";
import { cn } from "@/lib/utils";

const ACCENT = "var(--accent-todos)";

export function TodayTodos() {
  const todos = useTodoStore((state) => state.todos);
  const addTodo = useTodoStore((state) => state.addTodo);
  const toggleTodo = useTodoStore((state) => state.toggleTodo);
  const [draft, setDraft] = useState("");

  const today = todos
    .filter(
      (todo) =>
        todo.status !== "done" &&
        (todo.status === "today" ||
          (todo.dueDate && isToday(parseISO(todo.dueDate)))),
    )
    .sort(
      (a, b) =>
        priorityMeta[a.priority].rank - priorityMeta[b.priority].rank,
    );

  const submit = () => {
    if (!draft.trim()) return;
    addTodo({ title: draft, status: "today" });
    setDraft("");
  };

  const completedCount = todos.filter(
    (t) =>
      t.status === "done" &&
      ((t.completedAt && isToday(parseISO(t.completedAt))) ||
        (t.dueDate && isToday(parseISO(t.dueDate)))),
  ).length;
  const totalCount = today.length + completedCount;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card accent={ACCENT}>
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full"
            style={{
              background: ACCENT,
              boxShadow: `0 0 8px ${ACCENT}`,
            }}
          />
          Today&apos;s Focus
          {today.length > 0 ? (
            <Badge variant="default" className="text-[11px] font-semibold px-2">
              {today.length} open
            </Badge>
          ) : null}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <Link href="/todos">
            All tasks
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="relative pt-0">
        {totalCount > 0 ? (
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <span className="text-subtle text-[11px]">Daily progress</span>
            <div className="flex items-center gap-2">
              <div className="bg-surface h-1.5 w-24 overflow-hidden rounded-full border border-border/60">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: ACCENT,
                  }}
                />
              </div>
              <span className="metrics text-subtle text-[11px] font-semibold">{progress}%</span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          {today.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-center">
              <p className="text-muted text-xs font-medium">Nothing due today</p>
              <p className="text-subtle mt-0.5 text-[11px]">Add a quick task below to get going.</p>
            </div>
          ) : (
            today.slice(0, 6).map((todo) => {
              const priority = priorityMeta[todo.priority];
              return (
                <div
                  key={todo.id}
                  className="hover:bg-surface/60 group flex items-center gap-2.5 rounded-lg p-1.5 transition-colors"
                >
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.status === "done"}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="size-4"
                  />
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground cursor-pointer transition-colors group-hover:text-foreground"
                  >
                    {todo.title}
                  </label>
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      priority.dot,
                    )}
                    title={`Priority: ${priority.label}`}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="relative mt-3">
          <Plus
            className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5 -translate-y-1/2"
            style={{ color: ACCENT }}
          />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Quick add task… (Enter)"
            className="h-8.5 pl-8 text-xs rounded-lg border-border/80 bg-panel/80 focus-visible:border-border-strong shadow-2xs"
            aria-label="Add a task for today"
          />
        </div>
      </CardContent>
    </Card>
  );
}