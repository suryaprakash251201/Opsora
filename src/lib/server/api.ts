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
