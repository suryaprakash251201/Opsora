"use client";

import { isBefore, isToday, parseISO } from "date-fns";
import { EllipsisVertical, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTodoStore } from "@/features/todos/store";
import { priorityMeta, statusLabels, type Todo } from "@/features/todos/types";
import { formatDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const toggleTodo = useTodoStore((state) => state.toggleTodo);
  const deleteTodo = useTodoStore((state) => state.deleteTodo);
  const setStatus = useTodoStore((state) => state.setStatus);

  const done = todo.status === "done";
  const priority = priorityMeta[todo.priority];
  const overdue =
    !done && todo.dueDate && isBefore(parseISO(todo.dueDate), new Date()) &&
    !isToday(parseISO(todo.dueDate));

  const priorityColors: Record<typeof todo.priority, { line: string; glow: string; badge: string }> = {
    critical: { line: "var(--danger)", glow: "rgba(239, 68, 68, 0.4)", badge: "border-danger/30 bg-danger/10 text-danger" },
    high: { line: "var(--warning)", glow: "rgba(245, 158, 11, 0.4)", badge: "border-warning/30 bg-warning/10 text-warning" },
    medium: { line: "var(--info)", glow: "rgba(59, 130, 246, 0.4)", badge: "border-info/30 bg-info/10 text-info" },
    low: { line: "var(--subtle)", glow: "transparent", badge: "border-border text-muted" },
  };

  const pConfig = priorityColors[todo.priority];

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 rounded-xl border border-border/70 bg-panel/85 p-3 transition-all duration-200",
        "hover:border-border-strong hover:bg-surface/70 hover:shadow-xs",
        done && "opacity-50 hover:opacity-80 bg-panel/40",
      )}
    >
      {/* Priority accent pill on left */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 left-0 w-1 rounded-r-full transition-all duration-200",
          !done && todo.priority !== "low" ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        style={{
          background: pConfig.line,
          boxShadow: !done && todo.priority !== "low" ? `0 0 8px ${pConfig.glow}` : undefined,
        }}
      />

      <Checkbox
        className="mt-0.5 size-4 rounded-md transition-transform active:scale-90"
        checked={done}
        onCheckedChange={() => toggleTodo(todo.id)}
        aria-label={done ? "Mark as open" : "Mark as done"}
      />

      <button
        type="button"
        onClick={() => onEdit(todo)}
        className="min-w-0 flex-1 text-left cursor-pointer"
      >
        <span
          className={cn(
            "block truncate text-[13.5px] font-medium text-foreground tracking-tight transition-all",
            done && "line-through text-muted",
          )}
        >
          {todo.title}
        </span>
        {todo.description ? (
          <span className="text-subtle mt-0.5 line-clamp-1 block text-xs">
            {todo.description}
          </span>
        ) : null}
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("gap-1 text-[11px] font-semibold tracking-wide uppercase", pConfig.badge)}
          >
            <span
              className={cn("size-1.5 rounded-full")}
              style={{ background: pConfig.line }}
            />
            {priority.label}
          </Badge>
          {todo.project ? (
            <Badge
              variant="default"
              className="border-brand/30 bg-brand/10 text-brand text-[11px] font-medium"
            >
              {todo.project}
            </Badge>
          ) : null}
          {todo.dueDate ? (
            <Badge
              variant={overdue ? "danger" : "outline"}
              className={cn("text-[11px] font-medium", overdue && "border-danger/30 bg-danger/10 text-danger")}
            >
              {overdue ? "Overdue · " : ""}
              {formatDayLabel(todo.dueDate)}
            </Badge>
          ) : null}
          {todo.status !== "inbox" && !done ? (
            <Badge variant="info" className="text-[11px] font-medium">
              {statusLabels[todo.status]}
            </Badge>
          ) : null}
          {todo.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-border/60 bg-surface/50 text-[10px] text-subtle font-mono"
            >
              #{tag}
            </Badge>
          ))}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            aria-label="Task actions"
          >
            <EllipsisVertical className="size-4 text-muted" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => onEdit(todo)}>
            <Pencil className="size-3.5 mr-2" />
            Edit task
          </DropdownMenuItem>
          {!done ? (
            <DropdownMenuItem
              onSelect={() => {
                setStatus(todo.id, "done");
                toast.success("Task completed");
              }}
            >
              Mark as done
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setStatus(todo.id, "inbox")}>
              Reopen
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              deleteTodo(todo.id);
              toast.success("Task deleted");
            }}
          >
            <Trash className="size-3.5 mr-2 text-danger" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
