import {
  getTodoRepository,
  normalizeTodoList,
} from "@/lib/server/todo-repository";
import { noStoreJson, apiError, readJsonBody } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repository = getTodoRepository();
    const snapshot = await repository.read();

    return noStoreJson({ ...snapshot, mode: repository.kind });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const todos = normalizeTodoList(
    typeof body.value === "object" && body.value !== null
      ? (body.value as Record<string, unknown>).todos
      : undefined,
  );

  try {
    const repository = getTodoRepository();
    const { updatedAt } = await repository.replace(todos);

    return noStoreJson({ todos, updatedAt, mode: repository.kind });
  } catch (error) {
    return apiError(error);
  }
}
