import {
  getTodoRepository,
  normalizeTodoList,
} from "@/lib/server/todo-repository";

export async function GET() {
  const repository = getTodoRepository();
  const snapshot = await repository.read();

  return Response.json({ ...snapshot, mode: repository.kind });
}

export async function PUT(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const todos = normalizeTodoList(
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).todos
      : undefined,
  );

  const repository = getTodoRepository();
  const { updatedAt } = await repository.replace(todos);

  return Response.json({ todos, updatedAt, mode: repository.kind });
}
