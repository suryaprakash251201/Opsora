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

  return (
    <div
      className={cn(
        "group border-border/60 bg-panel flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        done && "opacity-60",
      )}
    >
      <Checkbox
        className="mt-0.5"
        checked={done}
        onCheckedChange={() => toggleTodo(todo.id)}
        aria-label={done ? "Mark as open" : "Mark as done"}
      />

      <button
        type="button"
        onClick={() => onEdit(todo)}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            "block truncate text-[13px] font-medium",
            done && "line-through",
          )}
        >
          {todo.title}
        </span>
        {todo.description ? (
          <span className="text-subtle mt-0.5 line-clamp-1 block text-xs">
            {todo.description}
          </span>
        ) : null}
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            <span className={cn("size-1.5 rounded-full", priority.dot)} />
            {priority.label}
          </Badge>
          {todo.project ? (
            <Badge variant="default">{todo.project}</Badge>
          ) : null}
          {todo.dueDate ? (
            <Badge variant={overdue ? "danger" : "outline"}>
              {overdue ? "Overdue · " : ""}
              {formatDayLabel(todo.dueDate)}
            </Badge>
          ) : null}
          {todo.status !== "inbox" && !done ? (
            <Badge variant="info">{statusLabels[todo.status]}</Badge>
          ) : null}
          {todo.tags.map((tag) => (
            <Badge key={tag} variant="outline">
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
            className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Task actions"
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(todo)}>
            <Pencil />
            Edit
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
            <Trash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
