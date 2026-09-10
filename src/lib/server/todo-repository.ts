import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Todo, TodoPriority, TodoStatus } from "@/features/todos/types";

export interface TodoSnapshot {
  todos: Todo[];
  updatedAt: string | null;
}

export interface TodoRepository {
  read(): Promise<TodoSnapshot>;
  replace(todos: Todo[]): Promise<{ updatedAt: string }>;
  readonly kind: "sqlite" | "json";
}

const TODO_STATUSES: TodoStatus[] = [
  "inbox",
  "today",
  "in_progress",
  "waiting",
  "done",
];

const TODO_PRIORITIES: TodoPriority[] = ["critical", "high", "medium", "low"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function toTodo(value: unknown): Todo | null {
  if (!isRecord(value)) return null;

  const id = text(value.id);
  const title = text(value.title);
  if (!id || !title) return null;

  const status = TODO_STATUSES.includes(value.status as TodoStatus)
    ? (value.status as TodoStatus)
    : "inbox";
  const priority = TODO_PRIORITIES.includes(value.priority as TodoPriority)
    ? (value.priority as TodoPriority)
    : "medium";

  return {
    id,
    title,
    description: text(value.description),
    status,
    priority,
    dueDate: text(value.dueDate),
    project: text(value.project),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    createdAt: text(value.createdAt) ?? new Date().toISOString(),
    completedAt: text(value.completedAt),
  };
}

export function normalizeTodoList(input: unknown): Todo[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(toTodo)
    .filter((todo): todo is Todo => todo !== null)
    .slice(0, 500);
}

function dataDir(): string {
  return process.env.OPSORA_DATA_DIR ?? path.join(process.cwd(), ".data");
}

/* ------------------------------------------------------------------ */
/* SQLite                                                              */
/* ------------------------------------------------------------------ */

export function createSqliteRepository(file: string): TodoRepository {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);

  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      position INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return {
    kind: "sqlite",
    async read() {
      const rows = db
        .prepare("SELECT data FROM todos ORDER BY position ASC")
        .all() as { data: string }[];

      const meta = db
        .prepare("SELECT value FROM meta WHERE key = 'updated_at'")
        .get() as { value: string } | undefined;

      return {
        todos: normalizeTodoList(
          rows.map((row) => {
            try {
              return JSON.parse(row.data);
            } catch {
              return null;
            }
          }),
        ),
        updatedAt: meta?.value ?? null,
      };
    },
    async replace(todos) {
      const updatedAt = new Date().toISOString();

      db.exec("BEGIN");
      try {
        db.exec("DELETE FROM todos");
        const insert = db.prepare(
          "INSERT INTO todos (id, data, position) VALUES (?, ?, ?)",
        );
        todos.forEach((todo, index) => {
          insert.run(todo.id, JSON.stringify(todo), index);
        });
        db.prepare(
          "INSERT INTO meta (key, value) VALUES ('updated_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        ).run(updatedAt);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }

      return { updatedAt };
    },
  };
}

/* ------------------------------------------------------------------ */
/* JSON fallback (used if SQLite is unavailable)                       */
/* ------------------------------------------------------------------ */

export function createJsonRepository(file: string): TodoRepository {
  mkdirSync(path.dirname(file), { recursive: true });

  return {
    kind: "json",
    async read() {
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8")) as {
          todos?: unknown;
          updatedAt?: unknown;
        };
        return {
          todos: normalizeTodoList(parsed.todos),
          updatedAt:
            typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
        };
      } catch {
        return { todos: [], updatedAt: null };
      }
    },
    async replace(todos) {
      const updatedAt = new Date().toISOString();
      const temporary = `${file}.tmp`;
      writeFileSync(
        temporary,
        JSON.stringify({ todos, updatedAt }, null, 2),
        "utf8",
      );
      renameSync(temporary, file);
      return { updatedAt };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Singleton                                                           */
/* ------------------------------------------------------------------ */

let repository: TodoRepository | null = null;

export function getTodoRepository(): TodoRepository {
  if (repository) return repository;

  const dir = dataDir();
  try {
    repository = createSqliteRepository(path.join(dir, "opsora.db"));
  } catch {
    repository = createJsonRepository(path.join(dir, "todos.json"));
  }

  return repository;
}
