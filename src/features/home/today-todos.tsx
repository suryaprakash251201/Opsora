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

  return (
    <Card accent={ACCENT}>
      <CardHeader className="relative">
        <CardTitle>
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          Today
          {today.length > 0 ? (
            <Badge variant="default">{today.length}</Badge>
          ) : null}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/todos">
            Open todos
            <ArrowUpRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="relative pt-0">
        <div className="flex flex-col">
          {today.length === 0 ? (
            <p className="text-subtle px-1 py-4 text-center text-xs">
              Nothing due today. Enjoy the calm.
            </p>
          ) : (
            today.slice(0, 6).map((todo) => {
              const priority = priorityMeta[todo.priority];
              return (
                <div
                  key={todo.id}
                  className="hover:bg-surface/50 -mx-1 flex items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors"
                >
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.status === "done"}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <label htmlFor={`todo-${todo.id}`} className="min-w-0 flex-1 truncate text-[13px] cursor-pointer">
                    {todo.title}
                  </label>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      priority.dot,
                    )}
                    title={priority.label}
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="relative mt-2">
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
            placeholder="Add a task for today…"
            className="h-8 pl-8 text-xs"
            aria-label="Add a task for today"
          />
        </div>
      </CardContent>
    </Card>
  );
}