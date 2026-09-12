import {
  getTodoRepository,
  normalizeTodoList,
} from "@/lib/server/todo-repository";
import { readPackageVersion } from "@/lib/server/package-meta";
import { noStoreJson, apiError, readJsonBody } from "@/lib/server/api";
import type { BackupEnvelope } from "@/lib/server/backup";

export const dynamic = "force-dynamic";

/** GET /api/backup — download a JSON envelope with every server-side bit. */
export async function GET() {
  try {
    const repository = getTodoRepository();
    const snapshot = await repository.read();

    const envelope: BackupEnvelope = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      exportedBy: "opsora",
      appVersion: readPackageVersion(),
      preferences: {
        theme: null,
        sidebarCollapsed: false,
      },
      todos: snapshot.todos,
    };

    const filename = `opsora-backup-${envelope.exportedAt.slice(0, 10)}.json`;

    return new Response(JSON.stringify(envelope, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

/** PUT /api/backup — restore todos from a backup envelope. */
export async function PUT(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const payload = body.value;

  if (
    typeof payload !== "object" ||
    payload === null ||
    (payload as { schemaVersion?: unknown }).schemaVersion !== 1
  ) {
    return noStoreJson(
      {
        error:
          "Unsupported backup — expected a JSON envelope with schemaVersion: 1",
      },
      { status: 400 },
    );
  }

  const todos = normalizeTodoList(
    (payload as { todos?: unknown }).todos,
  );

  try {
    const repository = getTodoRepository();
    const { updatedAt } = await repository.replace(todos);

    return noStoreJson({
      ok: true,
      count: todos.length,
      updatedAt,
      mode: repository.kind,
    });
  } catch (error) {
    return apiError(error);
  }
}
