import {
  getTodoRepository,
  normalizeTodoList,
} from "@/lib/server/todo-repository";
import { noStoreJson, apiError } from "@/lib/server/api";

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
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return noStoreJson({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const todos = normalizeTodoList(
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).todos
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
