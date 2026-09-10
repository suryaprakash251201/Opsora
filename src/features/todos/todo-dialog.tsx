"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useTodoStore } from "@/features/todos/store";
import {
  TODO_PRIORITIES,
  TODO_STATUSES,
  type Todo,
  type TodoPriority,
  type TodoStatus,
} from "@/features/todos/types";

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  defaultStatus?: TodoStatus;
}

interface FormState {
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string;
  project: string;
  tags: string;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  status: "inbox",
  priority: "medium",
  dueDate: "",
  project: "",
  tags: "",
};

function formFromTodo(todo: Todo): FormState {
  return {
    title: todo.title,
    description: todo.description ?? "",
    status: todo.status,
    priority: todo.priority,
    dueDate: todo.dueDate ? format(parseISO(todo.dueDate), "yyyy-MM-dd") : "",
    project: todo.project ?? "",
    tags: todo.tags.join(", "),
  };
}

export function TodoDialog({
  open,
  onOpenChange,
  todo,
  defaultStatus = "inbox",
}: TodoDialogProps) {
  const addTodo = useTodoStore((state) => state.addTodo);
  const updateTodo = useTodoStore((state) => state.updateTodo);
  const deleteTodo = useTodoStore((state) => state.deleteTodo);
  const [form, setForm] = useState<FormState>(() =>
    todo ? formFromTodo(todo) : { ...emptyForm, status: defaultStatus },
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const title = form.title.trim();
    if (!title) {
      toast.error("A title is required");
      return;
    }

    const payload = {
      title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate
        ? new Date(`${form.dueDate}T00:00:00`).toISOString()
        : undefined,
      project: form.project,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (todo) {
      updateTodo(todo.id, payload);
      toast.success("Task updated");
    } else {
      addTodo(payload);
      toast.success("Task added");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{todo ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {todo
              ? "Update details, status, or priority."
              : "Capture it now, organise it later."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-muted text-xs">Title</span>
            <Input
              autoFocus
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="What needs doing?"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-muted text-xs">Description</span>
            <Textarea
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="Optional details, links, or acceptance criteria…"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-muted text-xs">Status</span>
              <Select
                value={form.status}
                onChange={(event) =>
                  set("status", event.target.value as TodoStatus)
                }
              >
                {TODO_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-muted text-xs">Priority</span>
              <Select
                value={form.priority}
                onChange={(event) =>
                  set("priority", event.target.value as TodoPriority)
                }
              >
                {TODO_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-muted text-xs">Due date</span>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => set("dueDate", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-muted text-xs">Project</span>
              <Input
                value={form.project}
                onChange={(event) => set("project", event.target.value)}
                placeholder="e.g. Homelab"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-muted text-xs">Tags</span>
            <Input
              value={form.tags}
              onChange={(event) => set("tags", event.target.value)}
              placeholder="Comma separated, e.g. ops, review"
            />
          </label>
        </div>

        <DialogFooter className="sm:justify-between">
          {todo ? (
            <Button
              variant="destructive"
              onClick={() => {
                deleteTodo(todo.id);
                toast.success("Task deleted");
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{todo ? "Save" : "Add task"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
