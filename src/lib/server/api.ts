/**
 * Shared helpers for API routes serving live dashboards. Responses are
 * real-time (SSE-polled every few seconds) and must never be cached by the
 * browser or any intermediary, otherwise stale metrics survive reloads.
 */
export function noStoreJson(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) },
  });
}

export function apiError(error: unknown, status = 500): Response {
  return noStoreJson(
    {
      error: error instanceof Error ? error.message : "Internal Server Error",
    },
    { status },
  );
}

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

/**
 * Shared JSON body reader for PUT/POST routes. Returns the parsed value or
 * a ready-to-return 400 response, so every route rejects malformed bodies
 * with the same shape (`{ error }` + `no-store`).
 */
export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      response: noStoreJson(
        { error: "Body must be valid JSON" },
        { status: 400 },
      ),
    };
  }
}
